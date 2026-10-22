import type { OrgMembership } from "@rinads/tenancy";

export type RinadsAgentAuthMethod = "session" | "bearer";

export type RinadsAgentScopeResolution =
  | { status: "resolved"; membership: OrgMembership }
  | { status: "scope_required" }
  | { status: "no_active_membership" };

/**
 * Resolve an agent's organization scope without trusting an organization id
 * supplied by an external agent.
 *
 * Session requests may use the existing signed first-party active-org cookie.
 * Bearer requests are intentionally stricter: until RINADS issues an
 * organization-bound delegation token, a bearer identity must have exactly one
 * active organization membership or the request remains fail-closed.
 */
export function resolveRinadsAgentScope(input: {
  memberships: readonly OrgMembership[];
  authMethod: RinadsAgentAuthMethod;
  activeOrganizationId?: string | null;
}): RinadsAgentScopeResolution {
  const active = input.memberships.filter(
    (membership) => membership.organizationStatus === "active"
  );

  if (active.length === 0) return { status: "no_active_membership" };

  if (input.authMethod === "session") {
    const activeOrganizationId = input.activeOrganizationId?.trim();
    if (activeOrganizationId) {
      const membership = active.find(
        (candidate) => candidate.organizationId === activeOrganizationId
      );
      if (membership) return { status: "resolved", membership };
    }
  }

  if (active.length === 1) {
    return { status: "resolved", membership: active[0] };
  }

  return { status: "scope_required" };
}
