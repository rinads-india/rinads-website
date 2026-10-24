import type { OrgMembership } from "@rinads/tenancy";

export type RinadsAgentAuthMethod = "session" | "bearer" | "delegation";

export type RinadsAgentScopeResolution =
  | { status: "resolved"; membership: OrgMembership }
  | { status: "scope_required" }
  | { status: "no_active_membership" };

/**
 * Resolve an agent's organization scope without trusting an organization id
 * supplied by an external agent.
 *
 * Session requests may use the existing signed first-party active-org cookie.
 * Ordinary Supabase bearer requests are intentionally strict and require a
 * single active organization unless a separate organization-bound delegation
 * has already been verified. Delegation requests are resolved directly against
 * their signed organization claim plus current membership state in principal.ts
 * and therefore do not call this helper.
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
