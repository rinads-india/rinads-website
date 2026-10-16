import "server-only";
import { cache } from "react";
import type { OrgContext } from "@rinads/company-os-engine";
import { createSupabaseRowDb, type RowDb } from "@rinads/company-os-server";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { requireOsShellAccess } from "@/lib/os-shell-access";

/**
 * The Company OS never shows invented data from this module. Every page and action gets one of:
 *  - demo   : the site runs in demo-auth mode → pages explain that live data needs Supabase mode
 *  - no-org : signed in but no active organisation
 *  - ready  : the caller's RLS-bound database + their REAL role/permissions from tenancy
 *
 * `db` wraps the signed-in user's session (anon key + user JWT). There is no service-role client here.
 */
export type CompanyOsSession =
  | { kind: "demo" }
  | { kind: "no-org" }
  /** A real organisation that is not a Company OS operator tenant: it keeps the Business OS. */
  | { kind: "business" }
  | { kind: "ready"; db: RowDb; ctx: OrgContext; organizationName: string };

export const getCompanyOsSession = cache(async (path: string = "/os"): Promise<CompanyOsSession> => {
  if (!isSupabaseMode()) return { kind: "demo" };

  // Handles unauthenticated redirects, onboarding and salon→Rinaglow routing exactly like the shell does.
  const access = await requireOsShellAccess(path);
  if (!access.organizationId) return { kind: "no-org" };
  // Dual-mode shell (PR #129): only operator tenants (organizations.is_platform_operator / feature flag) run the Company OS.
  if (!access.companyOsMode) return { kind: "business" };

  const membership = access.memberships.find((m) => m.organizationId === access.organizationId);
  if (!membership) return { kind: "no-org" };

  const client = await createWebsiteServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { kind: "no-org" };

  return {
    kind: "ready",
    db: createSupabaseRowDb(client),
    ctx: {
      organizationId: membership.organizationId,
      userId: data.user.id,
      roleKey: membership.roleKey,
      permissions: [...membership.permissions],
    },
    organizationName: membership.organizationName,
  };
});
