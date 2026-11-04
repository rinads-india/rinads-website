import assert from "node:assert/strict";
import test from "node:test";
import {
  HEALTH, MARKETING, buildChecks, validHealth, validAnonymousGate,
  validPublicRoute, validRinpoCapability,
} from "./production-public-smoke.mjs";

test("fixed health inventory covers seven canonical public domains", () => {
  assert.equal(Object.keys(HEALTH).length, 7);
  assert.equal(Object.keys(MARKETING).length, 7);
  const checks = buildChecks();
  assert.equal(checks.length, 16);
  assert.ok(checks.every((c) => c.url.startsWith("https://")));
  assert.ok(checks.some((c) => c.kind === "gate"));
  assert.ok(checks.some((c) => c.kind === "rinpo"));
});

test("health must report HTTP 200 and productionEnvContract ok", () => {
  assert.equal(validHealth(200, { status: "ok", checks: { productionEnvContract: "ok" } }), true);
  assert.equal(validHealth(200, { status: "ok", checks: { productionEnvContract: "failed" } }), false);
  assert.equal(validHealth(503, { status: "ok", checks: { productionEnvContract: "ok" } }), false);
});

test("anonymous OS must redirect within the canonical website to signup", () => {
  assert.equal(validAnonymousGate(307, "/signup?mode=login&next=%2Fos"), true);
  assert.equal(validAnonymousGate(200, ""), false);
  assert.equal(validAnonymousGate(307, "https://attacker.example/signup?next=%2Fos"), false);
  assert.equal(validAnonymousGate(307, "/signup?next=%2Fadmin"), false);
});

test("homepage checks authentic SSR brand and synthetic demo labels", () => {
  const html = "<html><body><h1>Business, simplified.</h1><p>RINPO</p><small>Synthetic demo</small></body></html>";
  assert.equal(validPublicRoute("/", 200, html), true);
  assert.equal(validPublicRoute("/", 200, "<html>RINADS</html>"), false);
  assert.equal(validPublicRoute("/pricing", 200, "<html><title>Pricing | RINADS</title></html>"), true);
  assert.equal(validPublicRoute("/pricing", 500, "<html><title>Pricing | RINADS</title></html>"), false);
});

test("RINPO capability is valid when disabled; boolean flag required", () => {
  assert.equal(validRinpoCapability(200, { enabled: false }), true);
  assert.equal(validRinpoCapability(200, { enabled: true }), true);
  assert.equal(validRinpoCapability(200, { enabled: "false" }), false);
  assert.equal(validRinpoCapability(401, { enabled: false }), false);
});
