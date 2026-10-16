import {
  LedgerConflictError,
  type Actor,
  type AuditEntry,
  type AuditPort,
  type BusinessEventInsert,
  type EventPort,
  type LedgerPort,
  type LedgerRecord,
  type LedgerStatus,
  type NewLedgerRecord,
} from "@rinads/company-os";
import { isUniqueViolation, type Row, type RowDb } from "./db";

/**
 * Ports for the governed-action pipeline, implemented over EXISTING tables:
 *   ledger → rinpo_actions     (extended in migration …120100; the one approval ledger)
 *   audit  → audit_logs
 *   events → business_events
 * All writes happen through the caller's RLS session; the database enforces who may do what.
 */

const COMPANY_OS = "company-os";

function fromRow(row: Row): LedgerRecord {
  const stored = String(row.status) as Exclude<LedgerStatus, "expired">;
  const errorClass = (row.error_class as string | null) ?? null;
  // "expired" is represented as rejected + error_class "expired" (the DB status check has no expired value).
  const status: LedgerStatus = stored === "rejected" && errorClass === "expired" ? "expired" : stored;
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    actionKey: String(row.action_type),
    status,
    input: (row.input as Record<string, unknown>) ?? {},
    output: (row.output as Record<string, unknown> | null) ?? null,
    risk: (row.risk_level as LedgerRecord["risk"]) ?? "LOW",
    payloadHash: String(row.payload_hash ?? ""),
    idempotencyKey: String(row.idempotency_key ?? ""),
    requestedByKind: (row.actor_kind as LedgerRecord["requestedByKind"]) ?? "user",
    requestedByUserId: (row.user_id as string | null) ?? null,
    agentRole: (row.agent_role as string | null) ?? null,
    provider: (row.provider as string | null) ?? null,
    model: (row.model as string | null) ?? null,
    requiresApproval: row.requires_approval === true,
    distinctApprover: row.distinct_approver === true,
    approverPermission: String(row.approver_permission ?? ""),
    approvedBy: (row.approved_by as string | null) ?? null,
    resolvedAt: row.resolved_at ? new Date(String(row.resolved_at)).toISOString() : null,
    reason: (row.reason as string | null) ?? null,
    expiresAt: row.expires_at ? new Date(String(row.expires_at)).toISOString() : null,
    errorClass,
    verification: (row.verification as LedgerRecord["verification"]) ?? null,
    correlationId: (row.correlation_id as string | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function patchToRow(patch: Partial<LedgerRecord>): Row {
  const row: Row = {};
  if (patch.status !== undefined) {
    row.status = patch.status === "expired" ? "rejected" : patch.status;
    if (patch.status === "expired") row.error_class = "expired";
    if (patch.status === "executed") row.executed_at = new Date().toISOString();
  }
  if (patch.output !== undefined) row.output = patch.output;
  if (patch.approvedBy !== undefined) row.approved_by = patch.approvedBy;
  if (patch.resolvedAt !== undefined) row.resolved_at = patch.resolvedAt;
  if (patch.reason !== undefined) row.reason = patch.reason;
  if (patch.errorClass !== undefined && patch.status !== "expired") row.error_class = patch.errorClass;
  if (patch.verification !== undefined) row.verification = patch.verification;
  return row;
}

export function createLedgerPort(db: RowDb): LedgerPort {
  return {
    async findByIdempotencyKey(organizationId, key) {
      const { data, error } = await db.select("rinpo_actions", {
        where: { organization_id: organizationId, idempotency_key: key, source_domain: COMPANY_OS },
        limit: 1,
      });
      if (error) throw new Error(error.message);
      return data[0] ? fromRow(data[0]) : null;
    },
    async get(organizationId, id) {
      const { data, error } = await db.select("rinpo_actions", {
        where: { organization_id: organizationId, id, source_domain: COMPANY_OS },
        limit: 1,
      });
      if (error) throw new Error(error.message);
      return data[0] ? fromRow(data[0]) : null;
    },
    async insertPending(rec: NewLedgerRecord) {
      const { data, error } = await db.insert("rinpo_actions", {
        organization_id: rec.organizationId,
        user_id: rec.requestedByUserId,
        action_type: rec.actionKey,
        input: rec.input,
        status: "pending",
        source_domain: COMPANY_OS,
        idempotency_key: rec.idempotencyKey,
        risk_level: rec.risk,
        payload_hash: rec.payloadHash,
        requires_approval: rec.requiresApproval,
        distinct_approver: rec.distinctApprover,
        approver_permission: rec.approverPermission || null,
        expires_at: rec.expiresAt,
        actor_kind: rec.requestedByKind,
        agent_role: rec.agentRole,
        provider: rec.provider,
        model: rec.model,
        correlation_id: rec.correlationId,
        reason: rec.reason,
      });
      if (isUniqueViolation(error)) throw new LedgerConflictError();
      if (error) throw new Error(error.message);
      if (!data[0]) throw new Error("Ledger insert returned no row");
      return fromRow(data[0]);
    },
    async update(organizationId, id, patch) {
      const { data, error } = await db.update("rinpo_actions", patchToRow(patch), { id, organization_id: organizationId });
      if (error) throw new Error(error.message);
      if (!data[0]) throw new Error("Ledger update affected no row (not permitted or not found)");
      return fromRow(data[0]);
    },
  };
}

function auditActor(actor: Actor): { actor_type: "user" | "system"; actor_id: string } {
  switch (actor.kind) {
    case "user":
      return { actor_type: "user", actor_id: actor.userId };
    case "agent":
      // audit_logs only accepts user|system from a member session; agents are recorded as
      // `agent:<role>:<human it acted for>` (the RLS guard verifies the trailing user id).
      return { actor_type: "system", actor_id: `agent:${actor.agentRole}:${actor.onBehalfOfUserId}` };
    case "system":
      return { actor_type: "system", actor_id: actor.system };
  }
}

export function createAuditPort(db: RowDb): AuditPort {
  return {
    async record(entry: AuditEntry) {
      const who = auditActor(entry.actor);
      const { error } = await db.insert("audit_logs", {
        organization_id: entry.organizationId,
        ...who,
        approved_by: entry.approvedBy,
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entityId,
        before: entry.before ?? null,
        after: entry.after ?? null,
        source: COMPANY_OS,
      });
      if (error) throw new Error(error.message);
    },
  };
}

export function createEventPort(db: RowDb): EventPort {
  return {
    async emit(event: BusinessEventInsert) {
      const { error } = await db.insert("business_events", event as unknown as Row);
      // Re-emitting the same idempotent event is fine.
      if (error && !isUniqueViolation(error)) throw new Error(error.message);
    },
  };
}
