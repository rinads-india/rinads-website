export type VersionedEventType =
  | "order.created.v1"
  | "order.paid.v1"
  | "payment.confirmed.v1"
  | "payment.failed.v1"
  | "inventory.reserved.v1"
  | "inventory.low_stock.v1"
  | "inventory.expired.v1"
  | "fulfilment.created.v1"
  | "shipment.created.v1"
  | "notification.enqueued.v1";

export type RuntimeEventRecord = {
  id: string;
  organizationId: string;
  eventType: string;
  aggregateType?: string;
  aggregateId?: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  source: string;
  correlationId?: string;
  causationId?: string;
  actorType?: string;
  actorId?: string;
  schemaVersion: string;
  idempotencyKey?: string;
  processedAt?: string;
  createdAt: string;
};

export type EmitEventInput = {
  organizationId: string;
  eventType: VersionedEventType | string;
  aggregateType?: string;
  aggregateId?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  source?: string;
  correlationId?: string;
  causationId?: string;
  actorType?: string;
  actorId?: string;
  idempotencyKey?: string;
};

export function parseEventMajorVersion(eventType: string): number {
  const match = eventType.match(/\.v(\d+)$/);
  return match ? Number(match[1]) : 1;
}

export function assertSupportedEventVersion(eventType: string, supportedMajor = 1): void {
  const major = parseEventMajorVersion(eventType);
  if (major > supportedMajor) {
    throw new Error(`Unsupported event schema major version for ${eventType}`);
  }
}

export function newCorrelationId(prefix = "corr"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
