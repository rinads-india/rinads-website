import type { Actor } from "./types";

/**
 * Canonical Company OS event vocabulary (all `…v1`).
 * Normal activity is aggregated; only exceptions reach the founder Attention queue.
 */
export const COMPANY_OS_EVENT_TYPES = [
  "lead.created.v1",
  "lead.qualified.v1",
  "lead.converted.v1",
  "opportunity.created.v1",
  "opportunity.stage_changed.v1",
  "proposal.sent.v1",
  "contract.signed.v1",
  "project.created.v1",
  "milestone.delayed.v1",
  "task.created.v1",
  "task.assigned.v1",
  "task.completed.v1",
  "deliverable.submitted.v1",
  "deliverable.approved.v1",
  "creative.submitted.v1",
  "creative.approved.v1",
  "content.published.v1",
  "invoice.issued.v1",
  "invoice.overdue.v1",
  "payment.received.v1",
  "deployment.failed.v1",
  "shipment.delayed.v1",
  "approval.requested.v1",
  "approval.completed.v1",
  "ai.action.executed.v1",
  "ai.action.failed.v1",
] as const;

export type CompanyOsEventType = (typeof COMPANY_OS_EVENT_TYPES)[number];

/** Row shape accepted by `business_events` (extended by runtime_2). */
export type BusinessEventInsert = {
  organization_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  idempotency_key: string | null;
  source: "company-os";
  correlation_id: string | null;
  causation_id: string | null;
  actor_type: "user" | "ai" | "system";
  actor_id: string | null;
};

export type BuildEventInput = {
  organizationId: string;
  type: CompanyOsEventType;
  aggregateType: string;
  aggregateId: string;
  payload?: Record<string, unknown>;
  actor: Actor;
  correlationId?: string | null;
  causationId?: string | null;
  idempotencyKey?: string | null;
};

export function actorIdentity(actor: Actor): { type: "user" | "ai" | "system"; id: string } {
  switch (actor.kind) {
    case "user":
      return { type: "user", id: actor.userId };
    case "agent":
      return { type: "ai", id: actor.agentRole };
    case "system":
      return { type: "system", id: actor.system };
  }
}

export function buildBusinessEvent(input: BuildEventInput): BusinessEventInsert {
  const who = actorIdentity(input.actor);
  return {
    organization_id: input.organizationId,
    event_type: input.type,
    entity_type: input.aggregateType,
    entity_id: input.aggregateId,
    aggregate_type: input.aggregateType,
    aggregate_id: input.aggregateId,
    payload: input.payload ?? {},
    metadata: {
      onBehalfOf: input.actor.kind === "agent" ? input.actor.onBehalfOfUserId : undefined,
      provider: input.actor.kind === "agent" ? input.actor.provider : undefined,
      model: input.actor.kind === "agent" ? input.actor.model : undefined,
    },
    idempotency_key: input.idempotencyKey ?? null,
    source: "company-os",
    correlation_id: input.correlationId ?? null,
    causation_id: input.causationId ?? null,
    actor_type: who.type,
    actor_id: who.id,
  };
}
