import {
  canDecide,
  DEFAULT_ACTION_POLICY,
  evaluateAction,
  getActionSpec,
  type TenantActionPolicy,
} from "./actions";
import { buildBusinessEvent, type BusinessEventInsert } from "./events";
import { payloadHash } from "./hash";
import type { Actor, OrgContext, RiskLevel } from "./types";

/**
 * Governed action pipeline (the only way Company OS state changes):
 *
 *   Request → Context → Permission → Risk → Approval → Domain tool → Execution
 *     → Postcondition verification → Audit / Event → Result
 *
 * All IO is injected through ports so the pipeline is unit-testable and so production wiring can
 * use the *caller's* RLS-bound Supabase session — never a service-role client, never a model.
 */

export type LedgerStatus = "pending" | "approved" | "executed" | "failed" | "rejected" | "expired";

export type LedgerRecord = {
  id: string;
  organizationId: string;
  actionKey: string;
  status: LedgerStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  risk: RiskLevel;
  payloadHash: string;
  idempotencyKey: string;
  requestedByKind: Actor["kind"];
  requestedByUserId: string | null;
  agentRole: string | null;
  provider: string | null;
  model: string | null;
  requiresApproval: boolean;
  distinctApprover: boolean;
  approverPermission: string;
  approvedBy: string | null;
  resolvedAt: string | null;
  reason: string | null;
  expiresAt: string | null;
  errorClass: string | null;
  verification: { ok: boolean; checkedAt: string; detail?: string } | null;
  correlationId: string | null;
  createdAt: string;
};

export type NewLedgerRecord = Omit<LedgerRecord, "id" | "createdAt" | "output" | "approvedBy" | "resolvedAt" | "errorClass" | "verification" | "status"> & {
  status: "pending";
};

export class LedgerConflictError extends Error {
  constructor(message = "Ledger idempotency conflict") {
    super(message);
    this.name = "LedgerConflictError";
  }
}

export interface LedgerPort {
  findByIdempotencyKey(organizationId: string, key: string): Promise<LedgerRecord | null>;
  get(organizationId: string, id: string): Promise<LedgerRecord | null>;
  /** Must throw LedgerConflictError when (organization, idempotencyKey) already exists. */
  insertPending(record: NewLedgerRecord): Promise<LedgerRecord>;
  update(organizationId: string, id: string, patch: Partial<LedgerRecord>): Promise<LedgerRecord>;
}

export type AuditEntry = {
  organizationId: string;
  actor: Actor;
  approvedBy: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  before?: unknown;
  after?: unknown;
  correlationId: string | null;
};

export interface AuditPort {
  record(entry: AuditEntry): Promise<void>;
}

export interface EventPort {
  emit(event: BusinessEventInsert): Promise<void>;
}

export type ToolContext = {
  organizationId: string;
  /** The human whose RLS session performs the write (requester, or approver for approved actions). */
  executorUserId: string;
  roleKey: string | null;
  permissions: readonly string[];
  actionId: string;
  correlationId: string | null;
  requestedBy: Actor;
  approvedBy: string | null;
};

export type ToolSuccess = { ok: true; output: Record<string, unknown> };
export type ToolFailure = { ok: false; error: string; errorClass?: string };

export type DomainTool = {
  key: string;
  execute(ctx: ToolContext, input: Record<string, unknown>): Promise<ToolSuccess | ToolFailure>;
  /** Postcondition: re-read business state and confirm it. A tool's own success message is not trusted. */
  verify(ctx: ToolContext, input: Record<string, unknown>, output: Record<string, unknown>): Promise<{ ok: true; detail?: string } | { ok: false; error: string }>;
  /** Domain events to emit after verified success. */
  events?(ctx: ToolContext, input: Record<string, unknown>, output: Record<string, unknown>): BusinessEventInsert[];
};

export type GovernedDeps = {
  ledger: LedgerPort;
  audit: AuditPort;
  events: EventPort;
  tools: Readonly<Record<string, DomainTool>>;
  policy?: TenantActionPolicy;
  now?: () => Date;
};

export type GovernedRequest = {
  actionKey: string;
  input: Record<string, unknown>;
  actor: Actor;
  ctx: OrgContext;
  idempotencyKey: string;
  correlationId?: string | null;
};

export type GovernedResult =
  | { status: "executed"; actionId: string; output: Record<string, unknown>; replayed: boolean }
  | { status: "approval_required"; actionId: string; risk: RiskLevel; approverPermission: string; expiresAt: string | null; replayed: boolean }
  | { status: "denied"; reasons: string[]; errorClass: string }
  | { status: "failed"; actionId: string | null; error: string; errorClass: string; /** The write may have happened; do not blindly retry. */ uncertain: boolean }
  | { status: "rejected"; actionId: string };

