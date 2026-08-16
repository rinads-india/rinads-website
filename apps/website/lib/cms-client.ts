import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import type { CmsSupabaseClient } from "@rinads/cms";

export async function getWebsiteCmsClient(): Promise<CmsSupabaseClient | null> {
  if (!isSupabaseMode()) return null;
  try {
    const supabase = await createWebsiteServerClient();
    return supabase as unknown as CmsSupabaseClient;
  } catch {
    return null;
  }
}
