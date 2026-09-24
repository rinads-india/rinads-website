import { redirect } from "next/navigation";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { ACTIVE_ORG_COOKIE, loadMemberships, type TenancySupabaseClient } from "@rinads/tenancy";
import { cookies } from "next/headers";
import { resolveDestinationForMemberships } from "@/lib/tenant-destination-server";
import { ensureActiveOrganizationCookieAction } from "@/lib/org-context";
import { OsHomeContent } from "@/components/os/OsHomeContent";

/**
 * Home landing — preserves tenant destination resolution (salon → Rinaglow, etc.).
 */
export default async function OsHomePage() {
  if (isSupabaseMode()) {
    const supabase = await createWebsiteServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      redirect("/signup?mode=login&next=/os");
    }

    const memberships = await loadMemberships(
      supabase as unknown as TenancySupabaseClient,
      data.user.id
    );
    await ensureActiveOrganizationCookieAction();
    const activeOrgCookie = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
    const destination = await resolveDestinationForMemberships(
      supabase as unknown as TenancySupabaseClient,
      memberships,
      activeOrgCookie
    );
    if (destination !== "/os") {
      redirect(destination);
    }
  }

  return (
    <main id="main">
      <OsHomeContent />
    </main>
  );
}
