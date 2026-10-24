import { seedTenantBundle, type VerticalTemplateKey } from "./templates/index";
import {
  MAX_PROVISIONING_ATTEMPTS,
  completeProvisioningJob,
  deadLetterProvisioningJob,
  isProvisioningJobRunnable,
  markProvisioningJobBlocked,
  markProvisioningJobRunning,
  scheduleProvisioningRetry,
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
      };
      update: (row: Partial<ProvisioningJobRow>) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };

export type ProvisioningJobResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      blocked?: boolean;
      retrying?: boolean;
      deadLettered?: boolean;
    };

type EntitlementLookupClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
  };
};

type AuditInsertClient = {
  from: (table: string) => {
    insert?: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

export function isUnexpiredTrialGrant(
  row: Record<string, unknown>,
  nowMs: number = Date.now(),
): boolean {
  if (row.revoked_at) return false;
  const expiresAt = Date.parse(String(row.expires_at ?? ""));
  return Number.isFinite(expiresAt) && expiresAt > nowMs;
}

export function classifyProvisioningError(message: string): "permanent" | "transient" {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("unknown template") ||
    normalized.includes("invalid template") ||
    normalized.includes("permission denied") ||
    normalized.includes("row-level security") ||
    normalized.includes("foreign key")
  ) {
    return "permanent";
  }
  return "transient";
}

async function requireProvisioningEntitlement(
  client: ProvisioningWorkerClient,
  organizationId: string
): Promise<{ active: true; source: "paid" | "trial" } | { active: false; error: string }> {
  const entitlementClient = client as unknown as EntitlementLookupClient;
  const subscriptionResult = await entitlementClient
    .from("organization_subscriptions")
    .select("status")
    .eq("organization_id", organizationId);

  if (subscriptionResult.error) {
    return { active: false, error: "Could not verify subscription entitlement" };
  }

  const paidActive = (subscriptionResult.data ?? []).some(
    (row) => String(row.status ?? "") === "active"
  );
  if (paidActive) {
    return { active: true, source: "paid" };
  }

  const trialResult = await entitlementClient
    .from("trial_grants")
    .select("expires_at, revoked_at")
    .eq("organization_id", organizationId);

  if (trialResult.error) {
    return { active: false, error: "Could not verify trial entitlement" };
  }

  const trialActive = (trialResult.data ?? []).some((row) => isUnexpiredTrialGrant(row));
  if (trialActive) {
    return { active: true, source: "trial" };
  }

  return { active: false, error: "No active paid or trial entitlement" };
}

async function auditProvisioningTransition(
  client: ProvisioningWorkerClient,
  job: ProvisioningJobRow,
  action: string,
  after: Record<string, unknown>
): Promise<void> {
  try {
    const auditClient = client as unknown as AuditInsertClient;
    const table = auditClient.from("audit_logs");
    if (typeof table.insert !== "function") return;
    const { error } = await table.insert({
      organization_id: job.organization_id,
      actor_type: "system",
      actor_id: "provisioning-worker",
      action: `tenant.provisioning.${action}`,
      entity: "tenant_provisioning_job",
      entity_id: job.id,
      after,
    });
    if (error) console.error("provisioning audit insert failed", error.message);
  } catch (error) {
    console.error("provisioning audit insert failed", error);
  }
}

export async function listAllRunnableJobs(
  client: ProvisioningWorkerClient,
  nowMs: number = Date.now()
): Promise<ProvisioningJobRow[]> {
  const [pendingResult, retryingResult] = await Promise.all([
    client.from("tenant_provisioning_jobs").select("*").eq("status", "pending"),
    client.from("tenant_provisioning_jobs").select("*").eq("status", "retrying"),
  ]);
  const jobs = [
    ...(pendingResult.error ? [] : pendingResult.data ?? []),
    ...(retryingResult.error ? [] : retryingResult.data ?? []),
  ];
  const unique = new Map(jobs.map((job) => [job.id, job]));
  return [...unique.values()].filter((job) => isProvisioningJobRunnable(job, nowMs));
}

export async function processProvisioningJob(
  client: ProvisioningWorkerClient,
  job: ProvisioningJobRow
): Promise<ProvisioningJobResult> {
  // Defense in depth: no tenant data is seeded until a webhook-authoritative
  // paid entitlement OR an unexpired governed trial grant is active.
  const entitlement = await requireProvisioningEntitlement(client, job.organization_id);
  if (!entitlement.active) {
    await markProvisioningJobBlocked(client, job.id, entitlement.error);
    await auditProvisioningTransition(client, job, "blocked", {
      status: "blocked",
      reason: entitlement.error,
    });
    return { ok: false, error: entitlement.error, blocked: true };
  }

  const attempts = (job.attempts ?? 0) + 1;
  const running = await markProvisioningJobRunning(client, job.id, attempts);
  if (!running) return { ok: false, error: "Could not mark job running" };
  await auditProvisioningTransition(client, job, "running", {
    status: "running",
    attempts,
    entitlement_source: entitlement.source,
  });

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
    await auditProvisioningTransition(client, job, "completed", {
      status: "completed",
      attempts,
      entitlement_source: entitlement.source,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provisioning failed";
    const errorClass = classifyProvisioningError(message);
    const shouldDeadLetter =
      errorClass === "permanent" || attempts >= MAX_PROVISIONING_ATTEMPTS;

    if (shouldDeadLetter) {
      await deadLetterProvisioningJob(client, job.id, attempts, message, errorClass);
      await auditProvisioningTransition(client, job, "dead_letter", {
        status: "dead_letter",
        attempts,
        error_class: errorClass,
        error_message: message,
      });
      return { ok: false, error: message, deadLettered: true };
    }

    await scheduleProvisioningRetry(client, job.id, attempts, message, errorClass);
    await auditProvisioningTransition(client, job, "retrying", {
      status: "retrying",
      attempts,
      error_class: errorClass,
      error_message: message,
    });
    return { ok: false, error: message, retrying: true };
  }
}

export async function runPendingProvisioningJobs(
  client: ProvisioningWorkerClient
): Promise<{
  processed: number;
  failed: number;
  blocked: number;
  retrying: number;
  deadLettered: number;
}> {
  const jobs = await listAllRunnableJobs(client);
  let processed = 0;
  let failed = 0;
  let blocked = 0;
  let retrying = 0;
  let deadLettered = 0;

  for (const job of jobs) {
    const result = await processProvisioningJob(client, job);
    if (result.ok) processed++;
    else if (result.blocked) blocked++;
    else if (result.retrying) retrying++;
    else if (result.deadLettered) deadLettered++;
    else failed++;
  }

  return { processed, failed, blocked, retrying, deadLettered };
}
