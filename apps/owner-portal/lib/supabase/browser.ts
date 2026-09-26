import { createBrowserSupabaseClient } from "@rinads/database";
import { getSharedAuthCookieOptions } from "@rinads/auth";
import { getSupabasePublicConfig } from "./env";

export function createOwnerBrowserClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  return createBrowserSupabaseClient({ url, anonKey }, getSharedAuthCookieOptions());
}
