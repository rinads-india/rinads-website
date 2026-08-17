# Phase 12 Runtime 2.0 — Completion Report (Step 119)

**Branch:** `cursor/phase-12-runtime-2-4e75`  
**Scope:** Runtime 2.0 orchestration (events, workflows, jobs, approvals, outbox, RINPO registry, owner UI)  
**Baseline:** [RUNTIME-FORENSICS.md](./RUNTIME-FORENSICS.md)

## CI status

| Check | Result |
|-------|--------|
| `pnpm test` (turbo, 37 tasks) | **PASS** |
| `@rinads/runtime` (13 tests) | **PASS** |
| `@rinads/operations-server` integration (order.paid workflow) | **PASS** |
| `@rinads/intelligence` (RINPO tools) | **PASS** |
| RLS migration assertions | **PASS** |

## Step 119 status matrix

| # | Plan item | Status | Notes |
|---|-----------|--------|-------|
| 1 | Extend `business_events` (correlation, causation, aggregate, schema_version) | **DONE** | Migration `20260818100000_runtime_2.sql` |
| 2 | Runtime tables (workflows, executions, jobs, approvals, outbox, policies, DLQ) | **DONE** | Full schema + indexes |
| 3 | RLS on runtime + business_events member SELECT | **DONE** | `rls.test.ts` |
| 4 | `RuntimeService` façade | **DONE** | `runtime-service.ts` |
| 5 | Action registry + validation pipeline | **DONE** | Risk levels, permissions |
| 6 | Workflow engine + step runs | **DONE** | In-memory engine; tests green |
| 7 | Builtin `order-fulfilment-v1` on `order.paid.v1` | **DONE** | Replaces inline fulfilment job |
| 8 | Durable queue + exponential backoff | **DONE** | `durable-queue.ts`, max_attempts=3 |
| 9 | Dead-letter visibility | **PARTIAL** | In-memory + dashboard; no replay API |
| 10 | Approval engine + owner UI | **DONE** | `/approvals`, workflow resume |
| 11 | `tenant_policies` refund threshold | **PARTIAL** | Seeded; `refund.process` not wired |
| 12 | Scheduler (`reservation_expiry`, `low_stock_scan`) | **PARTIAL** | Simplified tick; cron parsing deferred |
| 13 | `pnpm runtime:worker` | **DONE** | `scripts/cron/runtime-worker.ts` |
| 14 | Notification outbox + adapters | **PARTIAL** | Table + processor; email/WhatsApp stubs |
| 15 | Supabase artifact sync | **DONE** | Phase 13: load, claim, hooks, full sync |
| 16 | DB-driven workflow definitions | **DEFERRED** | Code uses `BUILTIN_WORKFLOWS` |
| 17 | Hydrate runtime store from Supabase on boot | **DONE** | Phase 13 `loadRuntimeStoreFromSupabase` + worker |
| 18 | Set `business_events.processed_at` | **DEFERRED** | Column unused |
| 19 | Append-only DB enforcement (triggers) | **DEFERRED** | Policy comment only |
| 20 | RINPO tool registry READ/DRAFT/ACTION | **DONE** | `@rinads/intelligence` |
| 21 | RINPO hard limits / no customer direct execution | **DONE** | `RINPO_HARD_LIMITS` |
| 22 | Owner-portal runtime observability | **DONE** | `/runtime`, events, executions |
| 23 | Event loop guard | **DONE** | Dedupe window + depth limit |
| 24 | Legacy `EventStore`/`JobRunner` removal | **DEFERRED** | Still exported |
| 25 | Supabase Edge Functions for worker | **DEFERRED** | Cron script only |
| 26 | Live notification providers | **DEFERRED** | Requires staging credentials |
| 27 | Runtime 2.0 documentation (Step 119) | **DONE** | This report + 13 topic docs |

## Blockers for production hardening

1. **Persistence gap** — Process restart loses in-memory queue unless worker syncs to Supabase and reload is implemented.
2. **Adapter stubs** — Outbox marks sent without real delivery.
3. **Workflow DB seed vs code** — Ambady row in `workflows` table not loaded by runtime.
4. **No DLQ replay** — Manual re-trigger only.
5. **Cron simplification** — Intervals hardcoded in `tickScheduler`, not `cron_expression` parsing.

## Staging checklist

1. Apply `20260818100000_runtime_2.sql`
2. Schedule `pnpm runtime:worker` (1–5 min cron) with `RUNTIME_ORG_ID` + `USE_SUPABASE=1`
3. Verify owner-portal `/runtime` after test checkout
4. Monitor `runtime_jobs`, `runtime_dead_letters`, `notification_outbox` in Supabase

## Documentation delivered

See [RINADS-RUNTIME-2.md](./RINADS-RUNTIME-2.md) (overview) and companion files listed in that doc.
