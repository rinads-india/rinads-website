# RINADS production MVP cutover — 2026-10-22

This file is an execution gate, not marketing copy.

## Production code surfaces

The canonical monorepo contains production-MVP contracts/surfaces for:

- RINASPACE tenancy-aware capability registry;
- RINADS Communication provider-neutral contracts;
- R GLOW public product front door and protected operator console;
- Work Graph governance and evidence-backed `RINADS Verified` rules;
- RINADS LABS scoped learner/intern execution surface;
- Growth Engine lead normalization, consent/suppression and approval-gated funnel rules;
- RINADS STUDIOS rights, QA, human-approval and publishing-handoff rules;
- one-time Razorpay Orders checkout with signed-webhook activation gates;
- recurring Razorpay Customer + Subscription API contracts and an owner-only checkout surface;
- webhook-authoritative subscription lifecycle reconciliation with entitlement fail-close behavior.

## Hard production gates

### R GLOW Supabase

The known RINGLOW Supabase project (`wqhhhouzattipxjarlji`) was observed as **INACTIVE** on 2026-10-22. A restore attempt was refused because the account/organization was at the active project limit.

`rinads-one-dev` (`zfteukmrxdlmngvfxgpl`) is **ACTIVE_HEALTHY** but is not an expendable slot: current logs show service-role traffic and recent writes to RINADS workflow/task tables. Do not pause it merely to free a project slot.

Until RINGLOW is restored/upgraded, or production is deliberately migrated to a verified canonical database, do not claim:

- live salon tenant provisioning;
- production salon RLS verification;
- live onboarding persistence;
- production payment-to-salon-tenant activation.

### Razorpay recurring subscriptions

The synthetic `sub_*` and `cust_*` billing stubs have been removed from the recurring implementation. The billing provider now uses Razorpay's real server APIs for customers and subscriptions, returns the provider subscription ID and customer authorization `short_url`, and fails closed on provider/configuration errors.

Recurring checkout remains operationally disabled until each deploy environment has:

- live/test `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as appropriate;
- `RAZORPAY_WEBHOOK_SECRET` configured on the webhook receiver;
- explicit server-only Razorpay plan mappings for Starter/Growth/Platform;
- a billing-cycle count for each enabled plan;
- corresponding Razorpay webhook events enabled and pointed at the platform-admin webhook endpoint.

A browser redirect or authorization result is never sufficient to grant a paid plan. Plan entitlements are derived only from `organization_subscriptions.status = 'active'`, populated through signature-verified webhook reconciliation.

`authenticated` / `created` do not grant active plan entitlements. `pending`, `halted`, and `paused` fail closed; `cancelled` / `completed` remove paid entitlement.

## Required recurring billing sequence

1. User has a verified RINADS identity and active organization membership.
2. Owner/founder/admin chooses a server-configured plan.
3. Server resolves the Razorpay Plan ID and cycle count from environment configuration.
4. Server creates a real Razorpay Subscription with immutable `organization_id` + `plan_key` notes.
5. Customer completes authorization through Razorpay's returned `short_url`.
6. Signed Razorpay webhook reaches the platform-admin server endpoint.
7. Webhook signature and deterministic/event-header idempotency are verified.
8. First webhook resolves organization and plan from signed subscription notes; later events may use the local provider-subscription mapping.
9. `billing_subscriptions` preserves the provider lifecycle state.
10. `organization_subscriptions` receives the restricted entitlement lifecycle state.
11. Only `active` exposes the paid plan baseline to RINASPACE/storefront tenancy.
12. R GLOW payment-to-new-tenant provisioning remains separately gated on canonical RINGLOW database readiness.

## R GLOW new-tenant activation sequence

1. User has a verified RINADS identity.
2. Server creates a provisional business/purchase intent with immutable organization/plan/vertical metadata.
3. Server starts a real checkout/subscription from trusted server-side plan data.
4. Signed provider webhook becomes activation authority.
5. Billing event is reconciled idempotently.
6. Paid entitlement becomes active only from the provider's active state.
7. `tenant_provisioning_jobs` receives an idempotent `salon-os` job.
8. Provisioning worker seeds the tenant.
9. Welcome email / WhatsApp is queued through the canonical Communication + Runtime outbox layer.
10. RINPO onboarding begins after provisioning readiness is confirmed.

## Governance invariants

- UI visibility is not authorization; RLS and server-side permission checks remain authoritative.
- Missing/unknown subscription state fails closed rather than inheriting a paid-plan default.
- RINPO can recommend, decompose and draft; it cannot bypass approval or invent evidence.
- `RINADS Verified` requires a real approved work unit with evidence, approver and timestamp.
- Growth outreach is blocked for suppressed or non-consenting contacts.
- RINADS STUDIOS publishing is blocked without rights coverage, QA and named human approval.
- Provider credentials alone never imply a provider integration is production verified.

## Go-live definition

A surface may be called **production live** only when its backing infrastructure and end-to-end evidence are green. Code deployed behind an unavailable database/provider remains **production code ready / fail-closed**, not operationally live.
