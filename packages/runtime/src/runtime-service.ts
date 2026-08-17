import type { OperationsRepository } from "@rinads/operations";
import { emitEvent, listEvents, maskEventPayload } from "./events/emit";
import type { EmitEventInput, RuntimeEventRecord } from "./events/types";
import { newCorrelationId } from "./events/types";
import { checkEventLoop } from "./loop-guard";
import {
  enqueueJob,
  processJobQueue,
  type DurableJob,
  type JobProcessor,
  type JobQueueStore,
} from "./queue/durable-queue";
import {
  findWorkflowByTrigger,
  type WorkflowDefinition,
  type WorkflowExecution,
} from "./workflow/types";
import {
  getExecutionCounts,
  listExecutions,
  runWorkflowExecution,
  triggerWorkflowsForEvent,
  type WorkflowEngineOptions,
  type WorkflowStore,
} from "./workflow/engine";
import {
  createApprovalRequest,
  listPendingApprovals,
  resolveApproval,
  type ApprovalStore,
} from "./approval/approval";
import { approveWorkflowStep } from "./workflow/engine";
import { enqueueNotification, listOutbox, type OutboxStore } from "./outbox/outbox";
import { processOutbox } from "./outbox/processor";
import { emailAdapter, whatsappAdapter } from "./adapters/email";
import { seedSchedulesForOrg, tickScheduler, type SchedulerStore } from "./scheduler/scheduler";
import { createMemoryRuntimeStore, type MemoryRuntimeStore } from "./store/memory-store";
import type { ActionContext } from "./actions/executor";
import { getAction } from "./actions/registry";

export type RuntimePersistenceHooks = {
  onJobEnqueued?: (job: DurableJob) => void | Promise<void>;
  onJobUpdated?: (job: DurableJob) => void | Promise<void>;
  onExecutionUpdated?: (execution: WorkflowExecution) => void | Promise<void>;
};

export type RuntimeServiceOptions = {
  store?: MemoryRuntimeStore;
  processors?: Map<string, JobProcessor>;
  opsRepo?: OperationsRepository;
  persistenceHooks?: RuntimePersistenceHooks;
};

export class RuntimeService {
  readonly store: MemoryRuntimeStore;
  readonly processors: Map<string, JobProcessor>;
  private readonly persistenceHooks?: RuntimePersistenceHooks;

  constructor(options: RuntimeServiceOptions = {}) {
    this.store = options.store ?? createMemoryRuntimeStore();
    this.processors = options.processors ?? new Map();
    this.persistenceHooks = options.persistenceHooks;
    if (options.opsRepo) {
      this.bridgeLegacyEventStore(options.opsRepo);
    }
  }

  /** Mirror runtime events into legacy businessEvents for Supabase sync. */
  private bridgeLegacyEventStore(repo: OperationsRepository): void {
    const originalSave = repo.saveStore.bind(repo);
    repo.saveStore = (store) => {
      for (const evt of this.store.events) {
        const exists = store.businessEvents.some((e) => e.id === evt.id);
        if (!exists) {
          store.businessEvents.push({
            id: evt.id,
            organizationId: evt.organizationId,
            eventType: evt.eventType,
            entityType: evt.aggregateType,
            entityId: evt.aggregateId,
            payload: {
              ...evt.payload,
              correlationId: evt.correlationId,
              causationId: evt.causationId,
              metadata: evt.metadata,
              source: evt.source,
            },
            idempotencyKey: evt.idempotencyKey,
            createdAt: evt.createdAt,
          });
        }
      }
      originalSave(store);
    };
  }

  registerProcessor(processor: JobProcessor): void {
    this.processors.set(processor.key, processor);
  }

  hydrateStore(partial: Partial<MemoryRuntimeStore>): void {
    if (partial.jobs?.length) {
      for (const job of partial.jobs) {
        const idx = this.store.jobs.findIndex((j) => j.id === job.id);
        if (idx >= 0) this.store.jobs[idx] = job;
        else this.store.jobs.push(job);
      }
    }
    if (partial.messages?.length) {
      for (const msg of partial.messages) {
        const idx = this.store.messages.findIndex((m) => m.id === msg.id);
        if (idx >= 0) this.store.messages[idx] = msg;
        else this.store.messages.push(msg);
      }
    }
    if (partial.policies?.length) {
      for (const policy of partial.policies) {
        const idx = this.store.policies.findIndex(
          (p) => p.organizationId === policy.organizationId && p.policyKey === policy.policyKey
        );
        if (idx >= 0) this.store.policies[idx] = policy;
        else this.store.policies.push(policy);
      }
    }
    if (partial.deadLetters?.length) {
      for (const dlq of partial.deadLetters) {
        if (!this.store.deadLetters.some((d) => d.id === dlq.id)) {
          this.store.deadLetters.push(dlq);
        }
      }
    }
    if (partial.executions?.length) {
      for (const execution of partial.executions) {
        const idx = this.store.executions.findIndex((e) => e.id === execution.id);
        if (idx >= 0) this.store.executions[idx] = execution;
        else this.store.executions.push(execution);
      }
    }
    if (partial.schedules?.length) {
      for (const schedule of partial.schedules) {
        if (!this.store.schedules.some((s) => s.id === schedule.id)) {
          this.store.schedules.push(schedule);
        }
      }
    }
  }

