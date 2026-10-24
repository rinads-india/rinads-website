import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const route = readFileSync(
  new URL("../app/api/v1/agent/delegations/route.ts", import.meta.url),
  "utf8"
);

describe("external-agent delegation issuance route", () => {
  it("requires RI authentication and active organization membership", () => {
    assert.match(route, /supabase\.auth\.getUser\(\)/);
    assert.match(route, /loadMemberships/);
    assert.match(route, /candidate\.organizationId === organizationId/);
    assert.match(route, /candidate\.organizationStatus === "active"/);
  });

  it("maps every initial READ scope to an existing business permission", () => {
    assert.match(route, /"intelligence\.business_summary\.read": "org\.read"/);
    assert.match(route, /"commerce\.catalog\.read": "commerce\.catalog\.read"/);
    assert.match(route, /"commerce\.order\.read": "commerce\.order\.read"/);
    assert.match(route, /Missing permission required for scope/);
  });

  it("does not issue internal-agent delegations through the external endpoint", () => {
    assert.match(route, /body\.client === "internal"/);
  });

  it("persists token metadata but never the raw delegation token", () => {
    assert.match(route, /token_id: issued\.claims\.jti/);
    assert.match(route, /expires_at: expiresAt/);
    assert.doesNotMatch(route, /token:\s*issued\.token[\s\S]*\.insert\(/);
  });

  it("fails closed if audit evidence cannot be written", () => {
    assert.match(route, /if \(auditError\)/);
    assert.match(route, /revoke_external_agent_delegation/);
    assert.match(route, /Delegation audit could not be recorded/);
  });

  it("does not use a service-role client or accept caller roles/permissions", () => {
    assert.doesNotMatch(route, /createServiceRoleClient/);
    assert.doesNotMatch(route, /body\.role/);
    assert.doesNotMatch(route, /body\.permissions/);
  });
});
