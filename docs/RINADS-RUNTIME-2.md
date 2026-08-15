# RINADS Runtime 2.0

Package: `@rinads/runtime` · Wiring: `@rinads/operations-server` · Worker: `pnpm runtime:worker`

Supersedes [RINADS-RUNTIME-EVENTS.md](./RINADS-RUNTIME-EVENTS.md) (legacy unversioned event catalog).

## Overview

Runtime 2.0 is the tenant-scoped orchestration layer for business-critical flows. It replaces inline `JobRunner.processPending()` with:

- **Versioned events** (`order.paid.v1`) in an append-only canonical log
- **Workflow executions** triggered by events
- **Durable jobs** with retry and dead-letter handling
- **Action registry** for validated side effects
- **Notification outbox** for async delivery

Primary store remains in-memory (`MemoryRuntimeStore`) for request-path latency. **Phase 13:** when `USE_SUPABASE=1`, the worker hydrates from Supabase, claims jobs via RPC, and syncs back after each run. Persistence hooks write jobs and execution snapshots on enqueue/update. See [PHASE_13_WORKER_PERSISTENCE.md](./PHASE_13_WORKER_PERSISTENCE.md).

## Architecture

```
Checkout (order paid)
    → RuntimeService.handleOrderPaid()
        → emit order.paid.v1
        → start workflow execution (order-fulfilment-v1)
        → enqueue workflow_runner job
    → processQueue() [request or worker]
        → durable job queue
        → workflow engine (step runs → actions)
        → scheduler tick (reservation_expiry, low_stock_scan)
        → notification outbox
```

### RuntimeService

`packages/runtime/src/runtime-service.ts` is the façade:

| Method | Purpose |
|--------|---------|
| `emit()` | Versioned event with loop guard + idempotency |
| `handleOrderPaid()` | Canonical checkout hook |
| `processQueue()` | Jobs, workflows, scheduler, outbox |
| `approve()` / `reject()` | Resume or block gated steps |
| `getDashboard()` | Owner-portal metrics |

### Worker

`scripts/cron/runtime-worker.ts` calls `runSupabaseRuntimeWorker()` when `USE_SUPABASE=1`:

1. Reset stale `running` jobs (>10 min)
2. Load ops/commerce from Supabase
3. Hydrate runtime store + claim jobs
4. `processQueue()` with persistence hooks
5. Full artifact sync

Demo mode (no `USE_SUPABASE`) uses in-memory wiring unchanged.

Env: `RUNTIME_ORG_ID`, `USE_SUPABASE=1`, Supabase URL + service role key.

### Legacy compatibility

`EventStore` and `JobRunner` in `packages/runtime/src/runtime.ts` remain exported for older paths. New flows use `RuntimeService`.

## Key files

| Area | Path |
|------|------|
| Service | `packages/runtime/src/runtime-service.ts` |
| Wiring | `packages/operations-server/src/runtime-wiring.ts` |
| Worker | `scripts/cron/runtime-worker.ts` |
| Migration | `supabase/migrations/20260818100000_runtime_2.sql` |
| UI | `apps/owner-portal/app/runtime/` |

## Related docs

- [EVENT-ARCHITECTURE.md](./EVENT-ARCHITECTURE.md)
- [WORKFLOW-ENGINE.md](./WORKFLOW-ENGINE.md)
- [RUNTIME-FORENSICS.md](./RUNTIME-FORENSICS.md) (pre-2.0 baseline)
