# Dead Letter Queue

Visibility, forensic history, and controlled replay for permanently failed runtime work.

## `runtime_dead_letters` table

| Column | Purpose |
|--------|---------|
| `source_type` | `job`, `workflow`, or `outbox` |
| `source_id` | Failed entity identity |
| `error_class` | Failure classification |
| `error_message` | Human-readable reason |
| `payload` | Snapshot for forensics |
| `organization_id` | Tenant scope |
| `status` | `open`, `replayed`, or `discarded` |
| `replay_count` | Number of authorized replay resolutions recorded for this DLQ item |
| `replayed_at` | Replay timestamp |
| `replayed_by` | Authorized actor identity |
| `resolution_note` | Operator/founder explanation |
| `updated_at` | Last lifecycle update |

Job DLQ records are created when:

- Job `attempts >= max_attempts`
- Processor returns a non-retryable failure
- Processor key is not registered
- Uncaught processor exception occurs on the final attempt

`processJobQueue()` now creates a DLQ record for every terminal job path instead of only changing the job status.

## Job dead-letter path

```text
runtime_jobs.status → dead_letter
runtime_dead_letters ← { source_type: 'job', source_id: job.id, status: 'open', ... }
```

Workflow executions can also reach `dead_letter` status in schema; workflow/outbox replay remains outside the v1 replay scope.

## Controlled replay

Replay is intentionally conservative:

1. only `source_type = 'job'` is replayable in v1;
2. the DLQ item must be `open`;
3. the source job must still belong to the same tenant and remain `dead_letter`;
4. replay resets the **original job** to `queued` instead of cloning it;
5. the original `idempotency_key` is preserved;
6. attempts reset to `0`, `last_error` is cleared, and `run_after` becomes current time;
7. the DLQ record remains as forensic history and is marked `replayed` with actor, timestamp, count, and optional resolution note;
8. a resolved DLQ record cannot be replayed twice.

### RuntimeService

```typescript
runtime.getDeadLetters(organizationId);
runtime.getDashboard(organizationId).jobs.deadLetter; // open count

runtime.replayDeadLetter(
  {
    organizationId,
    userId,
    roleKey,
    permissions: ["org.manage"],
  },
  deadLetterId,
  "Root cause fixed"
);
```

`RuntimeService.replayDeadLetter` requires `org.manage` or a system-scope `founder`/`super_admin` role and emits `runtime.dead_letter.replayed.v1` into the runtime event/audit stream.

### Supabase persistence

Migration:

`supabase/migrations/20261011110000_runtime_dlq_replay.sql`

The database function:

```text
replay_runtime_dead_letter(...)
```

is `SECURITY DEFINER`, revoked from `PUBLIC`, `anon`, and `authenticated`, and executable only by `service_role`.

**Important:** service-role access is not user authorization. The server application must resolve the authenticated actor, tenant, and policy before invoking the RPC.

Server adapter:

```typescript
replayRuntimeDeadLetterInSupabase(client, {
  organizationId,
  deadLetterId,
  replayedBy,
  resolutionNote,
});
```

## Owner portal

`/runtime` shows recent DLQ records including:

- source type
- failure reason
- source identity
- lifecycle status
- replay count
- a guarded **Replay job** action for open job DLQs

The current owner control-plane path uses the server-side RuntimeService authorization gate. Production Supabase replay must use the same authenticated policy decision before the service-role RPC adapter is called.

## Verification rule

Replay only restores work to `queued`; it does not declare the business operation successful.

The normal runtime path still applies:

```text
REPLAY
  ↓
QUEUE
  ↓
PROCESS
  ↓
ACTION
  ↓
POSTCONDITION VERIFY
  ↓
AUDIT
```

Registered runtime actions can now define a postcondition verifier. A handler returning `ok: true` does **not** count as business success when its verifier fails.

## RLS

`runtime_dead_letters_member_select` lets authenticated organization members read rows from their own tenant. Mutating replay is intentionally not exposed through authenticated RLS updates.

## Operational response

1. Inspect the failure and payload.
2. Fix the root cause.
3. Confirm the job remains safe to replay.
4. Replay through the authorized runtime control plane.
5. Let the normal worker process the queued job.
6. Verify the resulting business state and action/audit history.

## Related

- [RETRY-ENGINE.md](./RETRY-ENGINE.md) — automatic retries before DLQ
- [RUNTIME-SECURITY.md](./RUNTIME-SECURITY.md) — release/security boundaries
- [RUNTIME-FORENSICS.md](./RUNTIME-FORENSICS.md) — forensic history
- [rinpo/RINPO-P1-RUNTIME-IMPLEMENTATION-PLAN.md](./rinpo/RINPO-P1-RUNTIME-IMPLEMENTATION-PLAN.md) — current hardening plan
