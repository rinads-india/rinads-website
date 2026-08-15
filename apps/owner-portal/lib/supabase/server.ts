import { createServerSupabaseClient } from "@rinads/database";
import { cookies } from "next/headers";
import "server-only";

export async function createOwnerServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return createServerSupabaseClient(
    { url, anonKey },
    {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // middleware refreshes session
        }
      },
    }
  );
}
