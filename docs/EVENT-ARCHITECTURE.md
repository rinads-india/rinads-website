# Event Architecture

Canonical business events for Runtime 2.0.

## Versioned event types

Events use `{domain}.{action}.v{major}` naming. Supported major version is **v1** (`assertSupportedEventVersion` rejects higher majors).

Defined in `packages/runtime/src/events/types.ts`:

| Event | Typical aggregate |
|-------|-------------------|
| `order.created.v1` | order |
| `order.paid.v1` | order |
| `payment.confirmed.v1` | payment |
| `payment.failed.v1` | payment |
| `inventory.reserved.v1` | variant |
| `inventory.low_stock.v1` | variant |
| `inventory.expired.v1` | reservation |
| `fulfilment.created.v1` | fulfilment |
| `shipment.created.v1` | shipment |
| `notification.enqueued.v1` | notification |

## Correlation and causation

- **correlation_id** — ties a business transaction (e.g. one checkout). Generated via `newCorrelationId("order")` or passed through from checkout.
- **causation_id** — links a downstream event or workflow to its immediate cause (often the triggering event id).

Workflow executions inherit both from the trigger event. The loop guard (`loop-guard.ts`) blocks duplicate emits within a 5s dedupe window and enforces max causation depth (20).

## Idempotency

In-memory: duplicate `(organizationId, idempotencyKey)` returns the existing record without re-emitting.

Live path example:

```
idempotencyKey: order.paid:{orderId}
```

DB: `business_events` has `UNIQUE (organization_id, idempotency_key)`.

## business_events columns

Base schema (`20260815100001_operations_erp.sql`) plus Runtime 2.0 extension (`20260818100000_runtime_2.sql`):

| Column | Purpose |
|--------|---------|
| `event_type` | Versioned type string |
| `entity_type` / `entity_id` | Legacy (runtime prefers aggregate_type/id in memory) |
| `payload` | Event body (JSONB) |
| `metadata` | Non-domain metadata (JSONB) |
| `source` | Emitter (`checkout`, `system`, …) |
| `correlation_id` / `causation_id` | Trace chain |
| `actor_type` / `actor_id` | Who caused the event |
| `schema_version` | Parsed from event type (default `v1`) |
| `idempotency_key` | Dedup key |
| `processed_at` | Reserved; **not set** by runtime yet |
| `created_at` | Append timestamp |

## Emit API

```typescript
runtime.emit({
  organizationId,
  eventType: "order.paid.v1",
  aggregateType: "order",
  aggregateId: orderId,
  payload: { orderId, lines },
  correlationId,
  idempotencyKey: `order.paid:${orderId}`,
  source: "checkout",
});
```

## Payload masking

`listEvents()` applies `maskEventPayload()` — redacts `email`, `phone`, `paymentReference`, `providerRef` in owner-portal event explorer.

## Supabase sync

Events bridge into legacy `OperationsRepository.businessEvents`. Full Supabase column sync is partial — see completion report.
