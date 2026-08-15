# Scheduler

Periodic background processors for inventory maintenance.

## Default schedules

Seeded per org in `seedSchedulesForOrg()` (`packages/runtime/src/scheduler/scheduler.ts`):

| Processor key | Interval | Cron (reference) | Purpose |
|---------------|----------|------------------|---------|
| `reservation_expiry` | 5 min | `*/5 * * * *` | Release expired cart reservations |
| `low_stock_scan` | 1 hour | `0 * * * *` | Scan SKUs below reorder point |

Misfire policy: `run_once`.

DB table `workflow_schedules` exists for future cron-driven workflows; current scheduler uses in-memory `ScheduleDefinition[]`.

## Tick behavior

`tickScheduler()` runs inside `RuntimeService.processQueue()`:

- Skips paused schedules
- Uses simplified interval check (not full cron parsing — **deferred**)
- Enqueues durable jobs with idempotency key `schedule:{processorKey}:{timestamp}`

## Processors

Registered in `wireRuntime()` (`runtime-wiring.ts`):

**reservation_expiry** — `ReservationService.expireReservations()`; creates info alert when items expired.

**low_stock_scan** — `LowStockService.listLowStock()`; warning alert per SKU.

Both use `AlertEngine` from legacy runtime module.

## Worker invocation

```bash
pnpm runtime:worker
```

Script: `scripts/cron/runtime-worker.ts`

1. Wire operations + runtime services
2. `initOrganization(RUNTIME_ORG_ID)` — seeds schedules + refund policy
3. `processQueue()` — tick scheduler, run jobs, workflows, outbox
4. Optional Supabase sync when `USE_SUPABASE=1`

Schedule in production: cron every 1–5 minutes (covers both processors via tick).

## Env vars

| Variable | Default | Purpose |
|----------|---------|---------|
| `RUNTIME_ORG_ID` | `org_ambady_demo` | Tenant to process |
| `USE_SUPABASE` | unset | Enable artifact sync |

## Related

- [RETRY-ENGINE.md](./RETRY-ENGINE.md) — job retry for scheduled processors
- [WORKFLOW-ENGINE.md](./WORKFLOW-ENGINE.md) — event-triggered flows (distinct from scheduler)
