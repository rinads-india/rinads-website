import { getAction, type ActionRiskLevel } from "./registry";
import type { ActionContext } from "./registry";

export type { ActionContext };

export type ActionValidationResult =
  | { allowed: true }
  | { allowed: false; reason: string; errorClass: string };

export function validateActionExecution(
  ctx: ActionContext,
  actionKey: string,
  options?: { skipPermission?: boolean }
): ActionValidationResult {
  const action = getAction(actionKey);
  if (!action) {
    return { allowed: false, reason: `Unregistered action: ${actionKey}`, errorClass: "validation_error" };
  }

  if (!options?.skipPermission && action.requiredPermission) {
    if (!ctx.permissions?.includes(action.requiredPermission)) {
      return {
        allowed: false,
        reason: `Missing permission: ${action.requiredPermission}`,
        errorClass: "authorization_error",
      };
    }
  }

  if (!ctx.organizationId) {
    return { allowed: false, reason: "Tenant context required", errorClass: "tenant_error" };
  }

  return { allowed: true };
}

export function requiresApproval(riskLevel: ActionRiskLevel, policyThreshold?: ActionRiskLevel): boolean {
  const order: ActionRiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const riskIdx = order.indexOf(riskLevel);
  const thresholdIdx = order.indexOf(policyThreshold ?? "HIGH");
  return riskIdx >= thresholdIdx;
}

export async function executeAction(
  ctx: ActionContext,
  actionKey: string,
  input: Record<string, unknown>
): Promise<{ ok: true; data?: Record<string, unknown> } | { ok: false; error: string; errorClass?: string }> {
  const validation = validateActionExecution(ctx, actionKey);
  if (!validation.allowed) {
    return { ok: false, error: validation.reason, errorClass: validation.errorClass };
  }

  const action = getAction(actionKey)!;
  return action.handler(ctx, input);
}
