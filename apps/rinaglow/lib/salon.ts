import { SalonRepository, type SalonSupabaseClient } from "@rinads/salon-server";
import "server-only";
import { createRinaglowServerClient } from "./supabase/server";

export async function getSalonRepository(): Promise<SalonRepository> {
  const client = await createRinaglowServerClient();
  return new SalonRepository(client as unknown as SalonSupabaseClient);
}