function nowOf(deps: GovernedDeps): Date {
  return deps.now ? deps.now() : new Date();
}

function actorUserId(actor: Actor): string | null {
  if (actor.kind === "user") return actor.userId;
  if (actor.kind === "agent") return actor.onBehalfOfUserId;
  return null;
}

async function safeAudit(deps: GovernedDeps, entry: AuditEntry): Promise<void> {
  try {
    await deps.audit.record(entry);
  } catch {
    // Audit failure must never mask the action result, but is surfaced through the ledger status.
  }
}

async function safeEmit(deps: GovernedDeps, event: BusinessEventInsert): Promise<void> {
  try {
    await deps.events.emit(event);
  } catch {
    // Events are best-effort projections; the ledger + audit_logs remain the record of truth.
  }
}

async function runTool(
  deps: GovernedDeps,
  record: LedgerRecord,
  executor: OrgContext,
  actor: Actor,
  approvedBy: string | null
): Promise<GovernedResult> {
  const tool = deps.tools[record.actionKey];
  const toolCtx: ToolContext = {
    organizationId: record.organizationId,
    executorUserId: executor.userId,
    roleKey: executor.roleKey,
    permissions: executor.permissions,
    actionId: record.id,
    correlationId: record.correlationId,
    requestedBy: actor,
    approvedBy,
  };
  const failedAt = nowOf(deps).toISOString();

  const fail = async (error: string, errorClass: string, uncertain: boolean, output: Record<string, unknown> | null = null): Promise<GovernedResult> => {
    await deps.ledger.update(record.organizationId, record.id, {
      status: "failed",
      errorClass,
      reason: error,
      output,
      resolvedAt: failedAt,
      verification: uncertain ? { ok: false, checkedAt: failedAt, detail: error } : null,
    });
    await safeAudit(deps, {
      organizationId: record.organizationId,
      actor,
      approvedBy,
      action: "company-os.action.failed",
      entity: record.actionKey,
      entityId: record.id,
      after: { error, errorClass },
      correlationId: record.correlationId,
    });
    if (actor.kind === "agent") {
      await safeEmit(
        deps,
        buildBusinessEvent({
          organizationId: record.organizationId,
          type: "ai.action.failed.v1",
          aggregateType: "company_os_action",
          aggregateId: record.id,
          payload: { actionKey: record.actionKey, errorClass },
          actor,
          correlationId: record.correlationId,
          idempotencyKey: `ai.action.failed:${record.id}`,
        })
      );
    }
    return { status: "failed", actionId: record.id, error, errorClass, uncertain };
  };

  if (!tool) return fail(`No domain tool registered for ${record.actionKey}`, "tool_missing", false);

  let result;
  try {
    result = await tool.execute(toolCtx, record.input);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Tool threw", "execution_error", true);
  }
  if (!result.ok) return fail(result.error, result.errorClass ?? "execution_error", false);

  // Postcondition verification — success is only real once business state confirms it.
  let verification;
  try {
    verification = await tool.verify(toolCtx, record.input, result.output);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Verification threw", "verification_error", true, result.output);
  }
  if (!verification.ok) return fail(verification.error, "verification_error", true, result.output);

  const doneAt = nowOf(deps).toISOString();
  await deps.ledger.update(record.organizationId, record.id, {
    status: "executed",
    output: result.output,
    resolvedAt: doneAt,
    errorClass: null,
    verification: { ok: true, checkedAt: doneAt, detail: verification.detail },
  });
  await safeAudit(deps, {
    organizationId: record.organizationId,
    actor,
    approvedBy,
    action: "company-os.action.executed",
    entity: record.actionKey,
    entityId: record.id,
    after: result.output,
    correlationId: record.correlationId,
  });
  const events = tool.events?.(toolCtx, record.input, result.output) ?? [];
  for (const event of events) await safeEmit(deps, event);
  if (actor.kind === "agent") {
    await safeEmit(
      deps,
      buildBusinessEvent({
        organizationId: record.organizationId,
        type: "ai.action.executed.v1",
        aggregateType: "company_os_action",
        aggregateId: record.id,
        payload: { actionKey: record.actionKey, approvedBy },
        actor,
        correlationId: record.correlationId,
        idempotencyKey: `ai.action.executed:${record.id}`,
      })
    );
  }
  return { status: "executed", actionId: record.id, output: result.output, replayed: false };
}

