# RINPO P1 — Runtime Implementation Plan
## Goal: ship a secure assisted-mode RINPO core before expanding autonomy

> **Branch status — 11 Oct 2026:** P1 hardening is in progress on PR #119. The items marked **IMPLEMENTED IN PR** are branch-complete but must not be described as production-live until the PR is merged, migrations are applied, and the release/security gates pass.

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
- postcondition verification — **IMPLEMENTED IN PR for the action runtime contract and core fulfilment/notification/task mutations**
- uncertain-action state

Current branch implementation:
- `RegisteredAction.verify` provides a business-state postcondition contract.
- `executeAction()` fails closed with `verification_error` when a handler says success but its postcondition is not confirmed.
- fulfilment creation verifies tenant/order/fulfilment state.
- notification enqueue verifies the outbox record and idempotency identity.
- task creation verifies the task is present in the tenant operations store.
- tests cover verifier pass/fail behavior.

Acceptance:
- tool return != business success — **IMPLEMENTED IN PR**
- failed invariant stops dependent steps — **IMPLEMENTED IN PR through action failure propagation**
- approver receives impact/risk/evidence

## Sprint 6B — Dead-letter Recovery
Deliver:
- complete DLQ creation for every terminal job path — **IMPLEMENTED IN PR**
- replay only the original dead-letter job — **IMPLEMENTED IN PR**
- preserve the original idempotency identity — **IMPLEMENTED IN PR**
- tenant/management authorization — **IMPLEMENTED IN PR**
- replay actor/count/note/timestamp — **IMPLEMENTED IN PR**
- service-role-only atomic Supabase replay RPC — **IMPLEMENTED IN PR**
- owner runtime control-plane replay action — **IMPLEMENTED IN PR for the current owner portal runtime path**
- workflow/outbox DLQ replay — deferred beyond job replay v1

Security rules:
- authenticated clients cannot execute the replay RPC directly;
- the server resolves actor/tenant/policy first;
- replay only requeues work — normal execution, verification, and audit still determine success;
- a resolved DLQ record cannot be replayed twice.

## Sprint 7 — Events + Action Ledger
Deliver:
- transactional outbox
- immutable events — **DB append-only enforcement IMPLEMENTED IN PR**
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
- Runtime recovery / DLQ — **basic owner view + job replay IMPLEMENTED IN PR**

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
- failed verification — **covered in PR**
- DLQ tenant/authorization/replay safety — **covered in PR**
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

### Remaining highest-priority gaps after current PR work
1. Resolve runtime identifier consistency between in-memory/runtime IDs and UUID-backed persistence before calling the worker production-safe.
2. Finish memory provenance/inspection/correction/deletion controls.
3. Wire refund thresholds, evidence, and postcondition verification before enabling finance mutations.
4. Add a canonical immutable RINPO action ledger/activity surface.
5. Turn security tests into a release-blocking CI gate.
6. Run one real tenant end-to-end in Assisted mode before permitting any additional autonomy.
