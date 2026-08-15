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

export type JobQueueStore = {
  jobs: DurableJob[];
  deadLetters: { id: string; organizationId: string; sourceType: string; sourceId: string; errorMessage: string; payload: Record<string, unknown>; createdAt: string }[];
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

export async function processJobQueue(
  store: JobQueueStore,
  processors: Map<string, JobProcessor>,
  now = new Date()
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
      store.deadLetters.push({
        id: store.nextId("dlq"),
        organizationId: job.organizationId,
        sourceType: "job",
        sourceId: job.id,
        errorMessage: job.lastError ?? "Max attempts exceeded",
        payload: job.payload,
        createdAt: new Date().toISOString(),
      });
      deadLetter++;
      continue;
    }

    const processor = processors.get(job.processorKey);
    if (!processor) {
      job.lastError = "Processor not found";
      job.status = "dead_letter";
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
      if (job.status === "dead_letter") deadLetter++;
      else failed++;
    }
    job.updatedAt = new Date().toISOString();
  }

  return { processed, failed, deadLetter };
}

export function listJobs(store: JobQueueStore, organizationId: string): DurableJob[] {
  return store.jobs.filter((j) => j.organizationId === organizationId);
}
