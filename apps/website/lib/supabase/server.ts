import { createServerSupabaseClient } from "@rinads/database";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./env";

export async function createWebsiteServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicConfig();

  return createServerSupabaseClient(
    { url, anonKey },
    {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component — session refresh handled in middleware
        }
      },
    }
  );
}
