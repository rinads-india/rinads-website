import type { OperationsContext } from "@rinads/operations";
import type { BusinessEvent } from "@rinads/operations";
import type { OperationsRepository } from "@rinads/operations";
import type { RuntimeEventType, RuntimeJob, EventProcessor } from "./types";

export class EventStore {
  constructor(private readonly repo: OperationsRepository) {}

  emit(
    ctx: OperationsContext,
    eventType: RuntimeEventType | string,
    payload: Record<string, unknown>,
    idempotencyKey?: string
  ): BusinessEvent {
    const store = this.repo.getStore();
    if (idempotencyKey) {
      const dup = store.businessEvents.find(
        (e) =>
          e.organizationId === ctx.organizationId &&
          e.idempotencyKey === idempotencyKey
      );
      if (dup) return dup;
    }

    const event: BusinessEvent = {
      id: this.repo.nextId("evt"),
      organizationId: ctx.organizationId,
      eventType,
      entityType: typeof payload.entityType === "string" ? payload.entityType : undefined,
      entityId: typeof payload.entityId === "string" ? payload.entityId : undefined,
      payload,
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    store.businessEvents.push(event);
    this.repo.saveStore(store);
    return event;
  }

  list(ctx: OperationsContext, eventType?: string): BusinessEvent[] {
    return this.repo
      .getStore()
      .businessEvents.filter(
        (e) => e.organizationId === ctx.organizationId && (!eventType || e.eventType === eventType)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export class JobRunner {
  private processors = new Map<string, EventProcessor>();
  private jobs: RuntimeJob[] = [];

  register(processor: EventProcessor): void {
    this.processors.set(processor.key, processor);
  }

  enqueue(input: Omit<RuntimeJob, "id" | "status" | "attempts" | "createdAt" | "updatedAt">): RuntimeJob {
    const existing = this.jobs.find((j) => j.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;

    const job: RuntimeJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...input,
      status: "pending",
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.push(job);
    return job;
  }

  async processPending(): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;
    const pending = this.jobs.filter((j) => j.status === "pending" || j.status === "failed");

    for (const job of pending) {
      if (job.attempts >= job.maxAttempts) {
        job.status = "dead_letter";
        failed++;
        continue;
      }

      const processor = this.processors.get(job.processorKey);
      if (!processor) {
        job.lastError = "Processor not found";
        job.status = "dead_letter";
        failed++;
        continue;
      }

      job.status = "processing";
      job.attempts++;
      job.updatedAt = new Date().toISOString();

      try {
        const result = await processor.handle(
          { organizationId: job.organizationId },
          job.payload
        );
        if (result.ok) {
          job.status = "completed";
          processed++;
        } else {
          job.lastError = result.error;
          job.status = job.attempts >= job.maxAttempts ? "dead_letter" : "failed";
          failed++;
        }
      } catch (e) {
        job.lastError = e instanceof Error ? e.message : "Unknown error";
        job.status = job.attempts >= job.maxAttempts ? "dead_letter" : "failed";
        failed++;
      }
      job.updatedAt = new Date().toISOString();
    }

    return { processed, failed };
  }

  retry(jobId: string): RuntimeJob | undefined {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job || job.status !== "dead_letter") return undefined;
    job.status = "pending";
    job.attempts = 0;
    job.updatedAt = new Date().toISOString();
    return job;
  }

  getJobs(status?: RuntimeJob["status"]): RuntimeJob[] {
    return status ? this.jobs.filter((j) => j.status === status) : [...this.jobs];
  }
}

export class AlertEngine {
  constructor(private readonly repo: OperationsRepository) {}

  createAlert(
    ctx: OperationsContext,
    input: {
      alertType: string;
      title: string;
      message: string;
      entityType?: string;
      entityId?: string;
      severity?: "info" | "warning" | "critical";
    }
  ): void {
    const store = this.repo.getStore();
    const dup = store.alerts.find(
      (a) =>
        a.organizationId === ctx.organizationId &&
        a.alertType === input.alertType &&
        a.entityId === input.entityId &&
        !a.acknowledged
    );
    if (dup) return;

    store.alerts.push({
      id: this.repo.nextId("alt"),
      organizationId: ctx.organizationId,
      alertType: input.alertType,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
      severity: input.severity ?? "warning",
      acknowledged: false,
      createdAt: new Date().toISOString(),
    });
    this.repo.saveStore(store);
  }

  list(ctx: OperationsContext, unacknowledgedOnly = true) {
    return this.repo
      .getStore()
      .alerts.filter(
        (a) =>
          a.organizationId === ctx.organizationId && (!unacknowledgedOnly || !a.acknowledged)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
