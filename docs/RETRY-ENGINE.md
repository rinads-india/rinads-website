# Retry Engine

Exponential backoff and attempt limits for durable runtime jobs.

## runtime_jobs schema

| Column | Default | Purpose |
|--------|---------|---------|
| `status` | `queued` | `queued`, `running`, `completed`, `failed`, `dead_letter` |
| `attempts` | 0 | Incremented each run |
| `max_attempts` | 3 | Hard stop |
| `last_error` | — | Last failure message |
| `run_after` | now | Backoff scheduling |
| `idempotency_key` | required | Dedup per org |

Unique: `(organization_id, idempotency_key)`.

Poll index: `(status, run_after)` where status in `queued`, `failed`.

## Backoff formula

`packages/runtime/src/queue/durable-queue.ts`:

```typescript
computeBackoffMs(attempt, baseMs = 1000, capMs = 60000)
// min(60000, 1000 * 2^attempt)
```

After failure with retries remaining:

- Status → `failed`
- `run_after` → now + backoff
- Re-eligible when `run_after <= now`

## processJobQueue logic

1. Select jobs where `status ∈ {queued, failed}` and `run_after <= now`
2. If `attempts >= max_attempts` → `dead_letter` + DLQ record
3. Run processor; on success → `completed`
4. On failure:
   - `retryable: false` or max attempts → `dead_letter`
   - else → `failed` + backoff
5. Missing processor → immediate `dead_letter`

## workflow_runner retry

Workflow job handler returns `{ ok: true, retryable: true }` when execution still in progress (not terminal). Allows re-poll for queued/running states.

Typical enqueue:

```typescript
enqueueJob(store, {
  processorKey: "workflow_runner",
  idempotencyKey: `workflow:${executionId}`,
  maxAttempts: 3,
  correlationId,
});
```

## Outbox retries

Notification outbox uses separate `attempts` counter in `processOutbox()` — no exponential backoff yet; failed messages stay `failed` for next batch.

## Tests

`packages/runtime/tests/chaos.test.ts` — duplicate `handleOrderPaid` produces single workflow job (idempotency).
