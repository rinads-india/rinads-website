# RINADS Platform Kernel Contract

This document is the operational source-of-truth map for shared platform capabilities. It implements ADR-013 and is intentionally narrower than a full product roadmap.

## 1. Platform shape

```text
Client Experiences
  website / owner / customer / admin / R GLOW / future vertical apps
        ↓
Shared OS Domains
  commerce / operations / billing / communications / services
        ↓
RINPO Intelligence + Runtime
  tool registry / approvals / workflows / durable jobs / outbox
        ↓
Platform Kernel
  auth / tenancy / permissions / database / audit / canonical events
        ↓
PostgreSQL / Supabase
```

The system remains a modular monorepo. Network microservices are introduced only when operational evidence justifies extraction.

## 2. Canonical source-of-truth matrix

| Concern | Canonical truth | Compatibility/read model | Forbidden parallel replacement |
| --- | --- | --- | --- |
| Tenant | `organizations` + `organization_members` | active-org cookie/session context | vertical-specific tenant/user tables that replace Core tenancy |
| Authorization | `roles`, `permissions`, `role_permissions`, RLS helpers | app-level route guards | separate vertical RBAC engines |
| Audit | `audit_logs` + approved domain append-only audit | UI projections | mutable audit replacement |
| Business events | `business_events` | event explorers/projections | new vertical canonical event stores |
| Runtime | Runtime 2.0 persisted artifacts | in-memory execution state | second orchestration engine |
| Inventory | `stock_movements` + active reservations | `product_variants.stock` projection | independent stock counters as authority |
| Orders | shared commerce/orders or explicitly mapped shared service order contract | UI/order journey projections | duplicate generic order engines per vertical |
| Payments | shared billing/payment + webhook-idempotency patterns | provider-specific references | independent payment architecture per vertical |
| Notifications | `notification_outbox` and shared communications adapters | delivery/read models | direct provider sends from UI/domain code |
| RINPO actions | `@rinads/intelligence` registry + permission/approval/runtime controls | vertical tool packs | arbitrary SQL/SDK access from model output |

## 3. Tenant hierarchy

Mandatory security scope:

```text
organization_id
```

Additive hierarchy now present in the repository schema:

```text
Organization
  ├─ Workspace
  │   └─ Location
  └─ default Workspace for backward compatibility
```

Rules:

1. `organization_id` remains present on tenant-owned authoritative rows.
2. Workspace is a business-unit/operating-context scope, not a replacement tenant id.
3. Location represents an operational/physical site and must not be overloaded as a tenant.
4. Existing inventory and salon branch/location concepts remain functional until mapped deliberately.
5. PR-K2 added the workspace/shared-location schema, RLS, default-workspace backfill/trigger and same-organization composite FK. Repository merge does not by itself prove production migration application.

## 4. Inventory truth contract

The operational stock ledger is authoritative.

```text
on_hand = SUM(tenant-scoped stock_movements.quantity_delta)
reserved = active + unexpired tenant-scoped reservations
available = MAX(0, on_hand - reserved)
```

Current compatibility:

- `product_variants.stock` remains for existing storefront/read projections.
- `packages/operations-server/src/seed.ts` may synchronize that projection from the ledger.
- `packages/commerce-server/src/legacy-inventory.ts` is the isolated scalar-stock adapter for demo/legacy commerce-server flows only.
- `CheckoutService.placeOrder()` fails closed without an `InventoryPort`; authoritative checkout cannot silently mutate scalar variant stock.

Production storefront/operations wiring uses `@rinads/operations` `StockLedgerService` through the `InventoryPort`. Direct `variant.stock` mutations are architecture-guarded and allowed only in the explicit legacy adapter and projection synchronizer.

PR-K3 also requires balance calculations to scope movements/reservations by `organization_id`, and reservation creation to validate the complete aggregate request before writing new holds.

## 5. Durable runtime contract

For material business state:

```text
Supabase/PostgreSQL = durable authority
Memory             = execution/cache/test state
```

Material state includes:

- payment/refund progression
- inventory reservations and movements
- approvals
- workflow/job state
- outbound communications
- shipment/fulfilment progression
- RINPO side-effect execution

The existing Runtime 2.0 remains the runtime. Improve its persistence semantics rather than introducing another orchestration product.

## 6. Command mutation contract

Target command path:

```text
request
  → validate input
  → derive tenant context
  → authorize permission/resource access
  → begin DB transaction
  → mutate authoritative rows
  → write audit record
  → write canonical event/outbox record
  → commit
  → asynchronous subscribers
```

External provider side effects must be idempotent and should occur after durable intent/state exists.

PR-K4 will prove this contract on selected critical flows before it is treated as universally complete.

## 7. RINPO contract

RINPO is an intelligence/execution layer over platform capabilities, not a privileged bypass.

A tool is executable only when its registered contract permits it. Mature tool metadata converges on:

```text
name
version
domain
input schema
output schema
required permission
risk level
approval requirement
idempotency strategy
timeout/retry policy
audit metadata
event metadata
```

Sensitive or externally consequential actions use the shared approval/runtime controls. Models do not receive unrestricted service-role/database access.

## 8. Vertical product rules

Verticals such as R GLOW, Automotive, Jewellery and Landscape should usually add configuration and extensions before duplicating platform modules.

Allowed extensions:

- vertical terminology
- vertical-specific entities
- workflows/state machines
- dashboards
- RINPO tools/skills
- external provider adapters
- policy/configuration packs

Shared capabilities to reuse:

- auth
- organizations/memberships
- RBAC/RLS
- audit/events/runtime
- billing/payment primitives
- notifications/outbox
- commerce/operations primitives where applicable
- RINPO execution framework

## 9. Architecture guard policy

Repository tests protect high-risk divergence classes including:

1. duplicate creation of protected canonical shared tables;
2. direct mutation of `variant.stock` outside the explicit compatibility/projection adapters;
3. authoritative checkout proceeding without an inventory provider.

The guards are intentionally conservative. When architecture legitimately evolves, update ADR-013, this contract and tests in the same PR.

## 10. PR sequence and acceptance

### PR-K1 — merged
Architecture contract + repository guards.

### PR-K2 — merged to repository
Workspace/shared-location additive schema, RLS and isolation tests. Production migration application remains a separate ops action.

### PR-K3 — current
Inventory truth hardening: tenant-scoped ledger/reservation availability, fail-closed checkout inventory dependency, isolated legacy scalar adapter and reservation atomicity tests.

### PR-K4
Transactional command/event/outbox proof for selected critical flows.

### PR-K5
Canonical Business OS customer → lead → opportunity → quote → project/order → invoice/payment graph.

### PR-K6
Generic RINPO tool schema/risk/idempotency execution contract.

Every phase must preserve green lint, typecheck, tests and build. UI-affecting changes also require Playwright smoke coverage.
