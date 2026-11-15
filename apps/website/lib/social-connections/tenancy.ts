/**
 * Resolve an authenticated, ACTIVE tenant for Social OS API handlers.
 * A missing membership, suspended org, or mismatched session always fails closed.
 */
import { cookies } from "next/headers";
import { ACTIVE_ORG_COOKIE, resolveTenancyFromSupabase, type TenancySupabaseClient } from "@rinads/tenancy";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";

export async function getSocialTenancy() {
  if (!isSupabaseMode()) return null;
  const supabase = await createWebsiteServerClient();
  const cookieValue = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const ctx = await resolveTenancyFromSupabase(
    supabase as unknown as TenancySupabaseClient,
    cookieValue
  );
  if (!ctx || ctx.organizationStatus !== "active") return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || ctx.userId !== user.id) return null;
  return { user, ctx };
}