export async function runGovernedAction(deps: GovernedDeps, request: GovernedRequest): Promise<GovernedResult> {
  const policy = deps.policy ?? DEFAULT_ACTION_POLICY;
  const { ctx, actor } = request;

  // 1. Idempotency — a retry with the same key never re-executes.
  const existing = await deps.ledger.findByIdempotencyKey(ctx.organizationId, request.idempotencyKey);
  if (existing) return replay(existing);

  // 2. Context + 3. Permission + 4. Risk + 5. Approval policy
  const decision = evaluateAction({ actionKey: request.actionKey, payload: request.input, actor, ctx, policy });
  if (decision.decision === "DENY") {
    await safeAudit(deps, {
      organizationId: ctx.organizationId,
      actor,
      approvedBy: null,
      action: "company-os.action.denied",
      entity: request.actionKey,
      entityId: null,
      after: { reasons: decision.reasons, errorClass: decision.errorClass },
      correlationId: request.correlationId ?? null,
    });
    return { status: "denied", reasons: decision.reasons, errorClass: decision.errorClass };
  }

  const spec = getActionSpec(request.actionKey)!;
  const created = nowOf(deps);
  const requiresApproval = decision.decision === "APPROVAL_REQUIRED";
  const expiresAt = requiresApproval ? new Date(created.getTime() + decision.ttlHours * 3_600_000).toISOString() : null;

  let record: LedgerRecord;
  try {
    record = await deps.ledger.insertPending({
      organizationId: ctx.organizationId,
      actionKey: request.actionKey,
      status: "pending",
      input: request.input,
      risk: decision.risk,
      payloadHash: payloadHash(request.actionKey, request.input),
      idempotencyKey: request.idempotencyKey,
      requestedByKind: actor.kind,
      requestedByUserId: actorUserId(actor),
      agentRole: actor.kind === "agent" ? actor.agentRole : null,
      provider: actor.kind === "agent" ? (actor.provider ?? null) : null,
      model: actor.kind === "agent" ? (actor.model ?? null) : null,
      requiresApproval,
      distinctApprover: requiresApproval ? decision.distinctApprover : false,
      approverPermission: requiresApproval ? decision.approverPermission : "",
      reason: decision.reasons.join(" "),
      expiresAt,
      correlationId: request.correlationId ?? null,
    });
  } catch (e) {
    if (e instanceof LedgerConflictError) {
      const raced = await deps.ledger.findByIdempotencyKey(ctx.organizationId, request.idempotencyKey);
      if (raced) return replay(raced);
    }
    return { status: "failed", actionId: null, error: e instanceof Error ? e.message : "Ledger write failed", errorClass: "ledger_error", uncertain: false };
  }

  if (requiresApproval) {
    await safeAudit(deps, {
      organizationId: ctx.organizationId,
      actor,
      approvedBy: null,
      action: "company-os.approval.requested",
      entity: request.actionKey,
      entityId: record.id,
      after: { risk: decision.risk, spec: spec.label },
      correlationId: record.correlationId,
    });
    await safeEmit(
      deps,
      buildBusinessEvent({
        organizationId: ctx.organizationId,
        type: "approval.requested.v1",
        aggregateType: "company_os_action",
        aggregateId: record.id,
        payload: { actionKey: request.actionKey, risk: decision.risk },
        actor,
        correlationId: record.correlationId,
        idempotencyKey: `approval.requested:${record.id}`,
      })
    );
    return {
      status: "approval_required",
      actionId: record.id,
      risk: decision.risk,
      approverPermission: decision.approverPermission,
      expiresAt,
      replayed: false,
    };
  }

  return runTool(deps, record, ctx, actor, null);
}

function replay(existing: LedgerRecord): GovernedResult {
  switch (existing.status) {
    case "executed":
      return { status: "executed", actionId: existing.id, output: existing.output ?? {}, replayed: true };
    case "pending":
    case "approved":
      return { status: "approval_required", actionId: existing.id, risk: existing.risk, approverPermission: existing.approverPermission, expiresAt: existing.expiresAt, replayed: true };
    case "rejected":
    case "expired":
      return { status: "rejected", actionId: existing.id };
    case "failed":
      return {
        status: "failed",
        actionId: existing.id,
        error: existing.reason ?? "Previous attempt failed",
        errorClass: existing.errorClass ?? "execution_error",
        // A failed attempt may have partially written; a fresh idempotency key is required to try again.
        uncertain: existing.verification?.ok === false,
      };
  }
}

