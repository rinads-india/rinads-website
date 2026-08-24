"use server";

import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { loadMemberships, type TenancySupabaseClient } from "@rinads/tenancy";
import { ONBOARDING_PATH, OS_PATH } from "@/lib/post-auth-destination";
import { ensureActiveOrganizationCookieAction } from "@/lib/org-context";

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

    if (!memberships.length) {
      return ONBOARDING_PATH;
    }

    await ensureActiveOrganizationCookieAction();

    return OS_PATH;
  } catch {
    return OS_PATH;
  }
}
