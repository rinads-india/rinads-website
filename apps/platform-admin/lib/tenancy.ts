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

export async function requirePlatformTenancy(): Promise<TenancyContext> {
  if (isDemoMode()) {
    return buildDemoTenancyContext();
  }

  const cookieStore = await cookies();
  const activeOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const supabase = await createPlatformServerClient();
  const tenancy = await resolveTenancyFromSupabase(
    supabase as unknown as Parameters<typeof resolveTenancyFromSupabase>[0],
    activeOrg
  );

  if (!tenancy) {
    throw new Error("Not authenticated.");
  }

  const privileged = requirePrivilegedRole(tenancy);
  if (!privileged.allowed) {
    throw new Error(privileged.reason);
  }

  return tenancy;
}
