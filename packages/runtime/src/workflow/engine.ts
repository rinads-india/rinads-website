import { executeAction, requiresApproval, type ActionContext } from "../actions/executor";
import { getAction } from "../actions/registry";
import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStepRun,
} from "./types";
import { newCorrelationId } from "../events/types";

export type WorkflowStore = {
  executions: WorkflowExecution[];
  nextId: (prefix: string) => string;
};

export type WorkflowEngineOptions = {
  store: WorkflowStore;
  onApprovalRequired?: (input: {
    execution: WorkflowExecution;
    stepRun: WorkflowStepRun;
    actionKey: string;
    payload: Record<string, unknown>;
  }) => void;
  approvalRiskThreshold?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export function startWorkflow(
  options: WorkflowEngineOptions,
  input: {
    organizationId: string;
    workflow: WorkflowDefinition;
    correlationId: string;
    causationId?: string;
    triggerEventId?: string;
    payload: Record<string, unknown>;
  }
): WorkflowExecution {
  const execution: WorkflowExecution = {
    id: options.store.nextId("wfx"),
    organizationId: input.organizationId,
    workflowKey: input.workflow.key,
    status: "queued",
    correlationId: input.correlationId,
    causationId: input.causationId,
    triggerEventId: input.triggerEventId,
    inputPayload: input.payload,
    stepRuns: input.workflow.steps.map((s) => ({
      id: options.store.nextId("wfs"),
      stepKey: s.stepKey,
      actionKey: s.actionKey,
      status: "pending",
      attemptCount: 0,
    })),
    iterationCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  options.store.executions.push(execution);
  return execution;
}

export async function runWorkflowExecution(
  options: WorkflowEngineOptions,
  executionId: string,
  actionCtx: ActionContext
): Promise<WorkflowExecution | null> {
  const execution = options.store.executions.find((e) => e.id === executionId);
  if (!execution) return null;

  execution.status = "running";
  execution.updatedAt = new Date().toISOString();
  execution.iterationCount++;

  for (const stepRun of execution.stepRuns) {
    if (stepRun.status === "completed" || stepRun.status === "skipped") continue;

    const action = getAction(stepRun.actionKey);
    const needsApproval =
      requiresApproval(action?.riskLevel ?? "MEDIUM", options.approvalRiskThreshold ?? "HIGH") &&
      !stepRun.approvedAt;

    if (needsApproval && stepRun.status !== "waiting_approval") {
      stepRun.status = "waiting_approval";
      execution.status = "waiting";
      options.onApprovalRequired?.({
        execution,
        stepRun,
        actionKey: stepRun.actionKey,
        payload: execution.inputPayload,
      });
      execution.updatedAt = new Date().toISOString();
      return execution;
    }

    if (stepRun.status === "waiting_approval") {
      execution.status = "waiting";
      return execution;
    }

    stepRun.status = "running";
    stepRun.attemptCount++;
    const result = await executeAction(actionCtx, stepRun.actionKey, {
      ...execution.inputPayload,
      correlationId: execution.correlationId,
      idempotencyKey: `${execution.correlationId}:${stepRun.stepKey}`,
    });

    if (!result.ok) {
      stepRun.status = "failed";
      stepRun.errorMessage = result.error;
      execution.status = "failed";
      execution.errorMessage = result.error;
      execution.updatedAt = new Date().toISOString();
      return execution;
    }

    stepRun.status = "completed";
    stepRun.outputPayload = result.data;
  }

  execution.status = "completed";
  execution.updatedAt = new Date().toISOString();
  return execution;
}

export function approveWorkflowStep(
  store: WorkflowStore,
  executionId: string,
  stepKey: string
): boolean {
  const execution = store.executions.find((e) => e.id === executionId);
  if (!execution) return false;
  const step = execution.stepRuns.find((s) => s.stepKey === stepKey);
  if (!step || step.status !== "waiting_approval") return false;
  step.status = "pending";
  step.approvedAt = new Date().toISOString();
  execution.status = "queued";
  return true;
}

export function listExecutions(store: WorkflowStore, organizationId: string): WorkflowExecution[] {
  return store.executions.filter((e) => e.organizationId === organizationId);
}

export function getExecutionCounts(store: WorkflowStore, organizationId: string) {
  const items = listExecutions(store, organizationId);
  return {
    queued: items.filter((e) => e.status === "queued").length,
    running: items.filter((e) => e.status === "running").length,
    waiting: items.filter((e) => e.status === "waiting").length,
    failed: items.filter((e) => e.status === "failed" || e.status === "dead_letter").length,
    completed: items.filter((e) => e.status === "completed").length,
  };
}

export function triggerWorkflowsForEvent(
  options: WorkflowEngineOptions,
  input: {
    organizationId: string;
    eventType: string;
    eventId: string;
    correlationId: string;
    causationId?: string;
    payload: Record<string, unknown>;
    workflow: WorkflowDefinition;
  }
): WorkflowExecution {
  return startWorkflow(options, {
    organizationId: input.organizationId,
    workflow: input.workflow,
    correlationId: input.correlationId || newCorrelationId("wfc"),
    causationId: input.causationId ?? input.eventId,
    triggerEventId: input.eventId,
    payload: input.payload,
  });
}
