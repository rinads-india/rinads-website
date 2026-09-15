import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  createTwilioWhatsAppAdapter,
  isForwardStatusTransition,
  mapTwilioStatusToOutboxStatus,
  processSalonNotificationOutbox,
  type SalonNotificationAdapter,
  type TwilioSendResult,
} from "../src/notification-delivery";
import { createSalonMockClient } from "./mock-client";

const ORG_ID = "org_notify_test";

describe("createTwilioWhatsAppAdapter", () => {
  it("reports a real provider message id on a genuine 2xx response", async () => {
    const originalFetch = global.fetch;
    global.fetch = mock.fn(async () =>
      new Response(JSON.stringify({ status: "sent", provider_message_id: "SM123" }), { status: 200 })
    ) as unknown as typeof fetch;
    try {
      const adapter = createTwilioWhatsAppAdapter({ supabaseUrl: "https://example.supabase.co", serviceRoleKey: "svc-key" });
      const result = await adapter.send({ recipient: "+919000000001", templateKey: "salon.campaign.message", payload: { messageBody: "Hi" } });
      assert.deepEqual(result, { status: "sent", providerMessageId: "SM123" });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("never fabricates success when Twilio credentials are not configured", async () => {
    const originalFetch = global.fetch;
    global.fetch = mock.fn(async () => new Response(JSON.stringify({ status: "not_configured" }), { status: 200 })) as unknown as typeof fetch;
    try {
      const adapter = createTwilioWhatsAppAdapter({ supabaseUrl: "https://example.supabase.co", serviceRoleKey: "svc-key" });
      const result = await adapter.send({ recipient: "+919000000001", templateKey: "salon.campaign.message", payload: {} });
      assert.deepEqual(result, { status: "not_configured" });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("surfaces a real failure on a non-2xx response instead of retrying silently forever", async () => {
    const originalFetch = global.fetch;
    global.fetch = mock.fn(async () => new Response(JSON.stringify({ error: "Twilio rejected the request" }), { status: 502 })) as unknown as typeof fetch;
    try {
      const adapter = createTwilioWhatsAppAdapter({ supabaseUrl: "https://example.supabase.co", serviceRoleKey: "svc-key" });
      const result = await adapter.send({ recipient: "+919000000001", templateKey: "salon.campaign.message", payload: {} });
      assert.equal(result.status, "failed");
      if (result.status === "failed") assert.match(result.error, /Twilio rejected the request/);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("surfaces a network-level failure honestly", async () => {
    const originalFetch = global.fetch;
    global.fetch = mock.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    try {
      const adapter = createTwilioWhatsAppAdapter({ supabaseUrl: "https://example.supabase.co", serviceRoleKey: "svc-key" });
      const result = await adapter.send({ recipient: "+919000000001", templateKey: "salon.campaign.message", payload: {} });
      assert.equal(result.status, "failed");
      if (result.status === "failed") assert.match(result.error, /network down/);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe("mapTwilioStatusToOutboxStatus", () => {
  it("maps every documented Twilio WhatsApp status to our vocabulary", () => {
    assert.equal(mapTwilioStatusToOutboxStatus("queued"), "pending");
    assert.equal(mapTwilioStatusToOutboxStatus("accepted"), "pending");
    assert.equal(mapTwilioStatusToOutboxStatus("sending"), "processing");
    assert.equal(mapTwilioStatusToOutboxStatus("sent"), "sent");
    assert.equal(mapTwilioStatusToOutboxStatus("delivered"), "delivered");
    assert.equal(mapTwilioStatusToOutboxStatus("read"), "read");
    assert.equal(mapTwilioStatusToOutboxStatus("failed"), "failed");
    assert.equal(mapTwilioStatusToOutboxStatus("undelivered"), "failed");
  });

  it("falls back to pending for an unrecognized status rather than throwing", () => {
    assert.equal(mapTwilioStatusToOutboxStatus("something_new"), "pending");
  });
});

describe("isForwardStatusTransition", () => {
  it("allows forward progression", () => {
    assert.ok(isForwardStatusTransition("sent", "delivered"));
    assert.ok(isForwardStatusTransition("pending", "sent"));
    assert.ok(isForwardStatusTransition("delivered", "read"));
  });

  it("rejects an out-of-order callback moving a message backwards", () => {
    assert.ok(!isForwardStatusTransition("delivered", "sent"));
    assert.ok(!isForwardStatusTransition("read", "delivered"));
  });

  it("treats same-status re-delivery as a no-op forward transition", () => {
    assert.ok(isForwardStatusTransition("sent", "sent"));
  });
});

function fakeAdapter(result: TwilioSendResult): SalonNotificationAdapter {
  return { send: async () => result };
}

async function seedOutboxRow(client: ReturnType<typeof createSalonMockClient>, overrides: Record<string, unknown> = {}) {
  const { data } = await client.from("notification_outbox").insert({
    organization_id: ORG_ID,
    channel: "whatsapp",
    template_key: "salon.campaign.message",
    recipient: "+919000000001",
    payload: { messageBody: "Hi" },
    idempotency_key: `key-${Math.random()}`,
    status: "pending",
    attempts: 0,
    ...overrides,
  });
  return data![0];
}

describe("processSalonNotificationOutbox", () => {
  it("marks a successful send with the real provider message id and clears backoff state", async () => {
    const client = createSalonMockClient();
    await seedOutboxRow(client);
    const summary = await processSalonNotificationOutbox(client, fakeAdapter({ status: "sent", providerMessageId: "SM999" }));
    assert.equal(summary.sent, 1);
    const [row] = client.tables.get("notification_outbox")!;
    assert.equal(row.status, "sent");
    assert.equal(row.provider, "twilio");
    assert.equal(row.provider_message_id, "SM999");
  });

  it("never fabricates delivery when Twilio is not configured, and reschedules a longer recheck", async () => {
    const client = createSalonMockClient();
    await seedOutboxRow(client);
    const now = new Date("2026-09-08T00:00:00.000Z");
    const summary = await processSalonNotificationOutbox(client, fakeAdapter({ status: "not_configured" }), { now, notConfiguredRecheckMs: 900_000 });
    assert.equal(summary.notConfigured, 1);
    const [row] = client.tables.get("notification_outbox")!;
    assert.equal(row.status, "not_configured");
    assert.equal(row.next_attempt_at, new Date(now.getTime() + 900_000).toISOString());
  });

  it("applies bounded exponential backoff on failure, without exhausting attempts immediately", async () => {
    const client = createSalonMockClient();
    await seedOutboxRow(client, { attempts: 1 });
    const now = new Date("2026-09-08T00:00:00.000Z");
    const summary = await processSalonNotificationOutbox(client, fakeAdapter({ status: "failed", error: "Twilio 500" }), {
      now,
      maxAttempts: 5,
      baseBackoffMs: 1000,
      capBackoffMs: 60_000,
    });
    assert.equal(summary.failed, 1);
    const [row] = client.tables.get("notification_outbox")!;
    assert.equal(row.status, "failed");
    assert.equal(row.attempts, 2);
    // attempt 2 -> min(60000, 1000 * 2^2) = 4000ms
    assert.equal(row.next_attempt_at, new Date(now.getTime() + 4000).toISOString());
  });

  it("moves a message to dead_letter once maxAttempts is reached", async () => {
    const client = createSalonMockClient();
    await seedOutboxRow(client, { attempts: 4 });
    const summary = await processSalonNotificationOutbox(client, fakeAdapter({ status: "failed", error: "Twilio 500" }), { maxAttempts: 5 });
    assert.equal(summary.deadLetter, 1);
    const [row] = client.tables.get("notification_outbox")!;
    assert.equal(row.status, "dead_letter");
    assert.equal(row.attempts, 5);
  });

  it("skips a row whose next_attempt_at is still in the future", async () => {
    const client = createSalonMockClient();
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await seedOutboxRow(client, { status: "failed", next_attempt_at: future });
    const summary = await processSalonNotificationOutbox(client, fakeAdapter({ status: "sent", providerMessageId: "SM1" }));
    assert.equal(summary.processed, 0);
  });

  it("only processes whatsapp-channel rows", async () => {
    const client = createSalonMockClient();
    await seedOutboxRow(client, { channel: "email" });
    const summary = await processSalonNotificationOutbox(client, fakeAdapter({ status: "sent", providerMessageId: "SM1" }));
    assert.equal(summary.processed, 0);
  });
});
