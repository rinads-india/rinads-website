export type WorkflowExecutionStatus =
  | "queued"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "dead_letter";

export type WorkflowStepRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "waiting_approval";

export type WorkflowStepDefinition = {
  stepKey: string;
  actionKey: string;
  requiresApproval?: boolean;
  condition?: Record<string, unknown>;
};

export type WorkflowDefinition = {
  key: string;
  name: string;
  triggerEventType?: string;
  steps: WorkflowStepDefinition[];
  maxIterations?: number;
};

export type WorkflowExecution = {
  id: string;
  organizationId: string;
  workflowKey: string;
  status: WorkflowExecutionStatus;
  correlationId: string;
  causationId?: string;
  triggerEventId?: string;
  inputPayload: Record<string, unknown>;
  stepRuns: WorkflowStepRun[];
  iterationCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowStepRun = {
  id: string;
  stepKey: string;
  actionKey: string;
  status: WorkflowStepRunStatus;
  attemptCount: number;
  outputPayload?: Record<string, unknown>;
  errorMessage?: string;
  approvedAt?: string;
};

export const BUILTIN_WORKFLOWS: WorkflowDefinition[] = [
  {
    key: "order-fulfilment-v1",
    name: "Order fulfilment on paid",
    triggerEventType: "order.paid.v1",
    maxIterations: 10,
    steps: [
      { stepKey: "create_fulfilment", actionKey: "fulfilment.create_from_order" },
      { stepKey: "notify_customer", actionKey: "notification.enqueue" },
    ],
  },
  {
    key: "low-stock-task-v1",
    name: "Low stock task",
    triggerEventType: "inventory.low_stock.v1",
    steps: [{ stepKey: "create_task", actionKey: "task.create" }],
  },
];

export function findWorkflowByTrigger(eventType: string): WorkflowDefinition | undefined {
  return BUILTIN_WORKFLOWS.find((w) => w.triggerEventType === eventType);
}
