export type DurableJobStatus = "queued" | "running" | "completed" | "failed" | "dead_letter";

export type DurableJob = {
  id: string;
  organizationId: string;
  processorKey: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  status: DurableJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  runAfter: string;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DeadLetterSourceType = "job" | "workflow" | "outbox";
export type DeadLetterStatus = "open" | "replayed" | "discarded";

export type DeadLetterRecord = {
  id: string;
  organizationId: string;
  sourceType: DeadLetterSourceType;
  sourceId: string;
  errorClass?: string;
  errorMessage: string;
  payload: Record<string, unknown>;
  status: DeadLetterStatus;
  replayCount: number;
  replayedAt?: string;
  replayedBy?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type JobQueueStore = {
  jobs: DurableJob[];
  deadLetters: DeadLetterRecord[];
  nextId: (prefix: string) => string;
};

export function enqueueJob(
  store: JobQueueStore,
  input: Omit<DurableJob, "id" | "status" | "attempts" | "createdAt" | "updatedAt" | "runAfter"> & {
    runAfter?: string;
  }
): DurableJob {
  const existing = store.jobs.find(
    (j) => j.organizationId === input.organizationId && j.idempotencyKey === input.idempotencyKey
  );
  if (existing) return existing;

  const job: DurableJob = {
    id: store.nextId("job"),
    organizationId: input.organizationId,
    processorKey: input.processorKey,
    idempotencyKey: input.idempotencyKey,
    payload: input.payload,
    status: "queued",
    attempts: 0,
    maxAttempts: input.maxAttempts,
    correlationId: input.correlationId,
    runAfter: input.runAfter ?? new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.jobs.push(job);
  return job;
}

export function computeBackoffMs(attempt: number, baseMs = 1000, capMs = 60000): number {
  return Math.min(capMs, baseMs * Math.pow(2, attempt));
}

export type JobProcessor = {
  key: string;
  handle: (ctx: { organizationId: string }, payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string; retryable?: boolean }>;
};

function createDeadLetter(
  store: JobQueueStore,
  job: DurableJob,
  input: { errorMessage: string; errorClass?: string; now?: Date }
): DeadLetterRecord {
  const existingOpen = store.deadLetters.find(
    (d) =>
      d.organizationId === job.organizationId &&
      d.sourceType === "job" &&
      d.sourceId === job.id &&
      d.status === "open"
  );
  if (existingOpen) return existingOpen;

  const nowIso = (input.now ?? new Date()).toISOString();
  const deadLetter: DeadLetterRecord = {
    id: store.nextId("dlq"),
    organizationId: job.organizationId,
    sourceType: "job",
    sourceId: job.id,
    errorClass: input.errorClass,
    errorMessage: input.errorMessage,
    payload: job.payload,
    status: "open",
    replayCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  store.deadLetters.push(deadLetter);
  return deadLetter;
}

export type ProcessJobQueueOptions = {
  onJobUpdated?: (job: DurableJob) => void;
  onDeadLetterUpdated?: (deadLetter: DeadLetterRecord) => void;
};

export async function processJobQueue(
  store: JobQueueStore,
  processors: Map<string, JobProcessor>,
  now = new Date(),
  options?: ProcessJobQueueOptions
): Promise<{ processed: number; failed: number; deadLetter: number }> {
  let processed = 0;
  let failed = 0;
  let deadLetter = 0;

  const eligible = store.jobs.filter(
    (j) =>
      (j.status === "queued" || j.status === "failed") &&
      new Date(j.runAfter).getTime() <= now.getTime()
  );

  for (const job of eligible) {
    if (job.attempts >= job.maxAttempts) {
      job.status = "dead_letter";
      job.updatedAt = now.toISOString();
      const dlq = createDeadLetter(store, job, {
        errorMessage: job.lastError ?? "Max attempts exceeded",
        errorClass: "max_attempts_exceeded",
        now,
      });
      options?.onDeadLetterUpdated?.(dlq);
      options?.onJobUpdated?.(job);
      deadLetter++;
      continue;
    }

    const processor = processors.get(job.processorKey);
    if (!processor) {
      job.lastError = "Processor not found";
      job.status = "dead_letter";
      job.updatedAt = now.toISOString();
      const dlq = createDeadLetter(store, job, {
        errorMessage: job.lastError,
        errorClass: "processor_not_found",
        now,
      });
      options?.onDeadLetterUpdated?.(dlq);
      options?.onJobUpdated?.(job);
      deadLetter++;
      continue;
    }

    job.status = "running";
    job.attempts++;
    job.updatedAt = new Date().toISOString();

    try {
      const result = await processor.handle({ organizationId: job.organizationId }, job.payload);
      if (result.ok) {
        job.status = "completed";
        processed++;
      } else {
        job.lastError = result.error;
        if (job.attempts >= job.maxAttempts || result.retryable === false) {
          job.status = "dead_letter";
          const dlq = createDeadLetter(store, job, {
            errorMessage: result.error ?? "Processor returned terminal failure",
            errorClass: result.retryable === false ? "non_retryable_failure" : "max_attempts_exceeded",
          });
          options?.onDeadLetterUpdated?.(dlq);
          deadLetter++;
        } else {
          job.status = "failed";
          job.runAfter = new Date(Date.now() + computeBackoffMs(job.attempts)).toISOString();
          failed++;
        }
      }
    } catch (e) {
      job.lastError = e instanceof Error ? e.message : "Unknown error";
      job.status = job.attempts >= job.maxAttempts ? "dead_letter" : "failed";
      if (job.status === "dead_letter") {
        const dlq = createDeadLetter(store, job, {
          errorMessage: job.lastError,
          errorClass: "processor_exception",
        });
        options?.onDeadLetterUpdated?.(dlq);
        deadLetter++;
      } else {
        failed++;
      }
    }
    job.updatedAt = new Date().toISOString();
    options?.onJobUpdated?.(job);
  }

  return { processed, failed, deadLetter };
}

export type ReplayDeadLetterResult =
  | { ok: true; job: DurableJob; deadLetter: DeadLetterRecord }
  | { ok: false; error: string; errorClass: string };

/**
 * Replay is intentionally conservative:
 * - tenant must match
 * - only job dead letters are replayable in v1
 * - the source job must still exist and remain dead-lettered
 * - replay reuses the original job/idempotency key instead of cloning work
 * - the DLQ record is retained as immutable operational history with resolution metadata
 */
export function replayDeadLetter(
  store: JobQueueStore,
  input: {
    organizationId: string;
    deadLetterId: string;
    replayedBy: string;
    resolutionNote?: string;
    now?: Date;
  }
): ReplayDeadLetterResult {
  const deadLetter = store.deadLetters.find(
    (d) => d.id === input.deadLetterId && d.organizationId === input.organizationId
  );
  if (!deadLetter) {
    return { ok: false, error: "Dead letter not found for tenant", errorClass: "not_found" };
  }
  if (deadLetter.sourceType !== "job") {
    return { ok: false, error: "Only job dead letters are replayable in v1", errorClass: "unsupported_source" };
  }
  if (deadLetter.status !== "open") {
    return { ok: false, error: `Dead letter is already ${deadLetter.status}`, errorClass: "already_resolved" };
  }

  const job = store.jobs.find(
    (j) => j.id === deadLetter.sourceId && j.organizationId === input.organizationId
  );
  if (!job) {
    return { ok: false, error: "Source job not found for dead letter", errorClass: "source_not_found" };
  }
  if (job.status !== "dead_letter") {
    return { ok: false, error: `Source job is ${job.status}, not dead_letter`, errorClass: "invalid_source_state" };
  }

  const nowIso = (input.now ?? new Date()).toISOString();
  job.status = "queued";
  job.attempts = 0;
  job.lastError = undefined;
  job.runAfter = nowIso;
  job.updatedAt = nowIso;

  deadLetter.status = "replayed";
  deadLetter.replayCount += 1;
  deadLetter.replayedAt = nowIso;
  deadLetter.replayedBy = input.replayedBy;
  deadLetter.resolutionNote = input.resolutionNote;
  deadLetter.updatedAt = nowIso;

  return { ok: true, job, deadLetter };
}

export function listJobs(store: JobQueueStore, organizationId: string): DurableJob[] {
  return store.jobs.filter((j) => j.organizationId === organizationId);
}
