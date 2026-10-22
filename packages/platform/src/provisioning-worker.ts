import { seedTenantBundle, type VerticalTemplateKey } from "./templates/index";
import {
  completeProvisioningJob,
  markProvisioningJobRunning,
  type ProvisioningJobClient,
  type ProvisioningJobRow,
} from "./runtime-jobs";
import type { CommerceSupabaseClient } from "@rinads/commerce-server";
import {
  createSupabaseCommerceRepository,
  loadCommerceStoreFromSupabase,
  seedOrgCommerceStore,
} from "@rinads/commerce-server";
import type { OperationsSupabaseClient } from "@rinads/operations-server";
import {
  createSupabaseOperationsRepository,
  loadOperationsStoreFromSupabase,
} from "@rinads/operations-server";

export type ProvisioningWorkerClient = ProvisioningJobClient &
  CommerceSupabaseClient &
  OperationsSupabaseClient & {
    from: (table: string) => {
      select: (cols?: string) => {
        eq: (col: string, val: string) => Promise<{ data: ProvisioningJobRow[] | null; error: { message: string } | null }>;
        in?: (
          col: string,
          vals: string[]
        ) => Promise<{ data: ProvisioningJobRow[] | null; error: { message: string } | null }>;
      };
      update: (row: Partial<ProvisioningJobRow>) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };

export type ProvisioningJobResult =
  | { ok: true }
  | { ok: false; error: string; blocked?: boolean };

type SubscriptionLookupClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
  };
};

async function requireActiveSubscription(
  client: ProvisioningWorkerClient,
  organizationId: string
): Promise<{ active: true } | { active: false; error: string }> {
  const subscriptionClient = client as unknown as SubscriptionLookupClient;
  const { data, error } = await subscriptionClient
    .from("organization_subscriptions")
    .select("status")
    .eq("organization_id", organizationId);

  if (error) {
    return { active: false, error: "Could not verify subscription entitlement" };
  }

  const active = (data ?? []).some((row) => String(row.status ?? "") === "active");
  if (!active) {
    return { active: false, error: "Subscription is not active" };
  }

  return { active: true };
}

export async function listAllPendingJobs(client: ProvisioningWorkerClient): Promise<ProvisioningJobRow[]> {
  const { data, error } = await client.from("tenant_provisioning_jobs").select("*").eq("status", "pending");
  if (error || !data) return [];
  return data;
}

export async function processProvisioningJob(
  client: ProvisioningWorkerClient,
  job: ProvisioningJobRow
): Promise<ProvisioningJobResult> {
  // Defense in depth: even if a stale/legacy pending job exists, no tenant data
  // may be seeded until the webhook-authoritative entitlement is active.
  const entitlement = await requireActiveSubscription(client, job.organization_id);
  if (!entitlement.active) {
    return { ok: false, error: entitlement.error, blocked: true };
  }

  const running = await markProvisioningJobRunning(client, job.id);
  if (!running) return { ok: false, error: "Could not mark job running" };

  try {
    const orgId = job.organization_id;
    const templateKey = job.template_key as VerticalTemplateKey;

    const existingCommerce = await loadCommerceStoreFromSupabase(client, orgId);
    if (!existingCommerce) {
      const bundle = seedTenantBundle(orgId, templateKey);
      seedOrgCommerceStore(orgId, bundle.commerce);
      createSupabaseOperationsRepository({
        organizationId: orgId,
        client,
        initialStore: bundle.operations,
      });
      const repo = createSupabaseCommerceRepository({
        organizationId: orgId,
        client,
        initialStore: bundle.commerce,
      });
      repo.saveStore(repo.getStore());
    } else {
      const existingOps = await loadOperationsStoreFromSupabase(client, orgId);
      if (!existingOps) {
        const bundle = seedTenantBundle(orgId, templateKey);
        createSupabaseOperationsRepository({
          organizationId: orgId,
          client,
          initialStore: bundle.operations,
        }).saveStore(bundle.operations);
      }
    }

    await completeProvisioningJob(client, job.id);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Provisioning failed";
    await completeProvisioningJob(client, job.id, message);
    return { ok: false, error: message };
  }
}

export async function runPendingProvisioningJobs(
  client: ProvisioningWorkerClient
): Promise<{ processed: number; failed: number; blocked: number }> {
  const jobs = await listAllPendingJobs(client);
  let processed = 0;
  let failed = 0;
  let blocked = 0;

  for (const job of jobs) {
    const result = await processProvisioningJob(client, job);
    if (result.ok) processed++;
    else if (result.blocked) blocked++;
    else failed++;
  }

  return { processed, failed, blocked };
}
