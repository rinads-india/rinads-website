export type WixInboundEvent = {
  provider: "wix";
  eventId: string;
  eventType: string;
  instanceId: string;
  data: unknown;
  identity?: unknown;
  receivedAt: string;
};

export type CanonicalWixEvent = {
  eventType: string;
  entityType: string;
  entityId: string;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.length > 0);
}

export function extractWixProviderEntityId(data: unknown): string | undefined {
  const record = asRecord(data);
  if (!record) return undefined;
  const createdEvent = asRecord(record.createdEvent);
  const entity = asRecord(record.entity);
  const createdEntity = asRecord(createdEvent?.entity);

  return firstString(
    record.entityId,
    record.id,
    entity?._id,
    entity?.id,
    createdEvent?.entityId,
    createdEvent?.id,
    createdEntity?._id,
    createdEntity?.id,
  );
}

/**
 * Provider-specific names stop here. Downstream RINADS systems subscribe only
 * to canonical, versioned business event names.
 */
export function normalizeWixBusinessEvent(
  event: WixInboundEvent,
  connectionId: string,
): CanonicalWixEvent {
  const providerEntityId = extractWixProviderEntityId(event.data) ?? connectionId;

  switch (event.eventType) {
    case "AppInstalled":
      return {
        eventType: "integration.connected.v1",
        entityType: "integration_connection",
        entityId: connectionId,
      };
    case "AppRemoved":
      return {
        eventType: "integration.disconnected.v1",
        entityType: "integration_connection",
        entityId: connectionId,
      };
    case "wix.ecom.v1.order_created":
      return { eventType: "order.created.v1", entityType: "order", entityId: providerEntityId };
    case "wix.contacts.v4.contact_created":
      return { eventType: "contact.created.v1", entityType: "contact", entityId: providerEntityId };
    case "wix.bookings.v2.booking_created":
      return { eventType: "booking.created.v1", entityType: "booking", entityId: providerEntityId };
    default:
      return {
        eventType: "integration.event_received.v1",
        entityType: "integration_connection",
        entityId: connectionId,
      };
  }
}
