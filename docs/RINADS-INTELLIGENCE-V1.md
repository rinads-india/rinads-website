# RINADS Intelligence v1 — Locked Architecture

Status: **core implementation / draft PR**

RINADS Intelligence (RI) is the governed reasoning and decision layer between authoritative business state and RINPO Runtime.

It is not a second chatbot, a second runtime, or a parallel source of truth.

## Canonical loop

`OBSERVE → UNDERSTAND → RECOMMEND → AUTHORIZE → ACT → AUDIT`

- **OBSERVE** — collect tenant-scoped signals and metrics through explicit providers.
- **UNDERSTAND** — form evidence-backed findings with confidence and risk.
- **RECOMMEND** — evaluate deterministic recommendation definitions and rank next-best actions.
- **AUTHORIZE** — apply deterministic autonomy/approval policy; LLM output is never the authorization boundary.
- **ACT** — hand authorized work to registered RINPO tools / RINPO Runtime; RI does not mutate domain state directly.
- **AUDIT** — persist governed decisions and use existing runtime/business-event audit layers for execution outcomes.

## Position in the platform

```text
RINADS Blueprint
      ↓
Business Graph / domain services
      ↓
Signal providers + Metric Registry
      ↓
RINADS Intelligence
      ↓
Recommendation Registry
      ↓
Authorization policy
      ↓
Decision Queue / autonomous permitted work
      ↓
RINPO Runtime / typed tools
      ↓
Domain mutation
      ↓
Audit + events
      ↺
```

The authoritative business state remains in RINADS domain services/Supabase. RI reasons over that state; it does not become a second database.

## Implemented in this branch

### Core contracts

- `ri-types.ts`
  - stages, scope and evidence references
  - signals, findings and recommendations
  - READ / DRAFT / WRITE / ACTION / SENSITIVE tool categories
  - autonomy levels 0–5
  - decision items and intelligence frames
- `ri-policy.ts`
  - deterministic autonomy/approval policy
  - critical-risk block
  - SENSITIVE tools always approval-gated through RI v1
  - financial/pricing/refund/inventory mutations approval-gated
- `ri-engine.ts`
  - deterministic recommendation scoring/ranking
  - policy-derived decision queue generation

### Metric Registry

`metric-registry.ts` defines canonical metric metadata separately from UI widgets and storage implementation.

Initial platform metrics include:

- `sales.qualified_leads`
- `finance.overdue_receivables`
- `operations.overdue_work`
- `inventory.low_stock_count`
- `growth.message_failures`
- `salon.empty_slots`
- `salon.rebooking_rate`

Industry packs may register more definitions without creating another intelligence core.

### Signal Provider contract

`signal-provider.ts` provides a bounded tenant-scoped provider interface. Provider failures are isolated so one unavailable domain does not fail an entire intelligence cycle.

Suggested next adapters:

- Company OS sales/work
- Finance Core receivables
- Salon appointments/revenue/retention
- Salon inventory
- Marketing OS / salon communication failures

### Recommendation Registry

`recommendation-registry.ts` establishes deterministic eligibility before any model-personalized language.

Initial definitions cover:

- low-stock review
- failed salon/customer communications
- salon reactivation draft creation
- overdue receivables review

Recommendations carry evidence, risk, impact, urgency, owner/RINPO role and optional registered-tool mapping.

### Persisted Decision Queue

Migration `20261022103000_ri_decision_queue.sql` adds:

- `intelligence.read`
- `intelligence.decide`
- `intelligence.manage`
- tenant-scoped `ri_decisions`
- append-only `ri_decision_events`
- active dedupe protection
- RLS
- DB-enforced lifecycle transitions
- automatic transition audit events

Decision lifecycle:

`PROPOSED → REVIEWING | APPROVED | REJECTED | DELEGATED | EXPIRED`

`REVIEWING → APPROVED | REJECTED | DELEGATED | EXPIRED`

`DELEGATED → REVIEWING | APPROVED | REJECTED | EXPIRED`

`APPROVED → EXECUTED | FAILED | EXPIRED`

Terminal states: `REJECTED`, `EXPIRED`, `EXECUTED`, `FAILED`.

## Autonomy levels

| Level | Name | Behavior |
|---|---|---|
| 0 | Observe | read-only intelligence |
| 1 | Advise | explain and recommend |
| 2 | Draft | draft-only work; no final committed side effect |
| 3 | Approve-to-Act | committed actions require human approval |
| 4 | Autonomous | low-risk non-sensitive mutations may execute; higher risk escalates |
| 5 | Autonomous + Escalation | low/medium non-sensitive mutations may execute; high risk escalates |

Critical-risk actions are blocked in RI v1. Existing RLS, typed service contracts, RINPO tool permissions and hard product limits remain authoritative.

## Core invariant

**LLM output must never be the authorization boundary.**

Models may interpret, summarize, synthesize or personalize. Deterministic platform logic decides tenant scope, permissions, registered tool availability, autonomy, approval requirements, hard blocks, runtime execution and audit recording.

## Decision Queue UX

The human queue should support:

- approve
- reject
- delegate
- ask RINPO
- request evidence
- schedule
- escalate

The first UI should expose **Needs You**, **Running**, **Scheduled**, **Completed**, **Failed** and **Blocked** without making users understand agent internals.

## R GLOW first vertical proof

Initial Business Pulse signals:

- appointments today
- empty slots
- staff utilization
- revenue today/week/month
- pending payments
- low stock
- reactivation candidates
- campaign/message failures
- retention/rebooking
- WhatsApp delivery state

Initial RI recommendations:

- review/fill high-value empty capacity
- prepare client reactivation
- review low stock
- review pending/overdue payments
- resolve failed communication delivery
- surface low retention/rebooking

Sensitive mutation still flows through existing RLS, permissions and confirmation gates.

## Next slices

1. **Domain signal adapters** wired to current Company OS / Finance Core / R GLOW repositories
2. **Persist-decision service** that upserts active queue items by organization + dedupe key
3. **RINPO role/skill registry** with tool, permission and autonomy ceilings
4. **Context builder v2** with bounded, source-labelled business context
5. **R GLOW Business Pulse + My Attention UI**
6. **Blueprint → RI bridge**
7. **Runtime execution receipts + outcome measurement**
8. **Additional Industry Pack metric/recommendation registries**

## Definition of done for RI v1

RI v1 is complete when an authorized user can open RINADS and see an evidence-backed list of what matters now, inspect why it matters, approve/reject/delegate governed decisions, let permitted low-risk work execute through registered Runtime tools, and inspect a complete trace from business state → signal → recommendation → authorization → decision/action → outcome.
