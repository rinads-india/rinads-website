import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACTIVE_ORG_COOKIE,
  resolveTenancyFromSupabase,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { RINASPACEClient } from "./RINASPACEClient";

export const metadata: Metadata = {
  title: "RINASPACE — RINADS",
  description: "Your authenticated workspace for RINADS capabilities, industry packs and services.",
};

export default async function RINASPACEPage() {
  const supabase = await createWebsiteServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup?returnTo=/space");
  }

  const cookieStore = await cookies();
  const activeOrgCookie = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const tenancy = await resolveTenancyFromSupabase(
    supabase as unknown as TenancySupabaseClient,
    activeOrgCookie,
  );

  if (!tenancy) {
    redirect("/onboarding");
  }

  const activeMembership =
    tenancy.memberships.find(
      (membership) => membership.organizationId === tenancy.organizationId,
    ) ?? tenancy.memberships[0];

  const orgName = activeMembership?.organizationName ?? "Your Organization";
  const memberships = tenancy.memberships
    .filter((membership) => membership.organizationStatus === "active")
    .map((membership) => ({
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      roleKey: membership.roleKey,
    }));

  return (
    <RINASPACEClient
      riIdentity={tenancy.email ?? user.email ?? "Authenticated RI ID"}
      role={tenancy.roleKey}
      orgName={orgName}
      activeOrganizationId={tenancy.organizationId}
      memberships={memberships}
      planKey={tenancy.planKey}
      verticalKey={tenancy.verticalKey}
      entitlementState={tenancy.entitlementState ?? "none"}
      entitlementEndsAt={tenancy.entitlementEndsAt}
      featureFlags={tenancy.featureFlags}
    />
  );
}
