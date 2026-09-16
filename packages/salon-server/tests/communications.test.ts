import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SalonCommunicationsRepository } from "../src/communications-repository";
import { runSalonCommunicationsWorker } from "../src/communications-worker";
import { processSalonNotificationOutbox, validateWhatsAppBody } from "../src/notification-delivery";
import type { SalonCampaignsRepository } from "../src/campaigns-repository";
import { createSalonMockClient } from "./mock-client";

const ORG_ID = "org_communications";

async function seedOutbox(client: ReturnType<typeof createSalonMockClient>, status: string, suffix: string, extra = {}) {
  const { data } = await client.from("notification_outbox").insert({
    organization_id: ORG_ID,
    channel: "whatsapp",
    template_key: "salon.campaign.message",
    recipient: `+9190000000${suffix}`,
    payload: { messageBody: "Hello" },
    idempotency_key: `communications-${suffix}`,
    status,
    attempts: 3,
    last_error: status === "failed" ? "provider error" : null,
    ...extra,
  });
  return data![0];
}

describe("SalonCommunicationsRepository", () => {
  it("filters and paginates the tenant-scoped outbox", async () => {
    const client = createSalonMockClient();
    await seedOutbox(client, "failed", "01");
    await seedOutbox(client, "sent", "02");
    await seedOutbox(client, "failed", "03");
    await seedOutbox(client, "failed", "99", { organization_id: "another_org" });
    const repo = new SalonCommunicationsRepository(client);
    const first = await repo.list(ORG_ID, { statuses: ["failed"], pageSize: 1 });
    assert.ok(first.ok);
    if (!first.ok) return;
    assert.equal(first.data.rows.length, 1);
    assert.equal(first.data.total, 2);
    assert.equal(first.data.hasMore, true);
    const second = await repo.list(ORG_ID, { statuses: ["failed"], pageSize: 1, page: 2 });
    assert.ok(second.ok);
    if (second.ok) assert.equal(second.data.rows.length, 1);
  });

  it("returns detail with an append-only delivery timeline and funnel metrics", async () => {
    const client = createSalonMockClient();
    const row = await seedOutbox(client, "delivered", "04");
    await client.from("notification_delivery_events").insert([
      { organization_id: ORG_ID, notification_outbox_id: row.id, provider: "twilio", provider_message_id: "SM1", provider_status: "sent", raw_payload: {} },
      { organization_id: ORG_ID, notification_outbox_id: row.id, provider: "twilio", provider_message_id: "SM1", provider_status: "delivered", raw_payload: {} },
    ]);
    const repo = new SalonCommunicationsRepository(client);
    const details = await repo.details(ORG_ID, String(row.id));
    assert.ok(details.ok);
    if (details.ok) assert.deepEqual(details.data.timeline.map((event) => event.providerStatus), ["sent", "delivered"]);
    const funnel = await repo.funnel(ORG_ID);
    assert.ok(funnel.ok);
    if (funnel.ok) assert.equal(funnel.data.deliveryRatePct, 100);
  });

  it("bulk retry is bounded, resets attempts/errors, reports has_more, and synchronizes recipients", async () => {
    const client = createSalonMockClient();
    const campaignId = "campaign_1";
    for (let index = 0; index < 3; index++) {
      const { data: recipients } = await client.from("salon_campaign_recipients").insert({
        organization_id: ORG_ID,
        campaign_id: campaignId,
        customer_id: `customer_${index}`,
        status: "failed",
      });
      await seedOutbox(client, "failed", `1${index}`, { campaign_recipient_id: recipients![0].id });
    }
    const repo = new SalonCommunicationsRepository(client);
    const retried = await repo.retryCampaign(ORG_ID, campaignId, 2);
    assert.ok(retried.ok);
    if (!retried.ok) return;
    assert.equal(retried.data.count, 2);
    assert.equal(retried.data.hasMore, true);
    const resetRows = client.tables.get("notification_outbox")!.filter((row) => row.status === "pending");
    assert.equal(resetRows.length, 2);
    assert.ok(resetRows.every((row) => row.attempts === 0 && row.last_error === null));
    assert.equal(client.tables.get("salon_campaign_recipients")!.filter((row) => row.status === "pending").length, 2);
    const repeated = await repo.retryCampaign(ORG_ID, campaignId, 2);
    assert.ok(repeated.ok);
    if (repeated.ok) assert.equal(repeated.data.count, 1);
  });

  it("gives concurrent bounded workers disjoint atomic claims", async () => {
    const client = createSalonMockClient();
    for (let index = 0; index < 4; index++) await seedOutbox(client, "pending", `3${index}`);
    const recipients: string[] = [];
    const adapter = {
      send: async (input: { recipient: string }) => {
        recipients.push(input.recipient);
        return { status: "sent" as const, providerMessageId: `SM${recipients.length}` };
      },
    };
    const [first, second] = await Promise.all([
      processSalonNotificationOutbox(client, adapter, { batchSize: 2 }),
      processSalonNotificationOutbox(client, adapter, { batchSize: 2 }),
    ]);
    assert.equal(first.processed + second.processed, 4);
    assert.equal(new Set(recipients).size, 4);
  });
});

