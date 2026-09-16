"use client";

import { createBrowserSupabaseClient } from "@rinads/database";
import { supabaseConfig } from "./env";
import { rinaglowAuthCookieOptions } from "./cookies";

export function createRinaglowBrowserClient() {
  return createBrowserSupabaseClient(supabaseConfig(), rinaglowAuthCookieOptions());
}
