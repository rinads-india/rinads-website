# RINPO P0 — Live Repository Audit

**Repository:** `rinads-india/rinads-website`  
**Audit target:** RINPO Canon v2.1  
**Purpose:** identify what is already aligned, what remains partial, and what should block production autonomy.

## Executive result

The current repository is **substantially aligned** with the new RINPO canon at the runtime/control-plane level. The project already separates Supabase as operational system of record from the RINPO execution plane, keeps consequential actions behind authorization/policy/approval/audit, uses server-only service credentials, and treats external model providers as inference dependencies rather than owners of identity, state, memory, permissions or policy.

The main remaining work is **production hardening**, not a full architecture rewrite.

## Already aligned

### Control plane
Current `docs/RINPO-CONTROL-PLANE.md` already establishes:
- `admin.rinads.com/rinpo` as a private founder/platform-owner surface
- server-gated founder/super-admin access
- no fake demo status when production sources are unavailable
- Supabase as operational system of record
- separate RINPO runtime as execution plane
- proposal/approval/runtime/audit path for future writes
- server-only provider/service credentials
- deterministic NLU fallback

### Runtime / security
Current runtime documentation already establishes:
- RLS for runtime tables
- organization-scoped runtime operations
- action permissions
- workflow approval based on risk threshold
- RINPO tool-category/hard-limit controls
- PII masking in owner event explorer
- payload hashes for approvals
- service-role usage confined to worker/server paths

### Runtime implementation
Phase 12 reports these as done:
- RuntimeService facade
- runtime tables and indexes
- RLS assertions
- action registry + validation
- workflow engine
- durable queue + backoff
- approval engine + owner UI
- runtime worker
- Supabase artifact sync + hydration
- RINPO READ/DRAFT/ACTION registry
- RINPO hard limits
- owner runtime observability
- event loop guard

## P0 hardening completed in this branch

### Append-only event enforcement — FIXED IN PR
Migration `20261011100000_rinpo_event_immutability.sql` now:
- rejects UPDATE/DELETE on canonical `business_events` at the database trigger level
- keeps service-level append-only logic as defense in depth
- adds an RLS-protected `business_event_consumptions` table for mutable per-consumer processing state
- guards organization ownership between consumption rows and source events

### Event processing state — RESOLVED BY DESIGN
The legacy `business_events.processed_at` column is explicitly deprecated rather than mutated.

Per-consumer lifecycle now belongs in `business_event_consumptions` with:
- `pending`
- `processing`
- `processed`
- `failed`

This preserves event immutability while allowing multiple consumers to track processing independently.

## Remaining production-hardening gaps

### P1 — dead-letter replay
Dead-letter visibility exists, but there is no replay API.

Action:
- implement founder/ops-authorized replay
- require idempotency key + original correlation/causation chain
- audit every replay request/outcome

### P1 — tenant refund policy wiring
`tenant_policies` refund threshold is seeded, but `refund.process` is not wired.

Action:
- do not expose autonomous refund behavior until policy + approval + verification are complete

### P1 — scheduler
Current scheduler uses simplified/hardcoded intervals instead of full `cron_expression` parsing.

Action:
- implement durable schedule semantics before relying on it for business-critical automations

### P1 — notification adapters
Outbox exists, but live email/WhatsApp delivery remains stubbed in the Phase 12 report.

Action:
- implement real provider adapters
- verify delivery states rather than marking a stub as business success

### P1 — workflow definitions
DB-driven workflow definitions remain deferred; code still uses built-in workflow definitions.

Action:
- decide whether v1 explicitly freezes built-ins or promotes database-defined workflow versions
- avoid two competing workflow authorities

### P1 — legacy runtime exports
Legacy `EventStore` / `JobRunner` removal remains deferred.

Action:
- deprecate and remove or explicitly isolate behind compatibility boundaries

### P1 — worker deployment
Supabase Edge Functions remain deferred; current worker is cron-script based.

Action:
- keep cron worker if operationally reliable, but document HA/retry/monitoring expectations
- do not call this gap a blocker solely because it is not an Edge Function

## Control-plane next slices that remain valid

The existing control-plane roadmap is consistent with the canon and should continue:
1. session inspection with actor/tenant context
2. memory provenance/correction/retention/scope controls
3. explicit tool permission/risk metadata
4. unified action + approval queue
5. agent/run/evaluation/cost budgets
6. provider/model/token/cost/latency observability
7. development -> evaluation -> founder approval -> production governance
8. rollback / kill switch with immutable audit
9. task-aware routing and tenant/provider allowlists

## Release recommendation

Do **not** rewrite Runtime 2.0 from scratch.

Proceed incrementally:

```text
current Runtime 2.0
  -> immutable canonical events [implemented in this PR]
  -> finish verification/replay/policy wiring
  -> complete memory provenance controls
  -> make approval + activity a unified surface
  -> enforce security suite as CI release gate
  -> only then expand guarded autonomy
```

## Canon decision

The active technical implementation lives in `rinads-website`, while `RINADS-RINPO` is currently primarily a Unity/character-world repository. Therefore:
- runtime/product canon should be anchored in `rinads-website`
- Unity/character assets can consume the character/story canon without becoming the business system of record
