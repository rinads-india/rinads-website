"use client";

import { createBrowserSupabaseClient } from "@rinads/database";
import { supabaseConfig } from "./env";

export function createRinaglowBrowserClient() {
  return createBrowserSupabaseClient(supabaseConfig());
}
