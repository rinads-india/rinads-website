import {
  buildDemoTenancyContext,
  requirePrivilegedRole,
  resolveTenancyFromSupabase,
  type TenancyContext,
} from "@rinads/tenancy";
import { createPlatformServerClient } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import { cookies } from "next/headers";
import { ACTIVE_ORG_COOKIE } from "@rinads/tenancy";

export type PlatformAccess =
  | { status: "ok"; tenancy: TenancyContext; demo: boolean }
  | { status: "unauthenticated" }
  | { status: "forbidden"; reason: string };

export async function loadPlatformAccess(): Promise<PlatformAccess> {
  if (isDemoMode()) {
    const tenancy = buildDemoTenancyContext({ roleKey: "founder" });
    return { status: "ok", tenancy, demo: true };
  }

  try {
    const cookieStore = await cookies();
    const activeOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
    const supabase = await createPlatformServerClient();
    const tenancy = await resolveTenancyFromSupabase(
      supabase as unknown as Parameters<typeof resolveTenancyFromSupabase>[0],
      activeOrg
    );

    if (!tenancy) {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return { status: "unauthenticated" };
      return { status: "forbidden", reason: "Platform privileges required." };
    }

    const privileged = requirePrivilegedRole(tenancy);
    if (!privileged.allowed) {
      return { status: "forbidden", reason: privileged.reason };
    }

    return { status: "ok", tenancy, demo: false };
  } catch {
    return { status: "unauthenticated" };
  }
}

export async function requirePlatformTenancy(): Promise<TenancyContext> {
  const access = await loadPlatformAccess();
  if (access.status === "unauthenticated") {
    throw new Error("Not authenticated.");
  }
  if (access.status === "forbidden") {
    throw new Error(access.reason);
  }
  return access.tenancy;
}
