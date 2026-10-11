# RINPO P1 — Runtime Implementation Plan
## Goal: ship a secure assisted-mode RINPO core before expanding autonomy

## Sprint 1 — Context + Identity
Deliver:
- server-side authenticated user context
- tenant/membership resolution
- role/permission resolution
- context envelope
- correlation ID
- request audit event

Acceptance:
- browser cannot override tenant
- browser cannot override role
- missing membership denies access

## Sprint 2 — Policy + Risk
Deliver:
- ALLOW / DENY / APPROVAL_REQUIRED / DEFER / ESCALATE
- LOW / MEDIUM / HIGH / CRITICAL
- policy test fixtures
- tenant policy configuration

Acceptance:
- model output cannot authorize itself
- CRITICAL actions cannot run autonomously in v1

## Sprint 3 — Memory
Deliver:
- semantic
- episodic
- procedural
- preference
- policy
- operational
- document memory
- provenance/confidence/source fields

Acceptance:
- tenant/user scoped
- inferred model output cannot silently persist
- inspection/correction/deletion endpoints

## Sprint 4 — Intent + Planner
Deliver:
- deterministic command grammar for high-confidence common actions
- structured intents
- plan schema
- dependency/risk/expected-result fields
- validation before execution

Acceptance:
- invalid plan cannot reach executor
- permission/policy/idempotency checks execute before mutation

## Sprint 5 — Tool Runtime
Initial read tools:
- `crm.search_contacts`
- `finance.generate_report`
- `commerce.search_products`
- `commerce.get_inventory`
- `logistics.track_shipment`
- `platform.health_check`

Initial controlled mutations:
- `crm.create_lead`
- `crm.update_customer`
- `workflow.create_task`
- `commerce.create_order`
- `commerce.create_purchase_order`
- `logistics.create_shipment`
- `finance.create_invoice`

Acceptance:
- only registered typed tools
- no arbitrary SQL/shell/filesystem/browser execution
- mutations require idempotency keys

## Sprint 6 — Approval + Verification
Deliver:
- action preview
- approval queue
- manager/owner/founder/finance/security routes
- postcondition verification
- uncertain-action state

Acceptance:
- tool return != business success
- failed invariant stops dependent steps
- approver receives impact/risk/evidence

## Sprint 7 — Events + Action Ledger
Deliver:
- transactional outbox
- immutable events
- RINPO action ledger
- activity timeline

Acceptance:
- state mutation commits before external event publication
- retries do not duplicate mutations

## Sprint 8 — ModelGateway + Deterministic Degradation
Deliver:
- provider-neutral ModelGateway
- configured cloud/local adapters
- deterministic fallback
- cost telemetry

Acceptance:
- no direct vendor import in business/domain layer
- deterministic workflows continue during LLM outage
- per-tenant/user/action/model costs observable

## Sprint 9 — RINPO UI
Surfaces:
- Chat
- Quick Actions
- Action Preview
- Approvals
- Activity
- Memory
- Permissions
- Automation

Default mode: **Assisted**

## P1 Blocking Tests
- cross-tenant access
- privilege escalation
- prompt injection
- disabled/unregistered tool
- duplicate webhook
- duplicate order/payment
- model outage
- queue retry
- failed verification
- audit immutability

## P1 Definition of Done
P1 exits only after the Security Gate passes and one real tenant can:

1. ask a read question,
2. see a grounded business answer,
3. prepare a controlled mutation,
4. approve it,
5. execute it idempotently,
6. verify the resulting state,
7. inspect the action in Activity/Audit.
