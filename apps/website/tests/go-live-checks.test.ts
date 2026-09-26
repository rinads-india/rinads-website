import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTablePresenceUrl,
  evaluateCommsWorkerConfig,
  evaluateEnvContract,
  evaluateRazorpayConfig,
  evaluateTwilioConfig,
  parseHealthResponse,
} from "../lib/ops/go-live-checks";

const validProdEnv = {
  NEXT_PUBLIC_AUTH_PROVIDER: "supabase",
  USE_DEMO_STORE: "0",
  USE_SUPABASE: "1",
  NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon_key",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_key",
  NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: ".rinads.com",
  NEXT_PUBLIC_RINAGLOW_URL: "https://glow.rinads.com",
  NEXT_PUBLIC_SITE_URL: "https://www.rinads.com",
};

describe("evaluateEnvContract", () => {
  it("passes a fully-configured production env", () => {
    const result = evaluateEnvContract(validProdEnv);
    assert.equal(result.ok, true);
    assert.deepEqual(result.problems, []);
  });

  it("fails demo auth and demo store", () => {
    const result = evaluateEnvContract({
      ...validProdEnv,
      NEXT_PUBLIC_AUTH_PROVIDER: "demo",
      USE_DEMO_STORE: "1",
    });
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((p) => /AUTH_PROVIDER/.test(p)));
    assert.ok(result.problems.some((p) => /USE_DEMO_STORE/.test(p)));
  });

  it("rejects a cookie domain with scheme or without a leading dot", () => {
    const noDot = evaluateEnvContract({ ...validProdEnv, NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: "rinads.com" });
    assert.ok(noDot.problems.some((p) => /leading-dot/.test(p)));
    const withScheme = evaluateEnvContract({ ...validProdEnv, NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: "https://rinads.com" });
    assert.equal(withScheme.ok, false);
  });

  it("flags a service role key that equals the anon key", () => {
    const result = evaluateEnvContract({ ...validProdEnv, SUPABASE_SERVICE_ROLE_KEY: "anon_key" });
    assert.ok(result.problems.some((p) => /must not equal the anon key/.test(p)));
  });

  it("warns (not fails) on missing optional public URLs", () => {
    const env = { ...validProdEnv } as Record<string, string | undefined>;
    delete env.NEXT_PUBLIC_RINAGLOW_URL;
    delete env.NEXT_PUBLIC_SITE_URL;
    const result = evaluateEnvContract(env);
    assert.equal(result.ok, true);
    assert.equal(result.warnings.length, 2);
  });
});

describe("parseHealthResponse", () => {
  it("recognizes a healthy contract", () => {
    const parsed = parseHealthResponse({ status: "ok", checks: { productionEnvContract: "ok" } });
    assert.deepEqual(parsed, { reachable: true, status: "ok", contractOk: true });
  });
  it("treats degraded as contract failure", () => {
    const parsed = parseHealthResponse({ status: "degraded", checks: { productionEnvContract: "failed" } });
    assert.equal(parsed.contractOk, false);
  });
  it("handles a non-object body", () => {
    assert.equal(parseHealthResponse("nope").contractOk, false);
  });
});

describe("buildTablePresenceUrl", () => {
  it("builds a read-only, zero-row REST url and trims trailing slashes", () => {
    assert.equal(
      buildTablePresenceUrl("https://proj.supabase.co/", "site_leads"),
      "https://proj.supabase.co/rest/v1/site_leads?select=*&limit=0",
    );
  });
});

describe("provider preflights", () => {
  it("twilio requires all three secrets and forbids NEXT_PUBLIC exposure", () => {
    assert.equal(evaluateTwilioConfig({}).ok, false);
    const ok = evaluateTwilioConfig({
      RINADS_TWILIO_SID: "s",
      RINADS_TWILIO_TOKEN: "t",
      RINADS_TWILIO_WHATSAPP_FROM: "+123",
    });
    assert.equal(ok.ok, true);
    const leaked = evaluateTwilioConfig({
      RINADS_TWILIO_SID: "s",
      RINADS_TWILIO_TOKEN: "t",
      RINADS_TWILIO_WHATSAPP_FROM: "+123",
      NEXT_PUBLIC_TWILIO_TOKEN: "leak",
    });
    assert.equal(leaked.ok, false);
  });

  it("comms worker stays ok+disabled by default and validates when enabled", () => {
    const disabled = evaluateCommsWorkerConfig({});
    assert.equal(disabled.ok, true);
    assert.ok(disabled.warnings.some((w) => /disabled/.test(w)));

    const enabledMissing = evaluateCommsWorkerConfig({ RINADS_COMMUNICATIONS_WORKER_ENABLED: "1" });
    assert.equal(enabledMissing.ok, false);

    const enabledOk = evaluateCommsWorkerConfig({
      RINADS_COMMUNICATIONS_WORKER_ENABLED: "1",
      SUPABASE_URL: "https://proj.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "srv",
      RINADS_CRON_SECRET: "same",
      RINADS_CRON_INVOCATION_TOKEN: "same",
      RINADS_COMMUNICATIONS_ORGANIZATION_IDS: "org_1, org_2",
    });
    assert.equal(enabledOk.ok, true);
  });

  it("razorpay requires live keys and forbids secret exposure", () => {
    assert.equal(evaluateRazorpayConfig({}).ok, false);
    const ok = evaluateRazorpayConfig({
      RAZORPAY_KEY_ID: "id",
      RAZORPAY_KEY_SECRET: "secret",
      RAZORPAY_WEBHOOK_SECRET: "whsec",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "id",
    });
    assert.equal(ok.ok, true);
  });
});
