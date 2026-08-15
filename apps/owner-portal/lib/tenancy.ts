import {
  buildDemoTenancyContext,
  requireOrgActive,
  resolveTenancyFromSupabase,
  toCommerceContext,
  toOperationsContext,
  type TenancyContext,
} from "@rinads/tenancy";
import type { CommerceContext } from "@rinads/commerce";
import type { OperationsContext } from "@rinads/operations";
import { cookies } from "next/headers";
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
  if (isDemoMode()) {
    return buildDemoTenancyContext();
  }

  const cookieStore = await cookies();
  const activeOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const supabase = await createClient();
  return resolveTenancyFromSupabase(
    supabase as Parameters<typeof resolveTenancyFromSupabase>[0],
    activeOrg
  );
}

export async function getOwnerContext(
  createClient: () => Promise<unknown>
): Promise<OperationsContext> {
  const tenancy = await resolveTenancyContext(createClient);
  if (!tenancy) throw new Error("Not authenticated or no organization membership.");
  const active = requireOrgActive(tenancy);
  if (!active.allowed) throw new Error(active.reason);
  return toOperationsContext(tenancy);
}

export async function getCommerceContextFromTenancy(
  createClient: () => Promise<unknown>,
  customerId?: string
): Promise<CommerceContext> {
  const tenancy = await resolveTenancyContext(createClient);
  if (!tenancy) throw new Error("Not authenticated or no organization membership.");
  const active = requireOrgActive(tenancy);
  if (!active.allowed) throw new Error(active.reason);
  return toCommerceContext(tenancy, customerId);
}

export { isDemoMode };
