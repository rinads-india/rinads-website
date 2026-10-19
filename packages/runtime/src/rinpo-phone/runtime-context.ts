import type { RinpoRuntimeContext } from "./types";

export interface RuntimeContextValidationResult {
  ok: boolean;
  errors: string[];
}

function nonEmpty(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateRinpoRuntimeContext(
  context: RinpoRuntimeContext
): RuntimeContextValidationResult {
  const errors: string[] = [];

  if (!nonEmpty(context.requestId)) errors.push("requestId is required");
  if (!nonEmpty(context.actor.userId)) errors.push("actor.userId is required");
  if (!nonEmpty(context.actor.rinpoId)) errors.push("actor.rinpoId is required");
  if (!nonEmpty(context.workspace.workspaceId)) errors.push("workspace.workspaceId is required");
  if (!nonEmpty(context.device.deviceId)) errors.push("device.deviceId is required");
  if (!nonEmpty(context.experience.appId)) errors.push("experience.appId is required");
  if (!nonEmpty(context.experience.sessionId)) errors.push("experience.sessionId is required");

  if (context.workspace.workspaceType === "personal" && context.workspace.tenantId !== null) {
    errors.push("personal workspaces must not carry tenantId");
  }

  if (
    (context.workspace.workspaceType === "organisation" || context.workspace.workspaceType === "client") &&
    !nonEmpty(context.workspace.tenantId)
  ) {
    errors.push("organisation/client workspaces require tenantId");
  }

  if (context.workspace.workspaceType === "world" && context.runtime.memoryScopes.includes("tenant:*")) {
    errors.push("world context cannot request unrestricted tenant memory");
  }

  return { ok: errors.length === 0, errors };
}

export function assertRinpoRuntimeContext(context: RinpoRuntimeContext): RinpoRuntimeContext {
  const result = validateRinpoRuntimeContext(context);
  if (!result.ok) {
    throw new Error(`Invalid RINPO runtime context: ${result.errors.join("; ")}`);
  }
  return context;
}
