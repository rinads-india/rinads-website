import type { EmitEventInput, RuntimeEventRecord } from "./types";
import { assertSupportedEventVersion } from "./types";

export type EventEmitterStore = {
  events: RuntimeEventRecord[];
  nextId: (prefix: string) => string;
};

export function emitEvent(store: EventEmitterStore, input: EmitEventInput): RuntimeEventRecord {
  assertSupportedEventVersion(input.eventType);

  if (input.idempotencyKey) {
    const dup = store.events.find(
      (e) => e.organizationId === input.organizationId && e.idempotencyKey === input.idempotencyKey
    );
    if (dup) return dup;
  }

  const event: RuntimeEventRecord = {
    id: store.nextId("evt"),
    organizationId: input.organizationId,
    eventType: input.eventType,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: input.payload,
    metadata: input.metadata ?? {},
    source: input.source ?? "system",
    correlationId: input.correlationId,
    causationId: input.causationId,
    actorType: input.actorType,
    actorId: input.actorId,
    schemaVersion: `v${input.eventType.match(/\.v(\d+)$/)?.[1] ?? "1"}`,
    idempotencyKey: input.idempotencyKey,
    createdAt: new Date().toISOString(),
  };

  store.events.push(event);
  return event;
}

export function listEvents(
  store: EventEmitterStore,
  organizationId: string,
  filters?: { eventType?: string; correlationId?: string }
): RuntimeEventRecord[] {
  return store.events
    .filter(
      (e) =>
        e.organizationId === organizationId &&
        (!filters?.eventType || e.eventType === filters.eventType) &&
        (!filters?.correlationId || e.correlationId === filters.correlationId)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function maskEventPayload(event: RuntimeEventRecord): RuntimeEventRecord {
  const masked = { ...event, payload: { ...event.payload } };
  for (const key of ["email", "phone", "paymentReference", "providerRef"]) {
    if (key in masked.payload) masked.payload[key] = "[redacted]";
  }
  return masked;
}