describe("communications worker controls", () => {
  it("does nothing while disabled", async () => {
    const client = createSalonMockClient();
    await seedOutbox(client, "pending", "20");
    let sends = 0;
    const result = await runSalonCommunicationsWorker(
      client,
      {} as SalonCampaignsRepository,
      { send: async () => { sends++; return { status: "sent", providerMessageId: "SM1" }; } },
      { enabled: false, organizationIds: [ORG_ID] }
    );
    assert.equal(result.enabled, false);
    assert.equal(sends, 0);
  });

  it("claims no more than the configured delivery batch", async () => {
    const client = createSalonMockClient();
    await seedOutbox(client, "pending", "21");
    await seedOutbox(client, "pending", "22");
    await seedOutbox(client, "pending", "23");
    const campaigns = { listCampaigns: async () => ({ ok: true, data: [] }) } as unknown as SalonCampaignsRepository;
    const result = await runSalonCommunicationsWorker(
      client,
      campaigns,
      { send: async () => ({ status: "sent", providerMessageId: "SM1" }) },
      { enabled: true, organizationIds: [ORG_ID], batchSize: 2, throughputDelayMs: 0 }
    );
    assert.equal(result.delivery.processed, 2);
    assert.equal(client.tables.get("notification_outbox")!.filter((row) => row.status === "pending").length, 1);
  });

  it("advances only due approved scheduled campaigns", async () => {
    const client = createSalonMockClient();
    const advanced: string[] = [];
    const campaigns = {
      listCampaigns: async () => ({
        ok: true,
        data: [
          { id: "due", status: "approved", scheduledAt: "2026-09-15T00:00:00.000Z" },
          { id: "future", status: "approved", scheduledAt: "2026-09-17T00:00:00.000Z" },
          { id: "manual", status: "approved" },
        ],
      }),
      sendCampaign: async (_organizationId: string, campaignId: string) => {
        advanced.push(campaignId);
        return { ok: true, data: { queued: 0, skipped: 0 } };
      },
    } as unknown as SalonCampaignsRepository;
    const result = await runSalonCommunicationsWorker(
      client,
      campaigns,
      { send: async () => ({ status: "sent", providerMessageId: "unused" }) },
      { enabled: true, organizationIds: [ORG_ID], now: new Date("2026-09-16T00:00:00.000Z") }
    );
    assert.deepEqual(advanced, ["due"]);
    assert.equal(result.campaignsAdvanced, 1);
  });

  it("sends the explicit tenant allowlist and bounded limit to review automation", async () => {
    const client = createSalonMockClient();
    const requests: Array<{ authorization: string | null; body: unknown }> = [];
    const campaigns = { listCampaigns: async () => ({ ok: true, data: [] }) } as unknown as SalonCampaignsRepository;
    const result = await runSalonCommunicationsWorker(
      client,
      campaigns,
      { send: async () => ({ status: "sent", providerMessageId: "unused" }) },
      {
        enabled: true,
        organizationIds: [ORG_ID, "org_communications_2"],
        reviewsAutomationUrl: "https://example.test/api/automations/process",
        reviewsAutomationToken: "worker-secret",
        reviewsAutomationLimit: 500,
        fetchImpl: async (_url, init) => {
          requests.push({
            authorization: new Headers(init?.headers).get("authorization"),
            body: JSON.parse(String(init?.body)),
          });
          return new Response(null, { status: 200 });
        },
      }
    );
    assert.equal(result.reviewsAutomationTriggered, true);
    assert.deepEqual(requests, [{
      authorization: "Bearer worker-secret",
      body: { organizationIds: [ORG_ID, "org_communications_2"], limit: 100 },
    }]);
  });

  it("applies a throughput delay only between claimed sends", async () => {
    const client = createSalonMockClient();
    await seedOutbox(client, "pending", "40");
    await seedOutbox(client, "pending", "41");
    const delays: number[] = [];
    const result = await processSalonNotificationOutbox(
      client,
      { send: async () => ({ status: "sent", providerMessageId: "SM" }) },
      { batchSize: 2, throughputDelayMs: 125, sleep: async (ms) => { delays.push(ms); } }
    );
    assert.equal(result.processed, 2);
    assert.deepEqual(delays, [125]);
  });
});

describe("WhatsApp message validation", () => {
  it("accepts 1600 characters and rejects 1601 with an explicit error", () => {
    assert.equal(validateWhatsAppBody("x".repeat(1600)).ok, true);
    const result = validateWhatsAppBody("x".repeat(1601));
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /1600/);
  });
});
