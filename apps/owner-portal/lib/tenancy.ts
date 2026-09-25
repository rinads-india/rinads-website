import {
  buildDemoTenancyContext,
  requireOrgActive,
  requireOwnerStaffRole,
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
import { isDemoMode } from "./supabase/env";

export type OwnerAccess =
  | { status: "ok"; tenancy: TenancyContext; demo: boolean }
  | { status: "unauthenticated" }
  | { status: "forbidden"; reason: string };

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

export async function loadOwnerAccess(
  createClient: () => Promise<unknown>
): Promise<OwnerAccess> {
  if (isDemoMode()) {
    return { status: "ok", tenancy: buildDemoTenancyContext({ roleKey: "founder" }), demo: true };
  }

  try {
    const supabase = await createClient();
    const client = supabase as Parameters<typeof resolveTenancyFromSupabase>[0];
    const { data } = await client.auth.getUser();
    if (!data.user) return { status: "unauthenticated" };

    const tenancy = await resolveTenancyContext(async () => supabase);
    if (!tenancy) {
      return { status: "forbidden", reason: "Owner workspace access requires an active staff role." };
    }
    const allowed = requireOwnerStaffRole(tenancy);
    if (!allowed.allowed) {
      return { status: "forbidden", reason: allowed.reason };
    }
    return { status: "ok", tenancy, demo: false };
  } catch {
    return { status: "unauthenticated" };
  }
}

export async function getOwnerContext(
  createClient: () => Promise<unknown>
): Promise<OperationsContext> {
  const access = await loadOwnerAccess(createClient);
  if (access.status === "unauthenticated") {
    throw new Error("Not authenticated or no organization membership.");
  }
  if (access.status === "forbidden") {
    throw new Error(access.reason);
  }
  return toOperationsContext(access.tenancy);
}

export async function getCommerceContextFromTenancy(
  createClient: () => Promise<unknown>,
  customerId?: string
): Promise<CommerceContext> {
  const access = await loadOwnerAccess(createClient);
  if (access.status !== "ok") {
    throw new Error(access.status === "forbidden" ? access.reason : "Not authenticated.");
  }
  const active = requireOrgActive(access.tenancy);
  if (!active.allowed) throw new Error(active.reason);
  return toCommerceContext(access.tenancy, customerId);
}

export { isDemoMode };
