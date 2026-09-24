import type { RoleKey } from "@rinads/permissions";

/**
 * Capability tiers used by Business OS bridge destinations.
 * Derived only from trusted organisation membership `roleKey` (or explicit demo role).
 * Never infer from AuthContext Supabase placeholder `client`.
 */
export type OsCapabilityTier = "client" | "staff" | "admin";

export type OsOrgRoleSource = "membership" | "demo" | "unresolved";

export type OsOrgRoleView = {
  tier: OsCapabilityTier | null;
  roleKey: RoleKey | null;
  source: OsOrgRoleSource;
};

/** Map CORE RoleKey → OS capability tier. Privileged system roles map to admin for org bridges only. */
export function capabilityTierFromRoleKey(roleKey: RoleKey | null | undefined): OsCapabilityTier | null {
  if (!roleKey) return null;
  switch (roleKey) {
    case "client":
    case "viewer":
      return "client";
    case "staff":
      return "staff";
    case "manager":
    case "admin":
    case "founder":
    case "super_admin":
      return "admin";
    default:
      return null;
  }
}

/**
 * Demo-only adapter: maps allowed demo login roles to tiers.
 * Must only be used when `user.demo === true`.
 */
export function capabilityTierFromDemoRole(
  demoRole: string | null | undefined
): OsCapabilityTier | null {
  if (demoRole === "client") return "client";
  if (demoRole === "staff") return "staff";
  if (demoRole === "admin") return "admin";
  return null;
}

export function buildMembershipRoleView(roleKey: RoleKey | null): OsOrgRoleView {
  return {
    roleKey,
    tier: capabilityTierFromRoleKey(roleKey),
    source: roleKey ? "membership" : "unresolved",
  };
}

export function buildDemoRoleView(demoRole: string | null | undefined): OsOrgRoleView {
  const tier = capabilityTierFromDemoRole(demoRole);
  return {
    roleKey: null,
    tier,
    source: tier ? "demo" : "unresolved",
  };
}

export function tierAtLeast(
  tier: OsCapabilityTier | null,
  minimum: OsCapabilityTier
): boolean {
  if (!tier) return false;
  const rank: Record<OsCapabilityTier, number> = { client: 1, staff: 2, admin: 3 };
  return rank[tier] >= rank[minimum];
}
