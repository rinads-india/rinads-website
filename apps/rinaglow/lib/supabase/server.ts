import { createServerSupabaseClient } from "@rinads/database";
import { cookies } from "next/headers";
import "server-only";
import { supabaseConfig } from "./env";

/**
 * apps/rinaglow is Supabase-auth-only — there is no demo-mode fallback here
 * (see R GLOW Production Hardening + Salon OS Foundation plan, Part C:
 * "this is the first real-tenant surface"). Callers must handle the thrown
 * error (e.g. by redirecting to /login) rather than silently degrading to
 * demo data.
 */
export async function createRinaglowServerClient() {
  const cookieStore = await cookies();
  return createServerSupabaseClient(supabaseConfig(), {
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        // Called from a Server Component — middleware refreshes the session.
      }
    },
  });
}
