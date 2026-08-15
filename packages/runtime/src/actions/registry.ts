export type ActionRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ActionCategory = "READ" | "DRAFT" | "ACTION";

export type ActionDefinition = {
  key: string;
  description: string;
  requiredPermission?: string;
  riskLevel: ActionRiskLevel;
  idempotencyRequired: boolean;
  moduleKey?: string;
};

export type ActionContext = {
  organizationId: string;
  userId?: string;
  roleKey?: string;
  permissions?: string[];
  correlationId?: string;
};

export type ActionHandler = (
  ctx: ActionContext,
  input: Record<string, unknown>
) => Promise<{ ok: true; data?: Record<string, unknown> } | { ok: false; error: string; errorClass?: string }>;

export type RegisteredAction = ActionDefinition & {
  handler: ActionHandler;
};

const registry = new Map<string, RegisteredAction>();

export function registerAction(action: RegisteredAction): void {
  registry.set(action.key, action);
}

export function getAction(key: string): RegisteredAction | undefined {
  return registry.get(key);
}

export function listActions(): ActionDefinition[] {
  return [...registry.values()].map(({ handler: _h, ...def }) => def);
}

export function clearActionRegistry(): void {
  registry.clear();
}

export function seedDefaultActionDefinitions(): ActionDefinition[] {
  return [
    { key: "fulfilment.create_from_order", description: "Create fulfilment from paid order", riskLevel: "MEDIUM", idempotencyRequired: true, moduleKey: "fulfilment" },
    { key: "notification.enqueue", description: "Enqueue customer notification", riskLevel: "LOW", idempotencyRequired: true, moduleKey: "commerce" },
    { key: "task.create", description: "Create operational task", riskLevel: "LOW", idempotencyRequired: true, moduleKey: "tasks" },
    { key: "order.update_status", description: "Update order status via state machine", riskLevel: "MEDIUM", idempotencyRequired: true, moduleKey: "commerce" },
    { key: "analytics.record", description: "Record analytics event", riskLevel: "LOW", idempotencyRequired: false, moduleKey: "commerce" },
    { key: "refund.process", description: "Process refund", requiredPermission: "org.manage", riskLevel: "CRITICAL", idempotencyRequired: true, moduleKey: "commerce" },
  ];
}
