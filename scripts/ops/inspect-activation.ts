import { createClient } from "@supabase/supabase-js";

type Cli = {
  orgId?: string;
  match?: string;
  expectedTemplate?: string;
};

function parseArgs(argv: string[]): Cli {
  const cli: Cli = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--org-id") cli.orgId = argv[++i]?.trim();
    else if (arg === "--match") cli.match = argv[++i]?.trim();
    else if (arg === "--expected-template") cli.expectedTemplate = argv[++i]?.trim();
  }
  return cli;
}

function present(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function providerMode(keyId: string | undefined): "test" | "live" | "unknown" | "unset" {
  if (!present(keyId)) return "unset";
  if (keyId!.startsWith("rzp_test_")) return "test";
  if (keyId!.startsWith("rzp_live_")) return "live";
  return "unknown";
}

function safeProviderRef(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value.length <= 6 ? "***" : `***${value.slice(-6)}`;
}

function section(title: string) {
  console.log(`\n[${title}]`);
}

function ok(message: string) {
  console.log(`  ✓ ${message}`);
}

function warn(message: string) {
  console.log(`  ! ${message}`);
}

function fail(message: string) {
  console.log(`  ✗ ${message}`);
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  if (!cli.orgId && !cli.match) {
    console.error("Usage: pnpm ops:activation-inspect -- --org-id <uuid> [--expected-template salon-os]");
    console.error("   or: pnpm ops:activation-inspect -- --match <name-or-slug> [--expected-template salon-os]");
    process.exit(2);
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!present(url) || !present(serviceRole)) {
    console.error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.");
    process.exit(2);
  }

  const supabase = createClient(url!, serviceRole!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let hardFailures = 0;
  let orgs: Record<string, unknown>[] = [];

  section("organization lookup");
  if (cli.orgId) {
    const result = await supabase
      .from("organizations")
      .select("id,name,slug,status,created_at,updated_at")
      .eq("id", cli.orgId)
      .limit(2);
    if (result.error) throw new Error(`Organization lookup failed: ${result.error.message}`);
    orgs = (result.data ?? []) as Record<string, unknown>[];
  } else {
    const byName = await supabase
      .from("organizations")
      .select("id,name,slug,status,created_at,updated_at")
      .ilike("name", `%${cli.match}%`)
      .limit(5);
    if (byName.error) throw new Error(`Organization name lookup failed: ${byName.error.message}`);
    orgs = (byName.data ?? []) as Record<string, unknown>[];

    if (orgs.length === 0) {
      const bySlug = await supabase
        .from("organizations")
        .select("id,name,slug,status,created_at,updated_at")
        .ilike("slug", `%${cli.match}%`)
        .limit(5);
      if (bySlug.error) throw new Error(`Organization slug lookup failed: ${bySlug.error.message}`);
      orgs = (bySlug.data ?? []) as Record<string, unknown>[];
    }
  }

  if (orgs.length === 0) {
    fail("No organization matched. No changes were made.");
    process.exit(1);
  }
  if (orgs.length > 1) {
    fail("Multiple organizations matched. Re-run with --org-id; refusing to infer a production tenant.");
    for (const org of orgs) {
      console.log(`    ${String(org.id)}  ${String(org.name ?? "")}  ${String(org.slug ?? "")}`);
    }
    process.exit(1);
  }

  const org = orgs[0]!;
  const orgId = String(org.id);
  console.log(`  id: ${orgId}`);
  console.log(`  name: ${String(org.name ?? "")}`);
  console.log(`  slug: ${String(org.slug ?? "")}`);
  console.log(`  status: ${String(org.status ?? "unknown")}`);

  section("tenant template");
  const settingsResult = await supabase
    .from("organization_settings")
    .select("organization_id,vertical_key,storefront_slug,updated_at")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (settingsResult.error) throw new Error(`organization_settings read failed: ${settingsResult.error.message}`);
  const settings = settingsResult.data as Record<string, unknown> | null;
  if (!settings) {
    fail("organization_settings row is missing.");
    hardFailures += 1;
  } else {
    console.log(`  vertical_key: ${String(settings.vertical_key)}`);
    console.log(`  storefront_slug: ${String(settings.storefront_slug ?? "")}`);
    if (cli.expectedTemplate && settings.vertical_key !== cli.expectedTemplate) {
      fail(`Expected template ${cli.expectedTemplate}, found ${String(settings.vertical_key)}. DO NOT RUN PROVISIONING.`);
      hardFailures += 1;
    } else if (cli.expectedTemplate) {
      ok(`vertical_key matches expected template ${cli.expectedTemplate}`);
    }
  }

  section("provisioning jobs");
  const detailedColumns = [
    "id",
    "template_key",
    "status",
    "idempotency_key",
    "error_message",
    "attempts",
    "next_attempt_at",
    "last_error_class",
    "dead_lettered_at",
    "created_at",
    "completed_at",
  ].join(",");
  let jobsResult = await supabase
    .from("tenant_provisioning_jobs")
    .select(detailedColumns)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  let durabilityColumnsPresent = true;
  if (jobsResult.error) {
    durabilityColumnsPresent = false;
    warn(`Durability-column query failed (${jobsResult.error.message}); falling back to legacy job columns.`);
    jobsResult = await supabase
      .from("tenant_provisioning_jobs")
      .select("id,template_key,status,idempotency_key,error_message,created_at,completed_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20);
  }
  if (jobsResult.error) throw new Error(`tenant_provisioning_jobs read failed: ${jobsResult.error.message}`);
  const jobs = (jobsResult.data ?? []) as Record<string, unknown>[];
  console.log(`  jobs: ${jobs.length}`);
  console.log(`  durability_columns: ${durabilityColumnsPresent ? "present" : "not proven"}`);

  const runnableStates = new Set(["pending", "retrying", "running"]);
  for (const job of jobs) {
    const status = String(job.status ?? "unknown");
    const templateKey = String(job.template_key ?? "");
    console.log(
      `  - ${String(job.id)} status=${status} template=${templateKey} attempts=${String(job.attempts ?? "legacy")}`,
    );
    if (cli.expectedTemplate && runnableStates.has(status) && templateKey !== cli.expectedTemplate) {
      fail(`Runnable job ${String(job.id)} carries ${templateKey}; expected ${cli.expectedTemplate}. DO NOT RUN WORKER.`);
      hardFailures += 1;
    }
    if (status === "running") {
      fail(`Job ${String(job.id)} is already running; do not start another worker until its state is resolved.`);
      hardFailures += 1;
    }
    if (status === "completed" && cli.expectedTemplate && templateKey !== cli.expectedTemplate) {
      warn(`Completed job ${String(job.id)} used ${templateKey}; inspect tenant data for prior cross-template seed contamination.`);
    }
  }

  section("entitlement");
  const entitlementResult = await supabase
    .from("organization_subscriptions")
    .select("plan_key,status,started_at,ends_at")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (entitlementResult.error) throw new Error(`organization_subscriptions read failed: ${entitlementResult.error.message}`);
  if (!entitlementResult.data) warn("No organization_subscriptions row found.");
  else {
    console.log(`  plan_key: ${String(entitlementResult.data.plan_key)}`);
    console.log(`  status: ${String(entitlementResult.data.status)}`);
  }

  section("razorpay evidence");
  const billingResult = await supabase
    .from("billing_subscriptions")
    .select("provider,provider_subscription_id,plan_key,status,current_period_start,current_period_end,updated_at")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(10);
  if (billingResult.error) {
    warn(`billing_subscriptions unavailable: ${billingResult.error.message}`);
  } else if ((billingResult.data ?? []).length === 0) {
    console.log("  subscriptions: 0");
  } else {
    for (const row of billingResult.data ?? []) {
      console.log(
        `  - provider=${String(row.provider)} ref=${safeProviderRef(row.provider_subscription_id) ?? "none"} plan=${String(row.plan_key)} status=${String(row.status)}`,
      );
    }
  }

  const eventsResult = await supabase
    .from("billing_events")
    .select("provider,event_type,idempotency_key,processed_at")
    .eq("organization_id", orgId)
    .order("processed_at", { ascending: false })
    .limit(10);
  if (eventsResult.error) warn(`billing_events unavailable: ${eventsResult.error.message}`);
  else console.log(`  recent_billing_events: ${(eventsResult.data ?? []).length}`);

  section("recent audit evidence");
  const auditResult = await supabase
    .from("audit_logs")
    .select("actor_type,action,entity,entity_id,source,created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(12);
  if (auditResult.error) warn(`audit_logs unavailable: ${auditResult.error.message}`);
  else {
    for (const row of auditResult.data ?? []) {
      console.log(`  - ${String(row.created_at)} ${String(row.actor_type)} ${String(row.action)} ${String(row.entity)}`);
    }
  }

  section("execution-environment configuration presence");
  console.log(`  CRON_SECRET: ${present(process.env.CRON_SECRET) ? "present" : "absent"}`);
  console.log(`  RAZORPAY_KEY_ID mode: ${providerMode(process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)}`);
  console.log(`  RAZORPAY_KEY_SECRET: ${present(process.env.RAZORPAY_KEY_SECRET) ? "present" : "absent"}`);
  console.log(`  RAZORPAY_WEBHOOK_SECRET: ${present(process.env.RAZORPAY_WEBHOOK_SECRET) ? "present" : "absent"}`);
  console.log("  secret values are intentionally never printed");

  section("release decision");
  if (hardFailures > 0) {
    fail(`${hardFailures} hard blocker(s). Production provisioning remains BLOCKED.`);
    process.exit(1);
  }
  if (!cli.expectedTemplate) {
    warn("No --expected-template supplied; inspection passed, but no template safety assertion was made.");
    process.exit(0);
  }

  ok(`No read-only blocker detected for expected template ${cli.expectedTemplate}.`);
  console.log("  This command does NOT modify data and does NOT start the provisioning worker.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
