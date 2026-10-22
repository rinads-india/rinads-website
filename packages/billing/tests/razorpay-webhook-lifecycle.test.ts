import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  extractRazorpaySubscriptionEntity,
  processRazorpayWebhook,
} from "../src/webhooks";

type Row = Record<string, unknown>;

function signedBody(status: string, event: string) {
  const rawBody = JSON.stringify({
    event,
    created_at: 1792640000,
    payload: {
      subscription: {
        entity: {
          id: "sub_live_123",
          status,
          plan_id: "plan_growth_monthly",
          current_start: 1792640000,
          current_end: 1795318400,
          notes: {
            organization_id: "org_123",
            plan_key: "growth",
          },
        },
      },
    },
  });
  const secret = "webhook_secret";
  const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return { rawBody, secret, signature };
}

function recordingClient(existingEvent = false) {
  const inserts: Array<{ table: string; row: Row }> = [];
  const upserts: Array<{ table: string; rows: Row[] }> = [];

  const client = {
    from: (table: string) => ({
      insert: async (row: Row) => {
        inserts.push({ table, row });
        return { error: null };
      },
      upsert: async (rows: Row[]) => {
        upserts.push({ table, rows });
        return { error: null };
      },
      select: () => ({
        eq: async () => ({
          data: table === "billing_events" && existingEvent ? [{ id: "evt_existing" }] : [],
          error: null,
        }),
      }),
    }),
  };

  return { client, inserts, upserts };
}

describe("Razorpay subscription webhooks", () => {
  it("extracts current nested subscription.entity payloads", () => {
    const { rawBody } = signedBody("active", "subscription.activated");
    const entity = extractRazorpaySubscriptionEntity(JSON.parse(rawBody));
    assert.equal(entity?.id, "sub_live_123");
    assert.equal(entity?.notes?.organization_id, "org_123");
  });

  it("activates organization entitlement only from an active subscription event", async () => {
    const { rawBody, secret, signature } = signedBody("active", "subscription.activated");
    const recorder = recordingClient();

    const result = await processRazorpayWebhook(recorder.client as never, {
      rawBody,
      signature,
      webhookSecret: secret,
      eventId: "event_activated_123",
      resolveOrganizationId: async () => "org_123",
      resolvePlanKey: async () => "growth",
    });

    assert.deepEqual(result, { ok: true });
    const orgWrite = recorder.upserts.find((write) => write.table === "organization_subscriptions");
    const providerWrite = recorder.upserts.find((write) => write.table === "billing_subscriptions");
    assert.equal(orgWrite?.rows[0]?.status, "active");
    assert.equal(orgWrite?.rows[0]?.plan_key, "growth");
    assert.equal(providerWrite?.rows[0]?.status, "active");
    assert.equal(recorder.inserts.at(-1)?.table, "billing_events");
    assert.equal(recorder.inserts.at(-1)?.row.idempotency_key, "event_activated_123");
  });

  it("revokes paid entitlement when Razorpay marks the subscription pending", async () => {
    const { rawBody, secret, signature } = signedBody("pending", "subscription.pending");
    const recorder = recordingClient();

    const result = await processRazorpayWebhook(recorder.client as never, {
      rawBody,
      signature,
      webhookSecret: secret,
      resolveOrganizationId: async () => "org_123",
      resolvePlanKey: async () => "growth",
    });

    assert.deepEqual(result, { ok: true });
    const orgWrite = recorder.upserts.find((write) => write.table === "organization_subscriptions");
    const providerWrite = recorder.upserts.find((write) => write.table === "billing_subscriptions");
    assert.equal(orgWrite?.rows[0]?.status, "past_due");
    assert.equal(providerWrite?.rows[0]?.status, "pending");
  });

  it("does not acknowledge a new subscription event when organization resolution fails", async () => {
    const { rawBody, secret, signature } = signedBody("active", "subscription.activated");
    const recorder = recordingClient();

    const result = await processRazorpayWebhook(recorder.client as never, {
      rawBody,
      signature,
      webhookSecret: secret,
      resolveOrganizationId: async () => null,
      resolvePlanKey: async () => "growth",
    });

    assert.deepEqual(result, {
      ok: false,
      error: "Subscription organization unresolved",
      status: 422,
    });
    assert.equal(recorder.inserts.length, 0);
    assert.equal(recorder.upserts.length, 0);
  });

  it("deduplicates an already recorded provider event before side effects", async () => {
    const { rawBody, secret, signature } = signedBody("active", "subscription.activated");
    const recorder = recordingClient(true);

    const result = await processRazorpayWebhook(recorder.client as never, {
      rawBody,
      signature,
      webhookSecret: secret,
      eventId: "event_duplicate",
      resolveOrganizationId: async () => "org_123",
      resolvePlanKey: async () => "growth",
    });

    assert.deepEqual(result, { ok: true, duplicate: true });
    assert.equal(recorder.inserts.length, 0);
    assert.equal(recorder.upserts.length, 0);
  });
});
