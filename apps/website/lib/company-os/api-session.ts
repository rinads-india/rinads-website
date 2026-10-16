import "server-only";
import { cookies } from "next/headers";
import { ACTIVE_ORG_COOKIE, loadMemberships, type TenancySupabaseClient } from "@rinads/tenancy";
import type { OrgContext } from "@rinads/company-os-engine";
import { createCosRowDb, createSupabaseRowDb, type RowDb } from "@rinads/company-os-server";
import { resolveCompanyOsMode } from "@/lib/company-os-mode";
import { resolveActiveOrganizationId } from "@/lib/post-auth-destination";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";

export type ApiCompanyOsSession =
  | { kind: "demo" }
  | { kind: "unauthenticated" }
  | { kind: "no-org" }
  | { kind: "business" }
  | { kind: "ready"; db: RowDb; ctx: OrgContext; organizationName: string };

/**
 * Session resolution for route handlers. Unlike the page loader it never redirects: it reports
 * the state so the API can answer 401 / "not available" explicitly. Still the caller's RLS session only.
 */
export async function getApiCompanyOsSession(): Promise<ApiCompanyOsSession> {
  if (!isSupabaseMode()) return { kind: "demo" };
  const client = await createWebsiteServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { kind: "unauthenticated" };

  const memberships = await loadMemberships(client as unknown as TenancySupabaseClient, data.user.id);
  const activeCookie = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const organizationId = resolveActiveOrganizationId(
    memberships.map((m) => ({ organizationId: m.organizationId, organizationStatus: m.organizationStatus })),
    activeCookie
  );
  const membership = organizationId ? memberships.find((m) => m.organizationId === organizationId) : undefined;
  if (!membership) return { kind: "no-org" };

  // Same dual-mode rule as the shell: only operator tenants (or the explicit feature flag) use the Company OS.
  const { data: orgRow } = await client.from("organizations").select("is_platform_operator").eq("id", membership.organizationId).maybeSingle();
  const operator = Boolean((orgRow as { is_platform_operator?: boolean } | null)?.is_platform_operator);
  if (!resolveCompanyOsMode({ enforced: true, isPlatformOperator: operator, roleKey: membership.roleKey })) return { kind: "business" };

  return {
    kind: "ready",
    db: createCosRowDb(createSupabaseRowDb(client)),
    ctx: { organizationId: membership.organizationId, userId: data.user.id, roleKey: membership.roleKey, permissions: [...membership.permissions] },
    organizationName: membership.organizationName,
  };
}
