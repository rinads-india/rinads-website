# RINADS Runtime Events

Package: `@rinads/runtime`

## Event catalog

`order.paid`, `inventory.reserved`, `inventory.low`, `inventory.expired`, `purchase.received`, `fulfilment.created`, `shipment.created`, `return.created`, `refund.created`

## Processors

- `reservation_expiry` — idempotent expiry + alert
- `low_stock_scan` — deterministic alerts
- `fulfilment_on_paid` — creates fulfilment from order lines

## Job runner

Supports retry, dead-letter, manual retry via `JobRunner.retry(jobId)`.

No n8n/Zapier for business-critical flows.
