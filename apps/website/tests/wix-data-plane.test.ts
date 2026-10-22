import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  extractWixProviderEntityId,
  normalizeWixBusinessEvent,
  type WixInboundEvent,
} from "../../../supabase/functions/_shared/wix-event-normalizer";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const migration = readFileSync(
  resolve(repoRoot, "supabase/migrations/20261022153000_wix_connector_core.sql"),
  "utf8",
);
const sink = readFileSync(
  resolve(repoRoot, "supabase/functions/wix-event-sink/index.ts"),
  "utf8",
);

function wixEvent(eventType: string, data: unknown = {}): WixInboundEvent {
  return {
    provider: "wix",
    eventId: "evt-1",
    eventType,
    instanceId: "instance-1",
    data,
    receivedAt: "2026-10-22T00:00:00.000Z",
  };
}

describe("Wix data plane", () => {
  it("normalizes the first commerce, contacts and bookings events", () => {
    assert.deepEqual(
      normalizeWixBusinessEvent(
        wixEvent("wix.ecom.v1.order_created", { createdEvent: { entityId: "order-1" } }),
        "connection-1",
      ),
      { eventType: "order.created.v1", entityType: "order", entityId: "order-1" },
    );

    assert.deepEqual(
      normalizeWixBusinessEvent(
        wixEvent("wix.contacts.v4.contact_created", { entity: { _id: "contact-1" } }),
        "connection-1",
      ),
      { eventType: "contact.created.v1", entityType: "contact", entityId: "contact-1" },
    );

    assert.deepEqual(
      normalizeWixBusinessEvent(
        wixEvent("wix.bookings.v2.booking_created", { entityId: "booking-1" }),
        "connection-1",
      ),
      { eventType: "booking.created.v1", entityType: "booking", entityId: "booking-1" },
    );
  });

  it("falls back to the integration connection for unknown provider events", () => {
    assert.deepEqual(
      normalizeWixBusinessEvent(wixEvent("wix.some.future_event"), "connection-1"),
      {
        eventType: "integration.event_received.v1",
        entityType: "integration_connection",
        entityId: "connection-1",
      },
    );
  });

  it("extracts provider entity IDs from supported Wix event shapes", () => {
    assert.equal(extractWixProviderEntityId({ entityId: "a" }), "a");
    assert.equal(extractWixProviderEntityId({ entity: { _id: "b" } }), "b");
    assert.equal(extractWixProviderEntityId({ createdEvent: { entityId: "c" } }), "c");
  });

  it("enforces idempotency, quarantine and tenant-admin visibility at the schema boundary", () => {
    assert.match(migration, /unique \(provider, event_id\)/i);
    assert.match(migration, /status in \('quarantined', 'accepted', 'ignored', 'failed'\)/i);
    assert.match(migration, /private\.has_permission\(organization_id, 'org\.manage'\)/i);
    assert.match(migration, /bind_integration_connection/i);
    assert.match(migration, /insert into public\.business_events/i);
    assert.match(migration, /insert into public\.audit_logs/i);
  });

  it("fails closed at the internal sink boundary", () => {
    assert.match(sink, /RINADS_WIX_EVENT_SINK_SECRET/);
    assert.match(sink, /x-rinads-integration-secret/);
    assert.match(sink, /x-rinads-event-id/);
    assert.match(sink, /status: "quarantined"/);
    assert.match(sink, /idempotency_key: `wix:\$\{event\.eventId\}`/);
  });
});
