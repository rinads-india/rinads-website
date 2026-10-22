import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { RINASPACEClient } from "./RINASPACEClient";

export const metadata: Metadata = {
  title: "RINASPACE — RINADS",
  description: "Your authenticated workspace for RINADS Business OS and services.",
};

type NamedRelation = { name: string };
type SpaceMembershipProjection = {
  organizations: NamedRelation | NamedRelation[] | null;
  roles: NamedRelation | NamedRelation[] | null;
};

function firstRelation(value: NamedRelation | NamedRelation[] | null | undefined): NamedRelation | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

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
    const typedMembership = membership as SpaceMembershipProjection;
    const org = firstRelation(typedMembership.organizations);
    if (org?.name) orgName = org.name;
    const memberRole = firstRelation(typedMembership.roles);
    if (memberRole?.name) role = memberRole.name;
  }

  return <RINASPACEClient role={role} orgName={orgName} />;
}
