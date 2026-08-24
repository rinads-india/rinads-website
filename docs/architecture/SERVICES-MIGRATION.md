# RINADS Services — Migration from legacy Watermelon / n8n

Behavioral specification: [`docs/archive/watermelon-n8n-workflow.reference.json`](../archive/watermelon-n8n-workflow.reference.json) (archived n8n export).

**Do not run n8n in production.** Port behavior to Supabase Edge Functions + PostgreSQL.

## Tenant boundary

| Legacy (uploads) | Monorepo (canonical) |
|------------------|----------------------|
| `client_id` | `organization_id` |
| `intern_profiles` | `service_partners` |
| `pods` | `service_pods` |
| `orders` | `service_orders` |
| `tasks` | `service_tasks` |
| `intern_earnings` | `service_earnings` |

See [ADR-005](../decisions/ADR-005-multi-tenancy.md).

## n8n workflow → Supabase runtime

```text
Razorpay payment.captured webhook
  ↓
Edge Function: payment-webhook
  ├── verify signature
  ├── idempotency check (payment_webhook_events)
  ├── mark service_orders.status = paid
  └── call assign_service_order(order_id)
        ↓
      service_tasks row created
        ↓
Edge Function: notify-whatsapp (or notification_outbox worker)
  ├── client confirmation
  └── ops alert
        ↓
DB trigger / Edge Function: invoice-generate (link to finance invoices)
        ↓
notifications + whatsapp_log audit rows
        ↓
Cron: renewal-alert, health-check (morning-digest)
```

## Assignment engine boundary

`watermelon-ai-engine.jsx` → **`assign_service_order()`** (Services domain).

RINPO may **recommend** services or **analyze** outcomes — it does not route delivery tasks.

Ranking inputs (configurable, not hard-coded):

- skill match
- current workload vs `max_tasks`
- exclude `trainee` level
- average_rating
- completion reliability

## Public tracker

Route: `/track/[order_id]` — expose order number, service, stage, progress only. No private customer PII.

Order number format: `RINADS-SVC-0042` (configurable sequence).

## Security

- Service role key: Edge Functions only
- Webhook: signature + event idempotency
- RLS on all `service_*` tables scoped by `organization_id` (client tenant)
- Partner access: assigned `service_tasks` only

## Related

- [RINADS-50-FILE-REFACTOR-MAP.md](../RINADS-50-FILE-REFACTOR-MAP.md)
- [RINADS-CURSOR-MASTER-PROMPT.md](../RINADS-CURSOR-MASTER-PROMPT.md)
- Migration: `supabase/migrations/20260824100000_rinads_services_foundation.sql`
