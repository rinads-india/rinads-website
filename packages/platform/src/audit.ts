import type { PlatformAuditEntry } from "./types";

export function buildAuditInsert(entry: PlatformAuditEntry) {
  return {
    organization_id: entry.organizationId,
    actor_type: entry.actorType,
    actor_id: entry.actorId ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    after: entry.after ?? null,
    source: entry.source ?? "platform",
  };
}
