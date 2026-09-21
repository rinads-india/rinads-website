import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEmailAdapter, createWhatsAppAdapter } from "../src/adapters/email";

describe("runtime notification adapters", () => {
  it("email returns not_configured without webhook", async () => {
    const bare = createEmailAdapter({ webhookUrl: "" });
    const result = await bare.send({
      recipient: "a@example.com",
      templateKey: "hello",
      payload: {},
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "not_configured");
  });

  it("email succeeds on 2xx webhook", async () => {
    const adapter = createEmailAdapter({
      webhookUrl: "https://mail.example/hook",
      fetchImpl: (async () => new Response(null, { status: 204 })) as typeof fetch,
    });
    const result = await adapter.send({
      recipient: "a@example.com",
      templateKey: "hello",
      payload: { subject: "Hi" },
    });
    assert.deepEqual(result, { ok: true });
  });

  it("email fails on non-2xx webhook", async () => {
    const adapter = createEmailAdapter({
      webhookUrl: "https://mail.example/hook",
      fetchImpl: (async () => new Response("nope", { status: 502 })) as typeof fetch,
    });
    const result = await adapter.send({
      recipient: "a@example.com",
      templateKey: "hello",
      payload: {},
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /502/);
  });

  it("whatsapp returns not_configured without supabase credentials", async () => {
    const adapter = createWhatsAppAdapter({ supabaseUrl: "", serviceRoleKey: "" });
    const result = await adapter.send({
      recipient: "whatsapp:+15551234567",
      templateKey: "hello",
      payload: { messageBody: "hi" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "not_configured");
  });

  it("whatsapp maps edge not_configured and sent", async () => {
    const notConfigured = createWhatsAppAdapter({
      supabaseUrl: "https://example.supabase.co",
      serviceRoleKey: "svc",
      fetchImpl: (async () =>
        new Response(JSON.stringify({ status: "not_configured" }), { status: 200 })) as typeof fetch,
    });
    const nc = await notConfigured.send({
      recipient: "+1",
      templateKey: "t",
      payload: { messageBody: "x" },
    });
    assert.equal(nc.ok, false);
    if (!nc.ok) assert.equal(nc.error, "not_configured");

    const sent = createWhatsAppAdapter({
      supabaseUrl: "https://example.supabase.co",
      serviceRoleKey: "svc",
      fetchImpl: (async () =>
        new Response(JSON.stringify({ status: "sent", provider_message_id: "SM1" }), {
          status: 200,
        })) as typeof fetch,
    });
    const ok = await sent.send({
      recipient: "+1",
      templateKey: "t",
      payload: { messageBody: "x" },
    });
    assert.deepEqual(ok, { ok: true });
  });
});
