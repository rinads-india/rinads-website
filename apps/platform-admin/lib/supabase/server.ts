import { createServerSupabaseClient, createServiceRoleClient } from "@rinads/database";
import { cookies } from "next/headers";
import { getSupabasePublicConfig, getServiceRoleKey } from "./env";

export async function createPlatformServerClient() {
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

export function createPlatformServiceClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for platform admin mutations.");
  }
  return createServiceRoleClient({ url, anonKey, serviceRoleKey });
}
