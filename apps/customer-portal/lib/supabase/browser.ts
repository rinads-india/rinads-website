import { createBrowserSupabaseClient } from "@rinads/database";
import { getSharedAuthCookieOptions } from "@rinads/auth";
import { getSupabasePublicConfig } from "./env";

export function createCustomerBrowserClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  return createBrowserSupabaseClient({ url, anonKey }, getSharedAuthCookieOptions());
}