  private trackJobEnqueue(job: DurableJob): DurableJob {
    void this.persistenceHooks?.onJobEnqueued?.(job);
    return job;
  }

  private trackExecution(execution: WorkflowExecution): WorkflowExecution {
    void this.persistenceHooks?.onExecutionUpdated?.(execution);
    return execution;
  }

  private enqueueTracked(
    input: Parameters<typeof enqueueJob>[1]
  ): DurableJob {
    const job = enqueueJob(this.store, input);
    return this.trackJobEnqueue(job);
  }

  initOrganization(organizationId: string): void {
    seedSchedulesForOrg(this.store, organizationId, this.store.nextId);
    const hasRefundPolicy = this.store.policies.some(
      (p) => p.organizationId === organizationId && p.policyKey === "refund_approval_threshold_inr"
    );
    if (!hasRefundPolicy) {
      this.store.policies.push({
        organizationId,
        policyKey: "refund_approval_threshold_inr",
        policyValue: { amount: 5000 },
        version: 1,
      });
    }
  }

  emit(input: EmitEventInput): RuntimeEventRecord {
    const loop = checkEventLoop(this.store, {
      organizationId: input.organizationId,
      eventType: input.eventType,
      aggregateId: input.aggregateId,
    });
    if (!loop.allowed) {
      throw new Error(loop.reason);
    }
    return emitEvent(this.store, input);
  }

  handleOrderPaid(input: {
    organizationId: string;
    orderId: string;
    lines: Record<string, unknown>[];
    actorId?: string;
    correlationId?: string;
  }): { correlationId: string; event: RuntimeEventRecord; executionId?: string } {
    this.initOrganization(input.organizationId);
    const correlationId = input.correlationId ?? newCorrelationId("order");
    const idempotencyKey = `order.paid:${input.orderId}`;

    const existingEvent = this.store.events.find(
      (e) => e.organizationId === input.organizationId && e.idempotencyKey === idempotencyKey
    );
    if (existingEvent) {
      const existingExecution = this.store.executions.find(
        (e) =>
          e.organizationId === input.organizationId &&
          e.triggerEventId === existingEvent.id
      );
      return {
        correlationId: existingEvent.correlationId ?? correlationId,
        event: existingEvent,
        executionId: existingExecution?.id,
      };
    }

    const event = this.emit({
      organizationId: input.organizationId,
      eventType: "order.paid.v1",
      aggregateType: "order",
      aggregateId: input.orderId,
      payload: { orderId: input.orderId, lines: input.lines },
      correlationId,
      actorType: "system",
      actorId: input.actorId,
      idempotencyKey,
      source: "checkout",
    });

    const workflow = findWorkflowByTrigger("order.paid.v1");
    let executionId: string | undefined;
    if (workflow) {
      const execution = this.startWorkflowForEvent({
        organizationId: input.organizationId,
        workflow,
        event,
        payload: { orderId: input.orderId, lines: input.lines, templateKey: "order_confirmation", channel: "email", recipient: "customer@demo.local" },
      });
      executionId = execution.id;
      this.trackExecution(execution);
      this.enqueueTracked({
        organizationId: input.organizationId,
        processorKey: "workflow_runner",
        idempotencyKey: `workflow:${execution.id}`,
        payload: { executionId: execution.id },
        maxAttempts: 3,
        correlationId,
      });
    }

    return { correlationId, event, executionId };
  }

  startWorkflowForEvent(input: {
    organizationId: string;
    workflow: WorkflowDefinition;
    event: RuntimeEventRecord;
    payload: Record<string, unknown>;
  }) {
    const engineOpts = this.workflowOptions();
    const execution = triggerWorkflowsForEvent(engineOpts, {
      organizationId: input.organizationId,
      eventType: input.event.eventType,
      eventId: input.event.id,
      correlationId: input.event.correlationId ?? newCorrelationId("wfc"),
      causationId: input.event.id,
      payload: input.payload,
      workflow: input.workflow,
    });
    return this.trackExecution(execution);
  }

