import {
  buildDemoTenancyContext,
  requireOrgActive,
  resolveTenancyFromSupabase,
  toCommerceContext,
  type TenancyContext,
} from "@rinads/tenancy";
import type { CommerceContext } from "@rinads/commerce";
import { cookies } from "next/headers";
import { ACTIVE_ORG_COOKIE } from "@rinads/tenancy";
import { DEMO_CUSTOMER_ID } from "@rinads/operations-server";
import "server-only";
import { isDemoMode } from "./supabase/env";

export type CustomerAccess =
  | { status: "ok"; userId: string; email?: string; tenancy: TenancyContext | null; demo: boolean }
  | { status: "unauthenticated" };

export async function resolveTenancyContext(
  createClient: () => Promise<unknown>
): Promise<TenancyContext | null> {
  if (isDemoMode()) return buildDemoTenancyContext({ roleKey: "client" });
  const cookieStore = await cookies();
  const supabase = await createClient();
  return resolveTenancyFromSupabase(
    supabase as Parameters<typeof resolveTenancyFromSupabase>[0],
    cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  );
}

export async function loadCustomerAccess(
  createClient: () => Promise<unknown>
): Promise<CustomerAccess> {
  if (isDemoMode()) {
    const tenancy = buildDemoTenancyContext({ roleKey: "client" });
    return { status: "ok", userId: tenancy.userId, email: tenancy.email, tenancy, demo: true };
  }

  try {
    const supabase = await createClient();
    const client = supabase as {
      auth: {
        getUser: () => Promise<{
          data: { user: { id: string; email?: string } | null };
          error: { message: string } | null;
        }>;
      };
    };
    const { data } = await client.auth.getUser();
    if (!data.user) return { status: "unauthenticated" };

    const tenancy = await resolveTenancyContext(async () => supabase);
    return {
      status: "ok",
      userId: data.user.id,
      email: data.user.email,
      tenancy,
      demo: false,
    };
  } catch {
    return { status: "unauthenticated" };
  }
}

export async function getPortalContext(
  createClient: () => Promise<unknown>
): Promise<CommerceContext> {
  const access = await loadCustomerAccess(createClient);
  if (access.status === "unauthenticated") {
    throw new Error("Not authenticated.");
  }
  if (!access.tenancy) {
    throw new Error("Not authenticated.");
  }
  const active = requireOrgActive(access.tenancy);
  if (!active.allowed) throw new Error(active.reason);
  return toCommerceContext(access.tenancy, DEMO_CUSTOMER_ID);
}

export { isDemoMode };
