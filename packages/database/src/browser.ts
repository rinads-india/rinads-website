import { createBrowserClient } from "@supabase/ssr";
import type { Database, DatabaseConfig } from "./types";
import { isDatabaseConfigured } from "./types";

export function createBrowserSupabaseClient(config: Partial<DatabaseConfig>) {
  if (!isDatabaseConfigured(config)) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient<Database>(config.url, config.anonKey);
}
