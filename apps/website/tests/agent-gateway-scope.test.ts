import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { OrgMembership } from "@rinads/tenancy";
import { resolveRinadsAgentScope } from "../lib/agent-gateway/scope";

function membership(
  organizationId: string,
  organizationStatus: OrgMembership["organizationStatus"] = "active"
): OrgMembership {
  return {
    organizationId,
    organizationName: `Organization ${organizationId}`,
    organizationSlug: organizationId,
    organizationStatus,
    roleKey: "founder",
    roleId: `role_${organizationId}`,
    permissions: ["org.read"],
  };
}

describe("RINADS agent organization scope", () => {
  it("resolves a bearer identity only when exactly one active organization exists", () => {
    const result = resolveRinadsAgentScope({
      memberships: [membership("org_a")],
      authMethod: "bearer",
    });

    assert.equal(result.status, "resolved");
    if (result.status === "resolved") assert.equal(result.membership.organizationId, "org_a");
  });

  it("does not let a bearer identity select an organization id", () => {
    const result = resolveRinadsAgentScope({
      memberships: [membership("org_a"), membership("org_b")],
      authMethod: "bearer",
      activeOrganizationId: "org_b",
    });

    assert.equal(result.status, "scope_required");
  });

  it("lets a first-party session reuse a valid active organization cookie", () => {
    const result = resolveRinadsAgentScope({
      memberships: [membership("org_a"), membership("org_b")],
      authMethod: "session",
      activeOrganizationId: "org_b",
    });

    assert.equal(result.status, "resolved");
    if (result.status === "resolved") assert.equal(result.membership.organizationId, "org_b");
  });

  it("does not trust an invalid session organization id", () => {
    const result = resolveRinadsAgentScope({
      memberships: [membership("org_a"), membership("org_b")],
      authMethod: "session",
      activeOrganizationId: "org_outside_memberships",
    });

    assert.equal(result.status, "scope_required");
  });

  it("rejects identities without an active membership", () => {
    const result = resolveRinadsAgentScope({
      memberships: [membership("org_a", "suspended")],
      authMethod: "session",
      activeOrganizationId: "org_a",
    });

    assert.equal(result.status, "no_active_membership");
  });
});
