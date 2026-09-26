import { createServerSupabaseClient } from "@rinads/database";
import { getSharedAuthCookieOptions } from "@rinads/auth";
import { cookies } from "next/headers";
import "server-only";
import { getSupabasePublicConfig } from "./env";

export async function createCustomerPortalServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicConfig();
  const cookieOptions = getSharedAuthCookieOptions();
  return createServerSupabaseClient(
    { url, anonKey },
    {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, ...cookieOptions })
          );
        } catch {
          /* middleware */
        }
      },
    },
    cookieOptions
  );
}
