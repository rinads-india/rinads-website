import type { MemoryRuntimeStore } from "@rinads/runtime";
import type { OperationsSupabaseClient } from "./supabase";

type UpsertResult = Promise<{ error: { message: string } | null }>;

export type RuntimeSupabaseClient = OperationsSupabaseClient;

export async function syncRuntimeArtifactsToSupabase(
  client: RuntimeSupabaseClient,
  organizationId: string,
  store: MemoryRuntimeStore
): Promise<void> {
  const jobs = store.jobs.filter((j) => j.organizationId === organizationId);
  if (jobs.length) {
    await client.from("runtime_jobs").upsert(
      jobs.map((j) => ({
        id: j.id,
        organization_id: organizationId,
        processor_key: j.processorKey,
        idempotency_key: j.idempotencyKey,
        payload: j.payload,
        status: j.status,
        attempts: j.attempts,
        max_attempts: j.maxAttempts,
        last_error: j.lastError ?? null,
        run_after: j.runAfter,
        correlation_id: j.correlationId ?? null,
        created_at: j.createdAt,
        updated_at: j.updatedAt,
      }))
    );
  }

  const messages = store.messages.filter((m) => m.organizationId === organizationId);
  if (messages.length) {
    await client.from("notification_outbox").upsert(
      messages.map((m) => ({
        id: m.id,
        organization_id: organizationId,
        channel: m.channel,
        template_key: m.templateKey,
        recipient: m.recipient,
        payload: m.payload,
        idempotency_key: m.idempotencyKey,
        status: m.status,
        attempts: m.attempts,
        last_error: m.lastError ?? null,
        correlation_id: m.correlationId ?? null,
        created_at: m.createdAt,
        updated_at: m.updatedAt,
      }))
    );
  }

  const policies = store.policies.filter((p) => p.organizationId === organizationId);
  if (policies.length) {
    await client.from("tenant_policies").upsert(
      policies.map((p) => ({
        organization_id: organizationId,
        policy_key: p.policyKey,
        policy_value: p.policyValue,
        version: p.version,
        is_active: true,
      }))
    );
  }
}

export async function loadRuntimeJobsFromSupabase(
  client: RuntimeSupabaseClient,
  organizationId: string
): Promise<Record<string, unknown>[]> {
  const { data } = await client.from("runtime_jobs").select("*").eq("organization_id", organizationId);
  return data ?? [];
}
