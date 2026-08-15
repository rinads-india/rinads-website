# Runtime Security

Tenant isolation, RLS, and append-only event guarantees for Runtime 2.0.

## Row Level Security

Migration `20260818100000_runtime_2.sql` enables RLS on:

- `workflows`, `workflow_versions`, `workflow_triggers`, `workflow_steps`
- `workflow_executions`, `workflow_step_runs`
- `runtime_jobs`, `runtime_dead_letters`
- `runtime_approvals` (SELECT + UPDATE for members)
- `notification_outbox`, `tenant_policies`
- `workflow_schedules`, `rinpo_memory_facts`
- `business_events` (member SELECT policy added)

Policies use `private.is_org_member(organization_id)` — same pattern as ERP/commerce tables.

Verified by `packages/runtime/tests/rls.test.ts` (migration SQL assertions).

## Tenancy derivation

All runtime operations require `organizationId`:

- `RuntimeService.emit()`, `handleOrderPaid()`, `processQueue()` — explicit org
- `ActionContext.organizationId` — validated in `validateActionExecution()`
- Worker: `RUNTIME_ORG_ID` env var
- Owner portal: `opsContext().organizationId` from session

No cross-tenant job polling or event listing.

## Append-only events

Design intent: `business_events` is canonical and immutable.

- Migration comment: append-only canonical events
- No UPDATE/DELETE policies for authenticated users on `business_events`
- In-memory emit deduplicates via idempotency key; never mutates existing rows

**Gap:** `processed_at` column exists but is never written. No DB trigger enforcing INSERT-only yet.

## Sensitive data

- `maskEventPayload()` redacts PII in owner event explorer
- Approval records store `payload_hash`, not full payload
- Service role used only in worker sync (`SUPABASE_SERVICE_ROLE_KEY`)

## Authorization layers

| Layer | Mechanism |
|-------|-----------|
| RLS | Supabase org membership |
| Action permissions | `requiredPermission` in registry |
| Workflow approval | Risk level vs threshold |
| RINPO | Tool category + hard limits |

## Service role boundaries

`syncRuntimeArtifactsToSupabase()` bypasses RLS with service role — scoped to single `organizationId` per worker invocation. Do not expose service key to client apps.

## Related

- [RUNTIME-FORENSICS.md](./RUNTIME-FORENSICS.md) — pre-2.0 security gaps
- [ERP-SECURITY.md](./ERP-SECURITY.md) — operations RLS baseline
