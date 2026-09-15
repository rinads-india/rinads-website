import {
  RinpoActionsRepository,
  SalonCampaignsRepository,
  SalonNotificationService,
  SalonRepository,
  type SalonSupabaseClient,
} from "@rinads/salon-server";
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
  campaigns: SalonCampaignsRepository;
  /** Raw client, needed by growth-intelligence functions that query `notification_outbox` directly. */
  client: SalonSupabaseClient;
};

/** One Supabase client shared across the repository, RINPO actions, campaigns, and notification enqueueing for a single request. */
export async function getSalonDeps(): Promise<SalonDeps> {
  const client = await createRinaglowServerClient();
  const typedClient = client as unknown as SalonSupabaseClient;
  const repo = new SalonRepository(typedClient);
  const notifications = new SalonNotificationService(typedClient);
  return {
    repo,
    actions: new RinpoActionsRepository(typedClient),
    notifications,
    campaigns: new SalonCampaignsRepository(typedClient, repo, notifications),
    client: typedClient,
  };
}
