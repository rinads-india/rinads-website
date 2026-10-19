import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SalonCommunicationsRepository } from "../src/communications-repository";
import {
  evaluateWhatsAppSendGate,
  getWhatsAppReadiness,
  isSandboxAllowlisted,
  loadWhatsAppOrgState,
  normalizeWhatsAppRecipient,
  parseWhatsAppOrgConfig,
} from "../src/whatsapp-readiness";
import { createSalonMockClient } from "./mock-client";

const ORG_ID = "org_whatsapp_ready";

describe("WhatsApp recipient + config parsing", () => {
  it("normalizes 10-digit Indian numbers and strips formatting", () => {
    assert.equal(normalizeWhatsAppRecipient("90000 00000"), "+919000000000");
    assert.equal(normalizeWhatsAppRecipient("+91-90000-00000"), "+919000000000");
    assert.equal(normalizeWhatsAppRecipient(""), "");
  });

  it("defaults missing settings to mode off with an empty allowlist", () => {
    assert.deepEqual(parseWhatsAppOrgConfig(undefined), { mode: "off", sandboxAllowlist: [], updatedAt: undefined });
    assert.equal(parseWhatsAppOrgConfig({ communications: { whatsapp: { mode: "sandbox", sandboxAllowlist: ["+91 90000 00001", "9000000001"] } } }).sandboxAllowlist.length, 1);
  });

  it("treats sandbox allowlist as normalized equality", () => {
    assert.equal(isSandboxAllowlisted("9000000001", ["+91 90000 00001"]), true);
    assert.equal(isSandboxAllowlisted("+919000000002", ["+919000000001"]), false);
  });
});

describe("evaluateWhatsAppSendGate", () => {
  const sandbox = { mode: "sandbox" as const, sandboxAllowlist: ["+919000000001"] };

  it("blocks when the send flag is off even if mode is live", () => {
    const gate = evaluateWhatsAppSendGate({ sendEnabled: false, config: { mode: "live", sandboxAllowlist: [] }, recipient: "+919000000001" });
    assert.equal(gate.allowed, false);
    if (!gate.allowed) assert.match(gate.reason, /send_enabled/);
  });

  it("blocks sandbox recipients outside the allowlist and allows listed ones", () => {
    const blocked = evaluateWhatsAppSendGate({ sendEnabled: true, config: sandbox, recipient: "+919000000099" });
    const allowed = evaluateWhatsAppSendGate({ sendEnabled: true, config: sandbox, recipient: "9000000001" });
    assert.equal(blocked.allowed, false);
    assert.equal(allowed.allowed, true);
  });

  it("allows live mode once the flag is on", () => {
    const gate = evaluateWhatsAppSendGate({ sendEnabled: true, config: { mode: "live", sandboxAllowlist: [] }, recipient: "+919000000001" });
    assert.deepEqual(gate, { allowed: true, mode: "live" });
  });
});

describe("loadWhatsAppOrgState + readiness", () => {
  it("reads the flag and settings JSON as off when nothing is configured", async () => {
    const client = createSalonMockClient();
    await client.from("organization_settings").insert({ organization_id: ORG_ID, settings: {} });
    const state = await loadWhatsAppOrgState(client, ORG_ID);
    assert.equal(state.sendEnabled, false);
    assert.equal(state.config.mode, "off");
  });

  it("surfaces an honest Settings checklist that is not ready while ops stay off", async () => {
    const client = createSalonMockClient();
    await client.from("organization_settings").insert({
      organization_id: ORG_ID,
      settings: { communications: { whatsapp: { mode: "sandbox", sandboxAllowlist: ["+919000000001"] } } },
    });
    await client.from("feature_flag_overrides").insert({
      flag_key: "salon.whatsapp.send_enabled",
      organization_id: ORG_ID,
      enabled: true,
    });
    await client.from("notification_outbox").insert({
      organization_id: ORG_ID,
      channel: "whatsapp",
      template_key: "salon.booking.created",
      recipient: "+919000000001",
      payload: {},
      idempotency_key: "ready-1",
      status: "not_configured",
      last_error: "Twilio credentials are not configured.",
      attempts: 1,
    });
    const readiness = await getWhatsAppReadiness(client, new SalonCommunicationsRepository(client), ORG_ID);
    assert.equal(readiness.sendEnabled, true);
    assert.equal(readiness.mode, "sandbox");
    assert.equal(readiness.readyForSandboxTick, true);
    assert.equal(readiness.checklist.find((item) => item.key === "ops")?.ok, false);
    assert.match(readiness.operatorSummary, /once a founder enables the worker/);
    assert.equal(readiness.funnel.notConfigured, 1);
  });
});
