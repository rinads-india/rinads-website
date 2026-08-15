/**
 * Poll pending tenant_provisioning_jobs and seed commerce + ops via Supabase adapters.
 * Run on a schedule (Vercel cron / Supabase Edge / manual): pnpm provisioning:worker
 */
import { runPendingProvisioningJobs } from "@rinads/platform";

async function main() {
  if (process.env.USE_SUPABASE !== "1") {
    console.log(JSON.stringify({ ok: true, mode: "demo", processed: 0, failed: 0 }));
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, { auth: { persistSession: false } });

  const result = await runPendingProvisioningJobs(client as never);
  console.log(JSON.stringify({ ok: true, ...result }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
