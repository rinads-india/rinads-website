import {
  ACTIVE_ORG_COOKIE,
  requireOrgActive,
  resolveTenancyFromSupabase,
  type TenancyContext,
} from "@rinads/tenancy";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import "server-only";
import { createRinaglowServerClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";

/** One tenancy resolution per RSC request — shared by layout + page. */
export const resolveTenancyContext = cache(async (): Promise<TenancyContext | null> => {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();
  const activeOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const supabase = await createRinaglowServerClient();
  return resolveTenancyFromSupabase(
    supabase as unknown as Parameters<typeof resolveTenancyFromSupabase>[0],
    activeOrg
  );
});

/** Loads the current tenancy or redirects to /login. Use in every protected page/layout. */
export const requireTenancy = cache(async (): Promise<TenancyContext> => {
  const tenancy = await resolveTenancyContext();
  if (!tenancy) redirect("/login");
  const active = requireOrgActive(tenancy);
  if (!active.allowed) redirect("/login?reason=org_inactive");
  return tenancy;
});
