# RINADS Intelligence v1 — Locked Architecture

Status: **foundation / feature branch**

RINADS Intelligence (RI) is the governed reasoning and decision layer between authoritative business state and RINPO Runtime.

It is not a second chatbot, a second runtime, or a parallel source of truth.

## Canonical loop

`OBSERVE → UNDERSTAND → RECOMMEND → AUTHORIZE → ACT → AUDIT`

- **OBSERVE** — read tenant-scoped signals, metrics, events and current surface context.
- **UNDERSTAND** — produce evidence-backed findings with confidence and risk.
- **RECOMMEND** — rank next-best actions by impact, urgency, confidence and risk.
- **AUTHORIZE** — evaluate role, permission, autonomy level, hard limits and approval policy.
- **ACT** — hand an authorized action to typed RINPO tools / RINPO Runtime; RI does not mutate domain state directly.
- **AUDIT** — record recommendation, authorization, execution result, cost and evidence references.

## Position in the platform

```text
RINADS Blueprint
      ↓
Business Graph / domain services
      ↓
RINADS Intelligence
      ↓
RINPO
      ↓
RINPO Runtime / typed tools
      ↓
Domain mutation
      ↓
Audit + events
      ↺
```

The authoritative business state remains in RINADS domain services/Supabase. RI reasons over that state; it does not become a second database.

## Foundation implemented in this slice

- `ri-types.ts`
  - intelligence stages
  - evidence references
  - signals, findings and recommendations
  - action intents
  - decision items
  - autonomy levels 0–5
- `ri-policy.ts`
  - deterministic autonomy/approval policy
  - critical-risk block
  - sensitive financial/pricing/refund/inventory mutations remain approval-gated
- `ri-engine.ts`
  - deterministic recommendation scoring
  - deterministic ranking
  - decision queue generation
  - inspectable intelligence frame
- `tests/ri-engine.test.ts`
  - autonomy gates
  - sensitive mutation gates
  - critical-risk block
  - deterministic ranking
  - decision-queue behavior

No existing RINPO tool behavior is changed by this foundation slice.

## Autonomy levels

| Level | Name | Behavior |
|---|---|---|
| 0 | Observe | read-only intelligence |
| 1 | Advise | explain and recommend |
| 2 | Draft | create draft state; no committed side effect |
| 3 | Approve-to-Act | actions require explicit human approval |
| 4 | Autonomous | low-risk non-sensitive actions may execute; higher risk escalates |
| 5 | Autonomous + Escalation | low/medium non-sensitive actions may execute; high risk escalates |

Critical-risk actions are blocked by RI v1. Existing hard platform limits remain authoritative.

## Core invariant

**LLM output must never be the authorization boundary.**

Models may:

- interpret user intent,
- summarize state,
- propose findings,
- propose recommendations,
- explain rationale.

Deterministic platform logic must decide:

- tenant scope,
- permissions,
- tool availability,
- autonomy level,
- approval requirement,
- hard blocks,
- runtime execution,
- audit recording.

## RI v1 data contract

### Signal

A measurable or observable fact, e.g.:

- 7 qualified leads have no next action,
- ₹84,000 becomes overdue tomorrow,
- stock for SKU X is below reorder level,
- tomorrow is 82% booked.

Every signal should carry evidence references.

### Finding

An interpretation of one or more signals, e.g.:

> Sales follow-up discipline is deteriorating.

A finding requires confidence, risk and evidence.

### Recommendation

A proposed next-best action, e.g.:

> Prepare a follow-up sequence for the seven stale qualified leads.

Recommendations carry impact, urgency, confidence, risk, owner role, RINPO role and optional action intent.

### Decision item

A recommendation becomes a decision item when it is blocked or requires human approval.

The Founder/Manager Decision Queue is therefore generated from policy, not manually curated UI state.

## Required next platform components

### P0 — Business signals

Create a signal-provider contract so domains can expose normalized observations without leaking storage details into RI.

Suggested providers:

- sales / CRM,
- finance / receivables,
- work / projects,
- commerce / orders,
- inventory,
- appointments,
- growth / campaigns,
- communications,
- logistics.

### P0 — Metric Registry

Canonical metric definitions:

- key,
- label,
- formula/source,
- tenant scope,
- time grain,
- industry compatibility,
- owner,
- thresholds,
- target.

Examples:

- `sales.qualified_leads`
- `sales.pipeline_coverage`
- `finance.overdue_receivables`
- `operations.overdue_work`
- `inventory.low_stock_count`
- `salon.rebooking_rate`

### P0 — Recommendation Registry

Important recommendations should not be invented from scratch by a model.

Registry entries should define:

