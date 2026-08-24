import { cookies } from "next/headers";
import { resolveTenancyFromSupabase, type TenancySupabaseClient } from "@rinads/tenancy";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import type { TenancyContext } from "@rinads/tenancy";

export async function resolveWebsiteTenancy(): Promise<TenancyContext | null> {
  const { url, anonKey } = getSupabasePublicConfig();
  if (!url || !anonKey) return null;
  if (process.env.NEXT_PUBLIC_AUTH_PROVIDER !== "supabase") return null;

  const cookieStore = await cookies();
  const activeOrg = cookieStore.get("rinads_active_org")?.value;
  const supabase = await createWebsiteServerClient();
  return resolveTenancyFromSupabase(supabase as unknown as TenancySupabaseClient, activeOrg);
}
