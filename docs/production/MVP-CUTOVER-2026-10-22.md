# RINADS production MVP cutover — 2026-10-22

This file is an execution gate, not marketing copy.

## Production code surfaces

The canonical monorepo now contains production-MVP contracts/surfaces for:

- RINASPACE tenancy-aware capability registry;
- RINADS Communication provider-neutral contracts;
- R GLOW public product front door and protected operator console;
- Work Graph governance and evidence-backed `RINADS Verified` rules;
- RINADS LABS scoped learner/intern execution surface;
- Growth Engine lead normalization, consent/suppression and approval-gated funnel rules;
- RINADS STUDIOS rights, QA, human-approval and publishing-handoff rules;
- R GLOW Razorpay activation-event contract that accepts only server-verified `payment.captured` / `order.paid` semantics.

## Hard production gates

### R GLOW Supabase

The known RINGLOW Supabase project (`wqhhhouzattipxjarlji`) was observed as **INACTIVE** on 2026-10-22. A restore attempt was refused because the account/organization was at the active free-tier project limit.

Until this project is restored/upgraded, or production is deliberately migrated to a verified canonical database, do not claim:

- live salon tenant provisioning;
- production salon RLS verification;
- live onboarding persistence;
- production payment-to-tenant activation.

Never point R GLOW at `rinads-one-dev` merely because it is healthy: inspection showed that project does not expose the canonical RINADS organization/salon/billing/provisioning tables.

### Razorpay recurring subscriptions

`createRazorpaySubscription()` in the current billing provider is a placeholder and must not be exposed as a live subscription implementation.

The production-capable billing primitive currently available is the real Razorpay Orders API path. R GLOW activation must therefore remain one-time activation/order semantics until the recurring Plans + Subscriptions API is implemented and verified with real provider IDs, signed webhooks and sandbox/live evidence.

A browser checkout success callback is never sufficient to activate a tenant. Activation authority is a signature-verified server webhook plus idempotent billing/provisioning state.

## Required R GLOW activation sequence

1. User has a verified RINADS identity.
2. Server creates a purchase intent with immutable organization/plan/vertical metadata.
3. Server creates a real Razorpay order; amount is resolved server-side.
4. Browser completes Razorpay Checkout.
5. Signed Razorpay webhook reaches a server-only endpoint.
6. Webhook idempotency is recorded.
7. `payment.captured` or `order.paid` passes the R GLOW activation contract.
8. Subscription/entitlement becomes active.
9. `tenant_provisioning_jobs` receives an idempotent `salon-os` job.
10. Provisioning worker seeds the tenant.
11. Welcome email / WhatsApp is queued through the canonical Communication + Runtime outbox layer.
12. RINPO onboarding begins after provisioning readiness is confirmed.

## Governance invariants

- UI visibility is not authorization; RLS and server-side permission checks remain authoritative.
- RINPO can recommend, decompose and draft; it cannot bypass approval or invent evidence.
- `RINADS Verified` requires a real approved work unit with evidence, approver and timestamp.
- Growth outreach is blocked for suppressed or non-consenting contacts.
- RINADS STUDIOS publishing is blocked without rights coverage, QA and named human approval.
- Provider credentials alone never imply a provider integration is production verified.

## Go-live definition

A surface may be called **production live** only when its backing infrastructure and end-to-end evidence are green. Code deployed behind an unavailable database/provider remains **production code ready / fail-closed**, not operationally live.
