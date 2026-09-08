import { RinpoActionsRepository, SalonNotificationService, SalonRepository, type SalonSupabaseClient } from "@rinads/salon-server";
import "server-only";
import { createRinaglowServerClient } from "./supabase/server";

export async function getSalonRepository(): Promise<SalonRepository> {
  const client = await createRinaglowServerClient();
  return new SalonRepository(client as unknown as SalonSupabaseClient);
}

export type SalonDeps = {
  repo: SalonRepository;
  actions: RinpoActionsRepository;
  notifications: SalonNotificationService;
};

/** One Supabase client shared across the repository, RINPO actions, and notification enqueueing for a single request. */
export async function getSalonDeps(): Promise<SalonDeps> {
  const client = await createRinaglowServerClient();
  const typedClient = client as unknown as SalonSupabaseClient;
  return {
    repo: new SalonRepository(typedClient),
    actions: new RinpoActionsRepository(typedClient),
    notifications: new SalonNotificationService(typedClient),
  };
}
