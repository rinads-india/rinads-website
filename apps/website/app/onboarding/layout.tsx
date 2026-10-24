import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buildWebsiteLoginRedirect } from "@/lib/auth-route-policy";
import { isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { getVerifiedSupabaseIdentity } from "@/lib/supabase/verified-auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseMode()) return children;

  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-rinads-pathname") || "/onboarding";
  const supabase = await createWebsiteServerClient();
  const identity = await getVerifiedSupabaseIdentity(supabase);

  if (!identity) {
    redirect(buildWebsiteLoginRedirect(pathname));
  }

  return children;
}
