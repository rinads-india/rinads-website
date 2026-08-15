import type {
  DurableJob,
  MemoryRuntimeStore,
  OutboxMessage,
  WorkflowExecution,
} from "@rinads/runtime";
import type { TenantPolicy } from "@rinads/runtime";
import type { OperationsSupabaseClient } from "./supabase";

type UpsertResult = Promise<{ error: { message: string } | null }>;

export type RuntimeSupabaseClient = OperationsSupabaseClient & {
  rpc?: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
};

export function mapRuntimeJobRow(row: Record<string, unknown>): DurableJob {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    processorKey: String(row.processor_key),
    idempotencyKey: String(row.idempotency_key),
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as DurableJob["status"],
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 3),
    lastError: row.last_error ? String(row.last_error) : undefined,
    runAfter: String(row.run_after ?? new Date().toISOString()),
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapOutboxRow(row: Record<string, unknown>): OutboxMessage {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    channel: row.channel as OutboxMessage["channel"],
    templateKey: String(row.template_key),
    recipient: String(row.recipient),
    payload: (row.payload as Record<string, unknown>) ?? {},
    idempotencyKey: String(row.idempotency_key),
    status: row.status as OutboxMessage["status"],
    attempts: Number(row.attempts ?? 0),
    lastError: row.last_error ? String(row.last_error) : undefined,
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function jobToRow(organizationId: string, job: DurableJob): Record<string, unknown> {
  return {
    id: job.id,
    organization_id: organizationId,
    processor_key: job.processorKey,
    idempotency_key: job.idempotencyKey,
    payload: job.payload,
    status: job.status,
    attempts: job.attempts,
    max_attempts: job.maxAttempts,
    last_error: job.lastError ?? null,
    run_after: job.runAfter,
    correlation_id: job.correlationId ?? null,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

function outboxToRow(organizationId: string, msg: OutboxMessage): Record<string, unknown> {
  return {
    id: msg.id,
    organization_id: organizationId,
    channel: msg.channel,
    template_key: msg.templateKey,
    recipient: msg.recipient,
    payload: msg.payload,
    idempotency_key: msg.idempotencyKey,
    status: msg.status,
    attempts: msg.attempts,
    last_error: msg.lastError ?? null,
    correlation_id: msg.correlationId ?? null,
    created_at: msg.createdAt,
    updated_at: msg.updatedAt,
  };
}

export async function enqueueRuntimeJobToSupabase(
  client: RuntimeSupabaseClient,
  job: DurableJob
): Promise<void> {
  await client.from("runtime_jobs").upsert([jobToRow(job.organizationId, job)]);
}

export async function persistRuntimeJob(
  client: RuntimeSupabaseClient,
  job: DurableJob
): Promise<void> {
  await enqueueRuntimeJobToSupabase(client, job);
}

export async function persistExecutionSnapshot(
  client: RuntimeSupabaseClient,
  execution: WorkflowExecution
): Promise<void> {
  await client.from("runtime_execution_snapshots").upsert([
    {
      id: execution.id,
      organization_id: execution.organizationId,
      execution_json: execution,
      updated_at: new Date().toISOString(),
    },
  ]);
}

export async function resetStaleRunningJobs(
  client: RuntimeSupabaseClient,
  organizationId: string,
  staleMinutes = 10
): Promise<number> {
  if (client.rpc) {
    const { data, error } = await client.rpc("reset_stale_runtime_jobs", {
      p_org_id: organizationId,
      p_stale_minutes: staleMinutes,
    });
    if (error) return 0;
    return Number(data ?? 0);
  }
  return 0;
}

export async function claimRuntimeJobs(
  client: RuntimeSupabaseClient,
  organizationId: string,
  limit = 10
): Promise<DurableJob[]> {
  if (client.rpc) {
    const { data, error } = await client.rpc("claim_runtime_jobs", {
      p_org_id: organizationId,
      p_limit: limit,
    });
    if (error || !data) return [];
    return data.map(mapRuntimeJobRow);
  }
  return [];
}

export async function loadRuntimeStoreFromSupabase(
  client: RuntimeSupabaseClient,
  organizationId: string
): Promise<Partial<MemoryRuntimeStore>> {
  const fetch = (table: string) =>
    client.from(table).select("*").eq("organization_id", organizationId);

  const [
    { data: jobRows },
    { data: outboxRows },
    { data: policyRows },
    { data: dlqRows },
    { data: snapshotRows },
  ] = await Promise.all([
    fetch("runtime_jobs"),
    fetch("notification_outbox"),
    fetch("tenant_policies"),
    fetch("runtime_dead_letters"),
    fetch("runtime_execution_snapshots"),
  ]);

  const jobs = (jobRows ?? [])
    .map(mapRuntimeJobRow)
    .filter((j) => j.status !== "completed" && j.status !== "dead_letter");

  const messages = (outboxRows ?? [])
    .map(mapOutboxRow)
    .filter((m) => m.status === "pending" || m.status === "processing" || m.status === "failed");

  const policies: TenantPolicy[] = (policyRows ?? []).map((row) => ({
    organizationId,
    policyKey: String(row.policy_key),
    policyValue: (row.policy_value as Record<string, unknown>) ?? {},
    version: Number(row.version ?? 1),
  }));

  const deadLetters = (dlqRows ?? []).map((row) => ({
    id: String(row.id),
    organizationId,
    sourceType: String(row.source_type),
    sourceId: String(row.source_id),
    errorMessage: String(row.error_message),
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  }));

  const executions: WorkflowExecution[] = (snapshotRows ?? []).map((row) =>
    row.execution_json as WorkflowExecution
  );

  return { jobs, messages, policies, deadLetters, executions };
}

export async function loadRuntimeJobsFromSupabase(
  client: RuntimeSupabaseClient,
  organizationId: string
): Promise<DurableJob[]> {
  const { data } = await client.from("runtime_jobs").select("*").eq("organization_id", organizationId);
  return (data ?? []).map(mapRuntimeJobRow);
}

export async function syncRuntimeArtifactsToSupabase(
  client: RuntimeSupabaseClient,
  organizationId: string,
  store: MemoryRuntimeStore
): Promise<void> {
  const jobs = store.jobs.filter((j) => j.organizationId === organizationId);
  if (jobs.length) {
    await client.from("runtime_jobs").upsert(jobs.map((j) => jobToRow(organizationId, j)));
  }

  const messages = store.messages.filter((m) => m.organizationId === organizationId);
  if (messages.length) {
    await client.from("notification_outbox").upsert(messages.map((m) => outboxToRow(organizationId, m)));
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

  const deadLetters = store.deadLetters.filter((d) => d.organizationId === organizationId);
  if (deadLetters.length) {
    await client.from("runtime_dead_letters").upsert(
      deadLetters.map((d) => ({
        id: d.id,
        organization_id: organizationId,
        source_type: d.sourceType,
        source_id: d.sourceId,
        error_message: d.errorMessage,
        payload: d.payload,
        created_at: d.createdAt,
      }))
    );
  }

  const executions = store.executions.filter((e) => e.organizationId === organizationId);
  for (const execution of executions) {
    await persistExecutionSnapshot(client, execution);
  }
}