- recommendation key,
- applicable functions/industries,
- eligibility rules,
- evidence requirements,
- action/tool mapping,
- default risk,
- expected impact metadata,
- approval policy.

Models may personalize language; deterministic rules establish operational eligibility.

### P0 — Decision Queue

Persisted decision lifecycle:

`PROPOSED → REVIEWING → APPROVED | REJECTED | DELEGATED | EXPIRED → EXECUTED | FAILED`

Actions available to humans:

- approve,
- reject,
- edit,
- delegate,
- ask RINPO,
- request evidence,
- schedule,
- escalate.

### P1 — RINPO roles and skills

One visible identity: **RINPO**.

Internal roles:

- Executive,
- Sales,
- Finance,
- Operations,
- Growth,
- Customer,
- People,
- Inventory,
- Logistics,
- Technology.

Each role should declare:

- readable domains,
- allowed tools,
- autonomy ceiling,
- required permissions,
- available skills,
- cost/budget policy,
- escalation owner.

### P1 — Context builder

Every RI request should build a bounded context package containing only required information:

- tenant identity,
- user/role,
- current product/surface,
- selected entity IDs,
- relevant business signals,
- applicable policies,
- permitted tools,
- knowledge references,
- memory references where allowed.

Do not send the entire tenant database to a model.

### P1 — Business Pulse / My Attention

`Business Pulse` = business-wide signals.

`My Attention` = user-scoped tasks, decisions, risks and approvals.

Both must be generated from authoritative records and RI evidence, not demo content.

### P1 — Blueprint integration

Blueprint findings should become RI recommendations.

Example:

`lead management maturity < threshold`
→ recommend lead-management playbook
→ user accepts
→ provisioning/runtime configures CRM stages, next-action requirement and stale-lead automation
→ RI later verifies whether follow-up SLA actually improves.

### P2 — Continuous reassessment

Run RI against event streams and scheduled checks to produce new signals when business state changes.

Do not run expensive model calls for every event. Prefer:

1. deterministic event/metric evaluation,
2. threshold/rule match,
3. model reasoning only when synthesis materially improves the outcome.

## Business Graph boundary

RI should reference shared business entities rather than vertical-specific duplicate concepts.

Core examples:

- organization,
- user/member,
- customer,
- lead,
- product/service,
- order,
- appointment,
- project/work item,
- invoice/payment,
- stock/location,
- campaign,
- shipment,
- communication,
- metric,
- event.

Industry packs may extend fields and terminology without creating independent platform cores.

## R GLOW first vertical proof

R GLOW should validate RI against real salon operations.

Initial signal set:

- today's appointments,
- empty slots,
- staff utilization,
- revenue today / week / month,
- pending payments,
- low stock,
- reactivation candidates,
- campaign failures,
- retention/rebooking,
- WhatsApp delivery state.

Initial recommendations:

- fill high-value empty slots,
- follow up stale clients,
- prepare reactivation campaign,
- reorder low-stock products,
- collect pending payments,
- resolve failed communications,
- rebalance staff schedule.

Sensitive mutations remain behind existing RLS, permissions and confirmation gates.

## Observability

Every completed intelligence cycle should make it possible to answer:

- What did RI observe?
- Which evidence did it use?
- What did it conclude?
- How confident was it?
- What did it recommend?
- Why was action allowed, blocked or approval-gated?
- Which tool/runtime action executed?
- What did it cost?
- What changed afterward?

Key metrics:

- recommendation acceptance rate,
- decision latency,
- action success/failure,
- false-positive recommendation rate,
- model/tool cost per useful action,
- autonomous vs approval-gated execution,
- business outcome delta after action.

## Security rules

1. Tenant identity is explicit on every intelligence request.
2. Role and permission checks happen before data/tool exposure.
3. RI never invents unavailable production data.
4. RI never bypasses RLS or typed service contracts.
5. Model output cannot directly mutate domain records.
6. Financial, pricing, refund/payout and inventory mutations stay approval-gated by default.
7. Critical-risk actions remain blocked in v1.
8. Every action is auditable.

## Delivery sequence

1. Foundation types/policy/ranking — **this slice**
2. Metric Registry + signal-provider contract
3. Recommendation Registry
4. Persisted Decision Queue
5. Role/skill registry
6. Context builder v2
7. R GLOW Business Pulse
8. Founder My Attention
9. Blueprint → recommendation bridge
10. Runtime execution receipts + outcome measurement
11. Additional industry packs
12. Controlled autonomy expansion

## Definition of done for RI v1

RI v1 is not complete because it can chat.

It is complete when a founder can open RINADS and see an evidence-backed list of what matters now, understand why each item matters, approve or delegate governed actions, allow permitted low-risk work to execute, and inspect a complete audit trail linking business state → recommendation → decision → action → outcome.
