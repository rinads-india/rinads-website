# Notification Outbox

Reliable async delivery for customer and operational notifications.

## notification_outbox table

| Column | Purpose |
|--------|---------|
| `channel` | `email`, `whatsapp`, `sms`, `push` |
| `template_key` | Template identifier (e.g. `order_confirmation`) |
| `recipient` | Address or phone |
| `payload` | Template variables (JSONB) |
| `idempotency_key` | Dedup per org |
| `status` | `pending`, `processing`, `sent`, `failed` |
| `attempts` / `last_error` | Delivery tracking |
| `correlation_id` | Trace to checkout/workflow |

Unique: `(organization_id, idempotency_key)`.

## Enqueue

`RuntimeService.enqueueNotification()` / action `notification.enqueue`:

```typescript
enqueueNotification(store, {
  organizationId,
  channel: "email",
  templateKey: "order_confirmation",
  recipient: "customer@demo.local",
  payload: { orderId, lines, ... },
  idempotencyKey: `notify:${orderId}`,
  correlationId,
});
```

Called from `order-fulfilment-v1` workflow step `notify_customer`.

## Processing

`processOutbox()` in `packages/runtime/src/outbox/processor.ts`:

1. Batch pending/failed messages (limit 50)
2. Mark `processing`, increment `attempts`
3. Route to channel adapter
4. Set `sent` or `failed`

Runs inside `RuntimeService.processQueue()`.

## Adapter stubs

| Adapter | File | Behavior |
|---------|------|----------|
| `emailAdapter` | `adapters/email.ts` | Returns `{ ok: true }` (no SMTP) |
| `whatsappAdapter` | `adapters/whatsapp.ts` | Returns `{ ok: true }` (no API) |

Additional adapter types defined (`shipping`, `payment`) but not used by outbox.

Production integration (Resend, Twilio, etc.) is **deferred**.

## Supabase sync

`syncRuntimeArtifactsToSupabase()` upserts outbox rows when worker runs with `USE_SUPABASE=1`.

## Owner portal

`/runtime` dashboard shows `outboxPending` count. No per-message drill-down yet.

## Event catalog

Future emit: `notification.enqueued.v1` — type defined but not emitted on enqueue today.

## Related

- [WORKFLOW-ENGINE.md](./WORKFLOW-ENGINE.md) — notification step in order fulfilment
- [RETRY-ENGINE.md](./RETRY-ENGINE.md) — outbox retry behavior
