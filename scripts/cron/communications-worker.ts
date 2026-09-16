/**
 * R GLOW communications worker.
 *
 * Disabled by default. A scheduler must inject the same value into
 * RINADS_CRON_SECRET and RINADS_CRON_INVOCATION_TOKEN for this invocation.
 */
import { createClient } from "@supabase/supabase-js";
import {
  createTwilioWhatsAppAdapter,
  runSalonCommunicationsWorker,
  SalonCampaignsRepository,
  SalonNotificationService,
  SalonRepository,
  type SalonSupabaseClient,
} from "@rinads/salon-server";

async function main() {
  if (process.env.RINADS_COMMUNICATIONS_WORKER_ENABLED !== "1") {
    console.log(JSON.stringify({ ok: true, enabled: false, reason: "RINADS_COMMUNICATIONS_WORKER_ENABLED is not 1" }));
    return;
  }

  const cronSecret = process.env.RINADS_CRON_SECRET;
  if (!cronSecret || process.env.RINADS_CRON_INVOCATION_TOKEN !== cronSecret) {
    throw new Error("Authenticated cron invocation required.");
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

  const organizationIds = (process.env.RINADS_COMMUNICATIONS_ORGANIZATION_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!organizationIds.length) throw new Error("RINADS_COMMUNICATIONS_ORGANIZATION_IDS must explicitly scope the worker.");

  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }) as unknown as SalonSupabaseClient;
  const repo = new SalonRepository(client);
  const notifications = new SalonNotificationService(client);
  const campaigns = new SalonCampaignsRepository(client, repo, notifications);
  const result = await runSalonCommunicationsWorker(
    client,
    campaigns,
    createTwilioWhatsAppAdapter({ supabaseUrl, serviceRoleKey }),
    {
      enabled: true,
      organizationIds,
      batchSize: Number(process.env.RINADS_COMMUNICATIONS_BATCH_SIZE ?? 25),
      throughputDelayMs: Number(process.env.RINADS_COMMUNICATIONS_THROUGHPUT_DELAY_MS ?? 250),
      maxScheduledCampaigns: Number(process.env.RINADS_COMMUNICATIONS_MAX_SCHEDULED_CAMPAIGNS ?? 2),
      reviewsAutomationUrl: process.env.RINADS_REVIEWS_AUTOMATION_URL,
      reviewsAutomationToken: process.env.RINADS_REVIEWS_AUTOMATION_TOKEN,
    }
  );
  console.log(JSON.stringify({ ok: true, ...result }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
