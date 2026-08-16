import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { loadMemberships, type TenancySupabaseClient } from "@rinads/tenancy";
import { ONBOARDING_PATH } from "@/lib/post-auth-destination";
import { getPageMetadata } from "@/lib/cms";
import { OsClient } from "./OsClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/os");
}

export default async function OsPage() {
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
    if (!memberships.length) {
      redirect(ONBOARDING_PATH);
    }
  }

  return (
    <main id="main">
      <OsClient />
    </main>
  );
}
