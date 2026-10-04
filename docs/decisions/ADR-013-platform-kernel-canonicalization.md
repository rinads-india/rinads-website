# ADR-013 — Platform kernel canonicalization

- **Status:** Accepted
- **Date:** 2026-10-05
- **Scope:** RINADS shared platform substrate
- **Supersedes:** No prior ADR. This refines ADR-001, ADR-003, ADR-005, ADR-008 and ADR-009.

## Context

RINADS now has substantial shared platform capability: organization tenancy, RBAC/RLS, commerce, ERP operations, Runtime 2.0, approvals, outbox delivery, RINPO tooling and vertical products such as R GLOW. The scaling risk is no longer absence of architecture; it is divergence through duplicated auth, tenant, audit, event, payment, inventory or AI execution stacks as new verticals are added.

This ADR freezes the platform kernel before further vertical expansion.

## Decision

RINADS uses one shared platform substrate:

```text
RINADS Platform Kernel
  -> shared operating-system domains
  -> RINPO intelligence/runtime contracts
  -> vertical configuration and extensions
  -> client experiences
```

Verticals extend the kernel. They do not recreate it.

### 1. Canonical tenancy hierarchy

`organization_id` remains the mandatory tenant boundary and RLS scope.

Future hierarchy is additive:

```text
Organization
  -> Workspace (optional business unit / operating context)
      -> Location (optional physical/operational site)
```

Workspace and shared Core location support will be introduced in a later additive migration. Existing tables are not mass-rewritten in this ADR. Each organization will eventually have a default workspace so existing organization-scoped behaviour remains backward compatible.

### 2. Canonical ownership of shared primitives

The following capabilities have exactly one platform owner:

| Capability | Canonical owner |
| --- | --- |
| Identity / profiles | Core identity + `@rinads/auth` |
| Organizations / memberships | Core identity + `@rinads/tenancy` |
| Roles / permissions | Core identity + `@rinads/permissions` |
| Audit | `audit_logs` plus domain-specific append-only audit where required |
| Canonical business events | `business_events` |
| Workflow / jobs / approvals / outbox | `@rinads/runtime` + Runtime 2.0 tables |
| Commerce catalog / cart / orders | `@rinads/commerce*` |
| Inventory operations | `@rinads/operations*` + stock ledger/reservations |
| Payment webhook idempotency | existing shared payment/webhook infrastructure |
| RINPO tool registry | `@rinads/intelligence` |

New verticals MUST NOT create parallel replacements for these primitives.

### 3. Inventory source of truth

The authoritative inventory model is the operational ledger plus active reservations.

```text
available = on_hand_from_ledger - active_reservations - blocked_stock
```

`product_variants.stock` is a compatibility/read projection. It is not the long-term authoritative mutation target.

Until PR-K3 completes, the existing legacy checkout fallback may still mutate `variant.stock` in non-ledger/demo paths. That exception is explicitly allowlisted by architecture tests and MUST NOT spread to new code.

### 4. Durable runtime truth

PostgreSQL/Supabase is the authoritative persistence layer for business-critical runtime state. In-memory runtime state may be used for execution, tests, caching or hydration, but must not become the sole durable truth for money, inventory, approvals, outbound communication, shipping or other material business workflows.

Runtime 2.0 remains the orchestration layer; no parallel workflow runtime is introduced.

### 5. Event and command contract

Critical mutations converge on:

```text
Command
  -> validate
  -> authorize
  -> database transaction
  -> audit
  -> canonical domain event / durable outbox
  -> response
```

Atomicity for critical paths is implemented and proven incrementally in PR-K4. This ADR does not claim every current mutation already satisfies that contract.

### 6. RINPO execution contract

RINPO cannot bypass platform authorization. Tools are registered capabilities, not arbitrary database access.

Every mature tool contract will converge on:

- input schema
- output schema
- required permission
- risk level
- approval requirement
- idempotency policy where side effects exist
- timeout/retry policy
- audit metadata
- emitted event metadata

Existing salon tools remain valid and will migrate incrementally without behaviour regressions.

### 7. Payment convergence

Do not create new independent payment stacks per vertical. Existing Services, Commerce and Salon payment capabilities converge toward a canonical payment intent / attempt / provider transaction / webhook / refund lifecycle while preserving live behaviour during migration.

### 8. Vertical extension rule

A vertical may add:

- terminology
- domain extension tables
- workflows
- dashboards
- RINPO skill/tool packs
- provider adapters
- vertical-specific policies

A vertical must reuse shared:

- authentication
- tenancy
- RBAC/RLS
- audit
- canonical events/runtime
- billing/payment infrastructure
- notifications/outbox
- file/integration primitives where available
- RINPO execution controls

## Explicit non-goals

This phase does not introduce:

- Kafka
- Kubernetes
- database-per-tenant architecture
- a second workflow engine
- a second RINPO runtime
- independent vertical auth systems
- destructive schema rewrites
- production migration application

## Compatibility policy

Canonicalization proceeds additively. Existing production contracts stay functional until a replacement is proven by tests and cut over deliberately. Compatibility fields may remain as read projections during transition but must be labelled as such.

## Enforcement

`apps/website/tests/platform-kernel-architecture.test.ts` provides repository-level architecture guards for protected shared tables and direct inventory stock mutation exceptions.

Future PRs that intentionally change these rules must update this ADR and the corresponding tests in the same change.

## Follow-up sequence

1. **PR-K1** — architecture contract + guards (this ADR)
2. **PR-K2** — additive Workspace + shared Location foundation
3. **PR-K3** — inventory truth hardening
4. **PR-K4** — durable command/event atomicity
5. **PR-K5** — Business OS canonical CRM/work/finance graph
6. **PR-K6** — generic RINPO tool contract
