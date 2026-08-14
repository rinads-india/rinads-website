import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database, DatabaseConfig } from "./types";
import { isDatabaseConfigured } from "./types";

export type CookieStore = {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: { name: string; value: string; options: CookieOptions }[]
  ) => void;
};

/**
 * Server/client-boundary Supabase client for Next.js App Router.
 * Pass the cookie store from `next/headers` via a thin adapter in the app.
 */
export function createServerSupabaseClient(
  config: Partial<DatabaseConfig>,
  cookieStore: CookieStore
) {
  if (!isDatabaseConfigured(config)) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookieStore.setAll(cookiesToSet);
        } catch {
          // Called from a Server Component — middleware/route handlers must refresh sessions.
        }
      },
    },
  });
}

/**
 * Service-role client — SERVER ONLY. Never import into client components.
 */
export function createServiceRoleClient(config: DatabaseConfig & { serviceRoleKey: string }) {
  if (!config.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service-role client");
  }
  return createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
