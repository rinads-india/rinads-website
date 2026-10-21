import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { RINASPACEClient } from "./RINASPACEClient";

export const metadata: Metadata = {
  title: "RINASPACE — RINADS",
  description: "Your authenticated workspace for RINADS Business OS and services.",
};

export default async function RINASPACEPage() {
  const supabase = await createWebsiteServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup?returnTo=/space");
  }

  // Resolve organization and role
  let orgName = "Your Organization";
  let role = "member";

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(name), roles(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (membership) {
    type MembershipRow = {
      organizations: { name: string } | { name: string }[] | null;
      roles: { name: string } | { name: string }[] | null;
    };
    const row = membership as MembershipRow;
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    if (org?.name) orgName = org.name;
    const r = Array.isArray(row.roles) ? row.roles[0] : row.roles;
    if (r?.name) role = r.name;
  }

  return <RINASPACEClient role={role} orgName={orgName} />;
}
