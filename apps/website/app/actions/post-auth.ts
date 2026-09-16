"use server";

import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { loadMemberships, type TenancySupabaseClient } from "@rinads/tenancy";
import { OS_PATH } from "@/lib/post-auth-destination";
import { ensureActiveOrganizationCookieAction } from "@/lib/org-context";
import { cookies } from "next/headers";
import { ACTIVE_ORG_COOKIE } from "@rinads/tenancy";
import { resolveDestinationForMemberships } from "@/lib/tenant-destination-server";

export async function resolvePostAuthDestinationAction(): Promise<string> {
  if (!isSupabaseMode()) {
    return OS_PATH;
  }

  try {
    const supabase = await createWebsiteServerClient();
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) {
      return OS_PATH;
    }

    const memberships = await loadMemberships(
      supabase as unknown as TenancySupabaseClient,
      userData.user.id
    );

    await ensureActiveOrganizationCookieAction();
    const activeOrgCookie = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
    return resolveDestinationForMemberships(
      supabase as unknown as TenancySupabaseClient,
      memberships,
      activeOrgCookie
    );
  } catch {
    return OS_PATH;
  }
}
