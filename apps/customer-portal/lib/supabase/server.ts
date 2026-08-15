import { createServerSupabaseClient } from "@rinads/database";
import { cookies } from "next/headers";
import "server-only";

export async function createCustomerPortalServerClient() {
  const cookieStore = await cookies();
  return createServerSupabaseClient(
    { url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
    {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* middleware */
        }
      },
    }
  );
}
