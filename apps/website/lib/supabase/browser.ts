"use client";

import { createBrowserSupabaseClient } from "@rinads/database";
import { getSupabasePublicConfig } from "./env";

export function createWebsiteBrowserClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  return createBrowserSupabaseClient({ url, anonKey });
}
