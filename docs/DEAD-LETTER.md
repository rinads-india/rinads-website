# Dead Letter Queue

Visibility and handling for permanently failed runtime work.

## runtime_dead_letters table

| Column | Purpose |
|--------|---------|
| `source_type` | `job`, `workflow`, or `outbox` |
| `source_id` | UUID of failed entity |
| `error_class` | Optional classification |
| `error_message` | Human-readable reason |
| `payload` | Snapshot for forensics |
| `organization_id` | Tenant scope |

Created when:

- Job `attempts >= max_attempts`
- Processor returns non-retryable failure
- Processor key not registered
- Uncaught exception on final attempt

Implementation: `processJobQueue()` pushes to in-memory `store.deadLetters`; DB table ready for sync.

## Job dead-letter path

```
runtime_jobs.status → dead_letter
runtime_dead_letters ← { source_type: 'job', source_id: job.id, ... }
```

Workflow executions can also reach `dead_letter` status in schema; engine currently sets `failed` on step errors (DLQ row for workflow source **deferred**).

## Visibility

### RuntimeService

```typescript
runtime.getDeadLetters(organizationId);
runtime.getDashboard(organizationId).jobs.deadLetter; // count
```

### Owner portal

`/runtime` dashboard shows recent dead letters (source type + error message). No manual retry UI yet.

## Operational response

1. Inspect payload in dashboard or Supabase row
2. Fix root cause (missing handler, bad input, permissions)
3. Re-trigger flow manually (e.g. re-run checkout test or enqueue job) — **no built-in replay API**

## RLS

`runtime_dead_letters_member_select` — authenticated org members read own tenant rows.

## Related

- [RETRY-ENGINE.md](./RETRY-ENGINE.md) — retry before DLQ
- [RUNTIME-FORENSICS.md](./RUNTIME-FORENSICS.md) — pre-2.0 had no DLQ table