export type DecisionRequest = {
  actionId: string;
  decision: "approve" | "reject";
  approver: OrgContext;
  reason?: string | null;
};

export async function decideGovernedAction(deps: GovernedDeps, request: DecisionRequest): Promise<GovernedResult> {
  const { approver } = request;
  const record = await deps.ledger.get(approver.organizationId, request.actionId);
  if (!record) return { status: "denied", reasons: ["Action not found in this organisation."], errorClass: "not_found" };
  if (record.status !== "pending") {
    return { status: "denied", reasons: [`Action is ${record.status}, not pending.`], errorClass: "invalid_state" };
  }
  if (!record.requiresApproval) {
    return { status: "denied", reasons: ["This action does not require approval."], errorClass: "invalid_state" };
  }

  const now = nowOf(deps);
  if (record.expiresAt && new Date(record.expiresAt).getTime() < now.getTime()) {
    await deps.ledger.update(record.organizationId, record.id, { status: "expired", resolvedAt: now.toISOString() });
    return { status: "denied", reasons: ["The approval request has expired; request it again."], errorClass: "expired" };
  }

  if (payloadHash(record.actionKey, record.input) !== record.payloadHash) {
    await safeAudit(deps, {
      organizationId: record.organizationId,
      actor: { kind: "user", userId: approver.userId },
      approvedBy: null,
      action: "company-os.approval.tamper_detected",
      entity: record.actionKey,
      entityId: record.id,
      correlationId: record.correlationId,
    });
    return { status: "denied", reasons: ["Stored payload no longer matches its approval hash."], errorClass: "payload_tampered" };
  }

  const check = canDecide({
    approver,
    requesterUserId: record.requestedByUserId,
    requesterKind: record.requestedByKind,
    onBehalfOfUserId: record.requestedByKind === "agent" ? record.requestedByUserId : null,
    risk: record.risk,
    approverPermission: record.approverPermission || "approvals.decide",
    distinctApprover: record.distinctApprover,
  });
  if (!check.ok) return { status: "denied", reasons: [check.reason], errorClass: "authorization_error" };

  const approverActor: Actor = { kind: "user", userId: approver.userId };

  if (request.decision === "reject") {
    await deps.ledger.update(record.organizationId, record.id, {
      status: "rejected",
      approvedBy: null,
      resolvedAt: now.toISOString(),
      reason: request.reason ?? "Rejected",
    });
    await safeAudit(deps, {
      organizationId: record.organizationId,
      actor: approverActor,
      approvedBy: null,
      action: "company-os.approval.rejected",
      entity: record.actionKey,
      entityId: record.id,
      after: { reason: request.reason ?? null },
      correlationId: record.correlationId,
    });
    await safeEmit(
      deps,
      buildBusinessEvent({
        organizationId: record.organizationId,
        type: "approval.completed.v1",
        aggregateType: "company_os_action",
        aggregateId: record.id,
        payload: { actionKey: record.actionKey, decision: "rejected" },
        actor: approverActor,
        correlationId: record.correlationId,
        idempotencyKey: `approval.completed:${record.id}`,
      })
    );
    return { status: "rejected", actionId: record.id };
  }

  const approved = await deps.ledger.update(record.organizationId, record.id, {
    status: "approved",
    approvedBy: approver.userId,
    resolvedAt: now.toISOString(),
  });
  await safeAudit(deps, {
    organizationId: record.organizationId,
    actor: approverActor,
    approvedBy: approver.userId,
    action: "company-os.approval.approved",
    entity: record.actionKey,
    entityId: record.id,
    correlationId: record.correlationId,
  });
  await safeEmit(
    deps,
    buildBusinessEvent({
      organizationId: record.organizationId,
      type: "approval.completed.v1",
      aggregateType: "company_os_action",
      aggregateId: record.id,
      payload: { actionKey: record.actionKey, decision: "approved" },
      actor: approverActor,
      correlationId: record.correlationId,
      idempotencyKey: `approval.completed:${record.id}`,
    })
  );

  const requestedBy: Actor =
    record.requestedByKind === "agent"
      ? { kind: "agent", agentRole: record.agentRole ?? "unknown", onBehalfOfUserId: record.requestedByUserId ?? approver.userId, provider: record.provider ?? undefined, model: record.model ?? undefined }
      : record.requestedByKind === "system"
        ? { kind: "system", system: "company-os" }
        : { kind: "user", userId: record.requestedByUserId ?? approver.userId };

  return runTool(deps, approved, approver, requestedBy, approver.userId);
}
