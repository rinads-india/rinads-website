import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { getPageMetadata } from "@/lib/cms";
import { OsShellLayout } from "./OsClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/os");
}

/**
 * Shared Business OS shell. Auth is required for all /os/* routes.
 * Tenant destination resolution (salon → Rinaglow) remains on the Home page only.
 */
export default async function OsLayout({ children }: { children: React.ReactNode }) {
  if (isSupabaseMode()) {
    const supabase = await createWebsiteServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      redirect("/signup?mode=login&next=/os");
    }
  }

  return <OsShellLayout>{children}</OsShellLayout>;
}
