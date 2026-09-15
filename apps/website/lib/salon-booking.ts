import { SalonRepository, type SalonSupabaseClient } from "@rinads/salon-server";
import "server-only";
import { createWebsiteServerClient } from "./supabase/server";

/**
 * Public salon booking repository — bound to the anon-key website Supabase
 * client. Every method this repository exposes for anonymous callers is
 * backed by a SECURITY DEFINER RPC (see supabase/migrations/20260827100000_
 * salon_os.sql and 20260828100000_salon_public_reads.sql), so RLS on the
 * underlying salon_* tables is never bypassed from the client's perspective.
 */
export async function getPublicSalonRepository(): Promise<SalonRepository> {
  const client = await createWebsiteServerClient();
  return new SalonRepository(client as unknown as SalonSupabaseClient);
}
