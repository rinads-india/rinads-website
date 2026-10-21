# RINADS Business Cloud V2 — foundation contract

Status: implementation foundation. This document narrows the next build sequence without replacing ADR-013 or the Platform Kernel Contract.

## Objective

Turn the current shared RINADS kernel into deeper production business capabilities without creating parallel ERP stacks.

```text
RINPO
  ↓
RINADS Intelligence + Runtime
  ↓
Business Cloud
  ├─ Business / Company OS
  ├─ Commerce
  ├─ Finance
  ├─ India Compliance
  ├─ Logistics
  ├─ Academy
  ├─ Marketplace
  └─ Creative / Automation
  ↓
Platform Kernel
  auth / tenancy / permissions / audit / events / billing / data
```

## Non-negotiable reuse rules

1. Do not fork auth, tenant identity, RBAC/RLS, approvals, runtime, audit, events, orders, payments, or inventory authority.
2. Vertical products add workflows and configuration before duplicating generic modules.
3. External provider side effects are adapter-driven and idempotent.
4. AI/media consumption extends `@rinads/billing`; it does not create a second wallet stack.
5. Finance and India Compliance are not marketed as statutory-complete until validated by domain experts and production acceptance tests.

## Slice A — AI Credits (this branch)

AI Credits are usage units for RINPO, LLMs, media generation, voice, research and automation. They are not cash or stored value.

Foundation tables:

- `credit_accounts`
- `credit_lots`
- `credit_ledger` — append-only authority
- `credit_reservations` — fail-closed holds before expensive operations
- `credit_usage_events` — provider/model/cost evidence

Rules:

- tenant scope is `organization_id`;
- browser clients have read-only RLS in the foundation slice;
- mutations are service-side until governed commands are implemented;
- every provider charge path must have an idempotency key;
- corrections use compensating ledger entries;
- provider cost is captured separately from billable credits so gross margin is measurable.

Next AI Credits slice:

1. atomic reserve/capture/release RPC/service;
2. lot depletion and expiry policy;
3. platform-admin credit adjustment workflow with approval/audit;
4. RINPO/Runway/OpenAI/Anthropic/ElevenLabs usage adapters;
5. owner billing UI and margin reporting.

## Slice B — Finance + India Compliance

Current Company OS finance remains an operating layer, not statutory accounting.

Build on shared customers/orders/payments with a dedicated accounting domain:

- chart of accounts
- journal entries + immutable posting batches
- accounts receivable / payable
- bank and cash accounts
- reconciliation
- trial balance
- P&L / balance sheet / cash-flow projections
- fiscal periods and locking
- audit/export surfaces

India Compliance extends that accounting domain with independently validated rules for:

- GST registrations and places of business
- HSN/SAC tax classification
- CGST/SGST/IGST and place-of-supply evidence
- credit/debit notes
- e-invoice / IRN adapters
- e-way bill adapters
- GSTR reporting/reconciliation
- TDS/TCS where applicable

Do not hard-code filing claims before provider/legal/accounting validation. First milestone is accounting truth + GST-ready transaction evidence, then external compliance adapters.

## Slice C — RINADS Shipping

Keep the existing `ShipmentService` and `CourierAdapter` contract. Replace demo-only execution by adding provider adapters behind the same interface.

Priority adapters:

1. Delhivery
2. Porter
3. Shiprocket
4. Sequel / BVC where client demand justifies it
5. ONDC logistics/open-commerce adapters as a separate channel package

Provider-selection logic must consider serviceability, SLA, price, parcel profile, COD, reverse logistics and tenant policy. Provider webhooks update the canonical shipment timeline; UI code never talks directly to carriers.

## Slice D — Open Commerce / ONDC

ONDC is a channel over canonical commerce/orders/payments/fulfilment, not another order engine.

Planned adapter boundary:

```text
catalogue/order/payment/fulfilment truth
        ↓
open-commerce channel adapter
        ↓
ONDC search/select/init/confirm/status/track/cancel/update
```

Signing, registry, settlement and issue handling require explicit production gates.

## Slice E — Academy + Marketplace

Academy receives a real learning domain (courses, cohorts, enrollments, progress, assessments, evidence, certification, skills). The multi-vendor marketplace is separate from the existing vertical-template marketplace and adds sellers/providers, commissions, settlement, ratings and disputes.

## Release gates

Every slice must preserve:

- green lint/typecheck/tests/build;
- tenant isolation and RLS tests;
- idempotency on external/money/credit side effects;
- audit/event emission for material writes;
- honest UI states when providers are not configured;
- production migration verification before a feature is described as live.
