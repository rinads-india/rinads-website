import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const principal = readFileSync(
  new URL("../lib/agent-gateway/principal.ts", import.meta.url),
  "utf8"
);
const mcpRoute = readFileSync(
  new URL("../app/api/mcp/route.ts", import.meta.url),
  "utf8"
);
const dataClient = readFileSync(
  new URL("../lib/agent-gateway/data-client.ts", import.meta.url),
  "utf8"
);

describe("external-agent delegation consumption", () => {
  it("recognizes and cryptographically verifies only the RINADS delegation bearer format", () => {
    assert.match(principal, /RINADS_AGENT_DELEGATION_TOKEN_PREFIX/);
    assert.match(principal, /verifyRinadsAgentDelegation/);
    assert.match(principal, /isDelegationToken\(token\)/);
  });

  it("matches signed claims to the revocation ledger before resolving a principal", () => {
    assert.match(principal, /external_agent_delegations/);
    assert.match(principal, /token_id,user_id,organization_id,client,scopes,expires_at,revoked_at/);
    assert.match(principal, /const ledgerNotRevoked/);
    assert.match(
      principal,
      /ledger\.revoked_at === null \|\| ledger\.revoked_at === undefined/
    );
    assert.match(principal, /sameScopes\(ledgerScopes, verified\.claims\.scopes\)/);
    assert.match(principal, /ledgerExpirySeconds === verified\.claims\.exp/);
  });

  it("re-checks current membership and RBAC rather than trusting durable token claims", () => {
    assert.match(principal, /loadMemberships/);
    assert.match(principal, /candidate\.organizationId === verified\.claims\.org/);
    assert.match(principal, /candidate\.organizationStatus === "active"/);
    assert.match(principal, /DELEGATION_SCOPE_PERMISSION/);
    assert.match(principal, /permissionRevoked/);
  });

  it("uses service role only for authorization metadata, never as the business-data client", () => {
    assert.match(principal, /createServiceRoleClient/);
    assert.match(principal, /must not become a service-role data path/);
    assert.doesNotMatch(dataClient, /createServiceRoleClient/);
    assert.doesNotMatch(dataClient, /SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("enforces delegated scope before any enabled MCP read executor can run", () => {
    assert.match(mcpRoute, /delegatedScopes\.includes\(input\.capabilityKey\)/);
    assert.match(mcpRoute, /DELEGATION_SCOPE_DENIED/);
    assert.match(mcpRoute, /DELEGATION_RLS_TOKEN_NOT_ENABLED/);
    assert.match(mcpRoute, /resolution\.principal\.authMethod === "delegation"/);
  });

  it("keeps delegated business-data reads fail-closed until an RLS-valid token path exists", () => {
    assert.match(mcpRoute, /RINADS will not substitute a service-role data path/);
    const delegationGate = mcpRoute.indexOf(
      'resolution.principal.authMethod === "delegation"'
    );
    const catalogExecutor = mcpRoute.indexOf("executeRinadsCatalogRead({");
    const orderExecutor = mcpRoute.indexOf("executeRinadsOrderRead({");
    assert.ok(delegationGate >= 0);
    assert.ok(catalogExecutor > delegationGate);
    assert.ok(orderExecutor > delegationGate);
  });
});