  private workflowOptions(): WorkflowEngineOptions {
    return {
      store: this.store,
      approvalRiskThreshold: "HIGH",
      onApprovalRequired: ({ execution, stepRun, actionKey }) => {
        createApprovalRequest(this.store, {
          organizationId: execution.organizationId,
          executionId: execution.id,
          stepRunId: stepRun.id,
          actionKey,
          payloadHash: `${execution.correlationId}:${actionKey}`,
          riskLevel: getAction(actionKey)?.riskLevel ?? "HIGH",
          reason: `Workflow step requires approval: ${actionKey}`,
        });
      },
    };
  }

  async processQueue(actionCtx?: ActionContext): Promise<{
    jobs: { processed: number; failed: number; deadLetter: number };
    outbox: { sent: number; failed: number };
    workflows: number;
  }> {
    this.processors.set("workflow_runner", {
      key: "workflow_runner",
      handle: async (ctx, payload) => {
        const executionId = String(payload.executionId ?? "");
        const ctxFull: ActionContext = {
          organizationId: ctx.organizationId,
          ...actionCtx,
        };
        const result = await runWorkflowExecution(this.workflowOptions(), executionId, ctxFull);
        if (!result) return { ok: false, error: "Execution not found" };
        this.trackExecution(result);
        if (result.status === "failed" || result.status === "dead_letter") {
          return { ok: false, error: result.errorMessage ?? "Workflow failed" };
        }
        if (result.status === "waiting") return { ok: true };
        if (result.status === "completed") return { ok: true };
        return { ok: true, retryable: true };
      },
    });

    tickScheduler(this.store, (orgId, processorKey) => {
      this.enqueueTracked({
        organizationId: orgId,
        processorKey,
        idempotencyKey: `schedule:${processorKey}:${Date.now()}`,
        payload: {},
        maxAttempts: 3,
      });
    });

    const jobs = await processJobQueue(this.store, this.processors, new Date(), {
      onJobUpdated: (job) => {
        void this.persistenceHooks?.onJobUpdated?.(job);
      },
    });
    const outbox = await processOutbox(this.store, {
      email: emailAdapter,
      whatsapp: whatsappAdapter,
    });

    let workflows = 0;
    for (const exec of this.store.executions.filter((e) => e.status === "queued")) {
      const result = await runWorkflowExecution(this.workflowOptions(), exec.id, {
        organizationId: exec.organizationId,
        ...actionCtx,
      });
      if (result) this.trackExecution(result);
      workflows++;
    }

    return { jobs, outbox, workflows };
  }

  listEvents(organizationId: string) {
    return listEvents(this.store, organizationId).map(maskEventPayload);
  }

  getDashboard(organizationId: string) {
    return {
      executions: getExecutionCounts(this.store, organizationId),
      jobs: {
        queued: this.store.jobs.filter((j) => j.organizationId === organizationId && j.status === "queued").length,
        deadLetter: this.store.deadLetters.filter((d) => d.organizationId === organizationId).length,
      },
      approvals: listPendingApprovals(this.store, organizationId).length,
      outboxPending: listOutbox(this.store, organizationId).filter((m) => m.status === "pending").length,
    };
  }

  listExecutions(organizationId: string) {
    return listExecutions(this.store, organizationId);
  }

  getExecution(executionId: string) {
    return this.store.executions.find((e) => e.id === executionId) ?? null;
  }

  getJobs(organizationId: string) {
    return this.store.jobs.filter((j) => j.organizationId === organizationId);
  }

  getDeadLetters(organizationId: string) {
    return this.store.deadLetters.filter((d) => d.organizationId === organizationId);
  }

  approve(approvalId: string, resolvedBy: string) {
    const record = resolveApproval(this.store, approvalId, "approved", resolvedBy);
    if (record?.executionId && record.stepRunId) {
      const execution = this.store.executions.find((e) => e.id === record.executionId);
      const step = execution?.stepRuns.find((s) => s.id === record.stepRunId);
      if (step) {
        approveWorkflowStep(this.store, record.executionId, step.stepKey);
        this.enqueueTracked({
          organizationId: record.organizationId,
          processorKey: "workflow_runner",
          idempotencyKey: `workflow:resume:${record.executionId}:${Date.now()}`,
          payload: { executionId: record.executionId },
          maxAttempts: 3,
          correlationId: execution?.correlationId,
        });
      }
    }
    return record;
  }

  reject(approvalId: string, resolvedBy: string) {
    return resolveApproval(this.store, approvalId, "rejected", resolvedBy);
  }

  listApprovals(organizationId: string) {
    return listPendingApprovals(this.store, organizationId);
  }

  enqueueNotification(input: Parameters<typeof enqueueNotification>[1]) {
    return enqueueNotification(this.store, input);
  }
}

export function createRuntimeService(options: RuntimeServiceOptions = {}): RuntimeService {
  return new RuntimeService(options);
}
