"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { RoleKey } from "@rinads/permissions";
import type { OsCapabilityTier, OsOrgRoleSource, OsOrgRoleView } from "@/lib/os-org-role";
import { buildDemoRoleView, buildMembershipRoleView } from "@/lib/os-org-role";
import { useAuth } from "@/contexts/AuthContext";

const OsOrgRoleContext = createContext<{
  membershipRoleKey: RoleKey | null;
  membershipResolved: boolean;
} | null>(null);

/**
 * Server-provided membership role. When unresolved (demo mode / no tenancy),
 * demo sessions may use explicit demo role; live Supabase never trusts AuthContext role.
 */
export function OsOrgRoleProvider({
  membershipRoleKey,
  membershipResolved,
  children,
}: {
  membershipRoleKey: RoleKey | null;
  /** True when Supabase tenancy gate ran (even if roleKey is null). */
  membershipResolved: boolean;
  children: ReactNode;
}) {
  return (
    <OsOrgRoleContext.Provider value={{ membershipRoleKey, membershipResolved }}>
      {children}
    </OsOrgRoleContext.Provider>
  );
}

export function useOsOrgRole(): OsOrgRoleView {
  const ctx = useContext(OsOrgRoleContext);
  const { user, isDemoMode } = useAuth();

  if (ctx?.membershipResolved) {
    return buildMembershipRoleView(ctx.membershipRoleKey);
  }

  // Demo auth only: explicit demo session role is the trusted demo model.
  if (isDemoMode && user?.demo) {
    return buildDemoRoleView(user.role);
  }

  // Live session without membership role → no privileged capability.
  return {
    tier: null as OsCapabilityTier | null,
    roleKey: null,
    source: "unresolved" as OsOrgRoleSource,
  };
}
