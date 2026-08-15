import {
  buildDemoTenancyContext,
  requireOrgActive,
  resolveTenancyFromSupabase,
  toCommerceContext,
  type TenancyContext,
} from "@rinads/tenancy";
import type { CommerceContext } from "@rinads/commerce";
import { cookies, headers } from "next/headers";
import { ACTIVE_ORG_COOKIE } from "@rinads/tenancy";
import "server-only";

function isDemoMode(): boolean {
  return (
    process.env.USE_DEMO_STORE === "1" ||
    process.env.NEXT_PUBLIC_AUTH_PROVIDER !== "supabase" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

export async function resolveTenancyContext(
  createClient: () => Promise<unknown>
): Promise<TenancyContext | null> {
  if (isDemoMode()) return buildDemoTenancyContext();

  const headerStore = await headers();
  const hostOrgId = headerStore.get("x-rinads-organization-id");
  const hostSlug = headerStore.get("x-rinads-storefront-slug");

  if (hostOrgId) {
    const ctx = buildDemoTenancyContext({
      organizationId: hostOrgId,
      organizationSlug: hostSlug ?? "storefront",
      roleKey: "client",
      permissions: [],
    });
    const active = requireOrgActive(ctx);
    if (!active.allowed) return null;
    return ctx;
  }

  const cookieStore = await cookies();
  const supabase = await createClient();
  return resolveTenancyFromSupabase(
    supabase as Parameters<typeof resolveTenancyFromSupabase>[0],
    cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  );
}

export async function getStorefrontContext(
  createClient: () => Promise<unknown>,
  customerId?: string
): Promise<CommerceContext> {
  const tenancy = await resolveTenancyContext(createClient);
  if (!tenancy) throw new Error("Not authenticated.");
  const active = requireOrgActive(tenancy);
  if (!active.allowed) throw new Error(active.reason);
  return toCommerceContext(tenancy, customerId);
}

export { isDemoMode };
