"use client";

import { createBrowserSupabaseClient } from "@rinads/database";
import { getSupabasePublicConfig } from "./env";
import { websiteAuthCookieOptions } from "../auth-cookie-config";

export function createWebsiteBrowserClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  return createBrowserSupabaseClient({ url, anonKey }, websiteAuthCookieOptions());
}
