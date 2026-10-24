export type ProvisioningJobStatus =
  | "pending"
  | "running"
  | "retrying"
  | "blocked"
  | "dead_letter"
  | "completed"
  | "failed";

export type ProvisioningJobRow = {
  id: string;
  organization_id: string;
  template_key: string;
  status: ProvisioningJobStatus;
  idempotency_key?: string | null;
  error_message?: string | null;
  attempts?: number;
  next_attempt_at?: string | null;
  last_error_class?: string | null;
  dead_lettered_at?: string | null;
  completed_at?: string | null;
};

export type ProvisioningJobClient = {
  from: (table: string) => {
    select: (cols?: string) => {
      eq: (col: string, val: string) => Promise<{ data: ProvisioningJobRow[] | null; error: { message: string } | null }>;
    };
    update: (row: Partial<ProvisioningJobRow>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export const MAX_PROVISIONING_ATTEMPTS = 6;
const PROVISIONING_BACKOFF_MS = [30_000, 120_000, 300_000, 900_000, 1_800_000] as const;

export function provisioningBackoffMs(attempts: number): number {
  const index = Math.max(0, Math.min(PROVISIONING_BACKOFF_MS.length - 1, attempts - 1));
  return PROVISIONING_BACKOFF_MS[index];
}

export function isProvisioningJobRunnable(job: ProvisioningJobRow, nowMs: number = Date.now()): boolean {
  if (job.status === "pending") return true;
  if (job.status !== "retrying") return false;
  if (!job.next_attempt_at) return true;
  const next = Date.parse(job.next_attempt_at);
  return !Number.isFinite(next) || next <= nowMs;
}

export async function markProvisioningJobRunning(
  client: ProvisioningJobClient,
  jobId: string,
  attempts: number
): Promise<boolean> {
  const { error } = await client
    .from("tenant_provisioning_jobs")
    .update({
      status: "running",
      attempts,
      next_attempt_at: null,
      error_message: null,
      last_error_class: null,
    })
    .eq("id", jobId);
  return !error;
}

export async function markProvisioningJobBlocked(
  client: ProvisioningJobClient,
  jobId: string,
  errorMessage: string,
  errorClass = "entitlement"
): Promise<boolean> {
  const { error } = await client
    .from("tenant_provisioning_jobs")
    .update({
      status: "blocked",
      error_message: errorMessage,
      last_error_class: errorClass,
      next_attempt_at: null,
    })
    .eq("id", jobId);
  return !error;
}

export async function scheduleProvisioningRetry(
  client: ProvisioningJobClient,
  jobId: string,
  attempts: number,
  errorMessage: string,
  errorClass = "transient",
  nowMs: number = Date.now()
): Promise<boolean> {
  const nextAttemptAt = new Date(nowMs + provisioningBackoffMs(attempts)).toISOString();
  const { error } = await client
    .from("tenant_provisioning_jobs")
    .update({
      status: "retrying",
      attempts,
      error_message: errorMessage,
      last_error_class: errorClass,
      next_attempt_at: nextAttemptAt,
    })
    .eq("id", jobId);
  return !error;
}

export async function deadLetterProvisioningJob(
  client: ProvisioningJobClient,
  jobId: string,
  attempts: number,
  errorMessage: string,
  errorClass: string,
  nowMs: number = Date.now()
): Promise<boolean> {
  const { error } = await client
    .from("tenant_provisioning_jobs")
    .update({
      status: "dead_letter",
      attempts,
      error_message: errorMessage,
      last_error_class: errorClass,
      next_attempt_at: null,
      dead_lettered_at: new Date(nowMs).toISOString(),
    })
    .eq("id", jobId);
  return !error;
}

export async function resetDeadLetteredProvisioningJob(
  client: ProvisioningJobClient,
  jobId: string
): Promise<boolean> {
  const { error } = await client
    .from("tenant_provisioning_jobs")
    .update({
      status: "pending",
      attempts: 0,
      error_message: null,
      last_error_class: null,
      next_attempt_at: null,
      dead_lettered_at: null,
      completed_at: null,
    })
    .eq("id", jobId);
  return !error;
}

export async function completeProvisioningJob(
  client: ProvisioningJobClient,
  jobId: string
): Promise<boolean> {
  const { error } = await client
    .from("tenant_provisioning_jobs")
    .update({
      status: "completed",
      error_message: null,
      last_error_class: null,
      next_attempt_at: null,
      dead_lettered_at: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  return !error;
}

export async function listPendingProvisioningJobs(
  client: ProvisioningJobClient,
  organizationId: string
): Promise<ProvisioningJobRow[]> {
  const { data } = await client
    .from("tenant_provisioning_jobs")
    .select("*")
    .eq("organization_id", organizationId);
  return (data ?? []).filter((job) =>
    job.status === "pending" || job.status === "running" || job.status === "retrying"
  );
}
