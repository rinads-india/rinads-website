/**
 * R GLOW loyalty expiry worker.
 *
 * Disabled by default. Requires the same cron auth pattern as the
 * communications worker and an explicit organization allowlist.
 */
import { createClient } from "@supabase/supabase-js";
import { SalonLoyaltyRepository, type SalonSupabaseClient } from "@rinads/salon-server";

async function main() {
  if (process.env.RINADS_LOYALTY_EXPIRY_WORKER_ENABLED !== "1") {
    console.log(JSON.stringify({ ok: true, enabled: false, reason: "RINADS_LOYALTY_EXPIRY_WORKER_ENABLED is not 1" }));
    return;
  }

  const cronSecret = process.env.RINADS_CRON_SECRET;
  if (!cronSecret || process.env.RINADS_CRON_INVOCATION_TOKEN !== cronSecret) {
    throw new Error("Authenticated cron invocation required.");
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

  const organizationIds = (process.env.RINADS_LOYALTY_EXPIRY_ORGANIZATION_IDS ?? process.env.RINADS_COMMUNICATIONS_ORGANIZATION_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!organizationIds.length) {
    throw new Error("RINADS_LOYALTY_EXPIRY_ORGANIZATION_IDS (or COMMUNICATIONS allowlist) must explicitly scope the worker.");
  }

  const dayKey = new Date().toISOString().slice(0, 10);
  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }) as unknown as SalonSupabaseClient;
  const loyalty = new SalonLoyaltyRepository(client);
  const results = [];
  for (const organizationId of organizationIds) {
    const result = await loyalty.runExpiryBatch(organizationId, {
      idempotencyKey: `loyalty-expiry:${organizationId}:${dayKey}`,
    });
    if (!result.ok) throw new Error(`${organizationId}: ${result.error.message}`);
    results.push(result.data);
  }
  console.log(JSON.stringify({ ok: true, results }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
