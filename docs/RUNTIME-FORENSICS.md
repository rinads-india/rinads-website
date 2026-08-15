# Runtime Forensics — Phase 12 Baseline

Audit date: 2026-08-15. Read-only inventory before Runtime 2.0 implementation.

## Executive summary

RINADS has a **minimal in-process runtime** (`@rinads/runtime`) with one live business path (`order.paid` → fulfilment job). Tenant provisioning uses a **separate** Supabase job table. There is no durable business job queue, workflow engine, action registry, outbox, or Edge Functions.

## Event store

| Item | Location | Status |
|------|----------|--------|
| In-memory emit | `packages/runtime/src/runtime.ts` `EventStore` | Active |
| DB table | `business_events` in `20260815100001_operations_erp.sql` | Schema only partial sync |
| Idempotency | `(organization_id, idempotency_key)` unique | Works in memory |
| Correlation/causation | — | **Missing** |
| `processed_at` | Column exists | **Never set** |
| Versioned types | `RuntimeEventType` union | Unversioned strings |

**Live emit:** only `order.paid` from `packages/operations-server/src/index.ts` `handleOrderPaid`.

## Job runner

| Item | Status |
|------|--------|
| `JobRunner` | In-memory only; lost on restart |
| `fulfilment_on_paid` | Registered + inline `processPending()` on checkout |
| `reservation_expiry` | Defined in `processors.ts`, **not registered** |
| `low_stock_scan` | Defined in `processors.ts`, **not registered** |
| DB table `runtime_jobs` | **Missing** |

## Provisioning jobs (separate system)

- Table: `tenant_provisioning_jobs`
- Worker: `scripts/cron/provisioning-worker.ts` → `runPendingProvisioningJobs`
- **Do not conflate** with business runtime queue.

## Order / checkout hooks

- `CheckoutService.onOrderPaid` → `handleOrderPaid` in operations-server only
- `@rinads/commerce-server` checkout has **no** inventory port or runtime hook
- Storefront uses operations-server bundle; demo context only in some paths

## Inventory reservations

- Ledger reservations in memory via `StockLedgerService`
- Supabase adapter `loadOperationsStoreFromSupabase` returns `reservations: []`
- Table `inventory_reservations` exists in commerce migration but not hydrated

## RINPO / intelligence

- `packages/intelligence/src/tools.ts` — hardcoded switch, no registry metadata
- Ops tools (`ops_daily_briefing`, etc.) defined but **not wired** to owner-portal UI
- Website chat: rule-based, localStorage memory only
- ADR-008/009 Phase 0: no LLM gateway

## Notifications

- `AlertEngine` — in-memory operational alerts
- No `notification_outbox`, no email/WhatsApp adapters in code

## Scheduled jobs

- Only `pnpm provisioning:worker` exists
- No `pnpm runtime:worker`
- No Supabase Edge Functions directory

## Security gaps

- `business_events` RLS enabled but incomplete member policies vs other ops tables
- No runtime-specific RLS (workflows, executions, approvals) — tables did not exist pre-Phase-12

## Phase 12 Runtime 2.0 targets

1. Extend `business_events` + append-only RLS
2. Add workflow/execution/job/approval/outbox/policy tables
3. Refactor `@rinads/runtime` with action registry + workflow engine
4. `pnpm runtime:worker` for durable/async processing
5. Migrate `order.paid` to versioned events + workflow (no inline processPending)
6. Wire RINPO tool registry (READ/DRAFT/ACTION) advisory layer
7. Owner-portal observability UI

## Files touched by migration (reference)

- `packages/runtime/**`
- `packages/operations-server/src/index.ts`
- `packages/operations-server/src/supabase.ts`
- `packages/intelligence/**`
- `apps/owner-portal/app/runtime/**`, `approvals/**`
- `scripts/cron/runtime-worker.ts`
- `supabase/migrations/20260818100000_runtime_2.sql`
