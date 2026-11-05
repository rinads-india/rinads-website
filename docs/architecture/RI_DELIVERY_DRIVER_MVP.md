# RI DELIVERY — Driver Network MVP (feature review)

**Status:** Prototype / draft PR. **Not production-ready.**
**Canonical platform:** RINADS monorepo; no separate repo, service, or production database.
**Owner experience:** protected owner portal route \`/ri-delivery\`, currently preview only.

## Why this work exists
RINADS needs a reusable logistics capability for three relationships:
- **Client-employed rider:** the business is the employer and operates its own vehicle/shift.
- **RINADS-managed rider:** RINADS supplies operational capacity under an approved services contract.
- **Independent rider:** opted-in verified partner who sees the price before accepting or declining.

All use **RI ID** and **RINPO Runtime** when authenticated APIs and persistence are introduced. A driver may lawfully work for multiple businesses, but per-job access must be tenant- and consent-scoped.

## This PR deliberately implements only:
1. Side-effect-free driver eligibility and ranked candidate recommendations.
2. Strict offer, accept, decline, pickup, delivery-proof, exception and cancellation transitions.
3. Version and event-key fields to support future optimistic concurrency and idempotency.
4. Finance-only *proposal* of a payout after delivered + proof. Never pays anyone.
5. Tests covering tenant boundaries, rider eligibility, permission checks, stale events and settlement guards.
6. A static owner-portal **preview** explaining which functionality remains blocked.

## Platform architecture constraints
- Adopt the existing \`packages/operations\` shipping domain; export through existing package \`src/index.ts\`.
- Use existing shared Runtime and authentication; do not build a competing AI dispatcher.
- The **tenant boundary is \`organization_id\`**, resolved server-side from validated RI ID and memberships. Never trust a browser-provided organization ID, role or approved price.
- Persist every real transition atomically with a unique event ID, server-owned versions, tenant RLS and immutable audit trail.
- Offer creation must recheck merchant acceptance, active insured driver, driver association/opt-in and fare cap on the server.
- A candidate recommendation is not authority to dispatch. The domain function currently returns \`requiresHumanApproval: true\`.
- An unauthorised or expired location-tracking session must never expose driver GPS coordinates.
- n8n remains internal only; customer workflows and credentials cannot be moved into n8n.

## Required future migration (NOT included / NOT applied)
The production schema needs tenant-scoped relations for jobs, offers, driver-merchant links, vehicles, status events, proof references, payout proposals, disputes and settlements. Every tenant-owned row must include \`organization_id\`; private identity documents must stay outside tenant-exposed tables. Use existing RLS helpers and review privileges before deployment. In addition to member permissions, freelancer job access must be scoped to the specific accepted job and revoked at completion.

Cross-tenant read/write denial, reassigned-vehicle checks, stale acceptance, concurrent offer acceptance, retry+dedupe, signed POD and payout reversal tests are release blockers.

## Required server endpoints (not yet implemented)
- GET /api/ri-delivery/jobs — authorised merchant's jobs only
- POST /api/ri-delivery/jobs/:id/offer — checked by a trusted merchant dispatcher
- POST /api/ri-delivery/offers/:id/accept and /decline — authenticated driver scoped to their offer
- POST /api/ri-delivery/jobs/:id/pickup and /deliver — proof-backed transitions, no client-originated payment truth
- GET /api/ri-delivery/drivers/me/earnings — verified, role-limited ledger
- POST /api/ri-delivery/settlements/:id/review — finance review; real transfer disabled

Every write needs approved caller identity, permitted org/job, expected version, unique idempotency key and durable audit.

## RINPO governed autonomy
- **L0** Observe status and honest metrics.
- **L1** Recommend eligible, appropriately insured riders.
- **L2** Reoffer in approved bounds only *after* durable persistence, driver consent, merchant rules and approved communications.
- **L3** Escalate failed delivery, damage, payout override, missing proof to a human.
- **L4** External finance transfers remain disabled in the MVP.

No LLM is needed for deterministic matching. AI may explain exceptions, never fabricate identity, cost or payment confirmation.

## Cake Farm acceptance plan
Verify exact *delivery* count (40 daily *orders* is not 40 deliveries), vehicle permissions, first rider and standby rider, accepted job rate card, actual drop radius, overnight orders, handoff and POD. For at least seven days, record completed jobs, on-time rate, damaged goods, exceptions, net merchant charge, rider payout, and marginal cost. No marketing claims about automated dispatch before production validation.

## Pricing (planning assumptions, not accepted contracts)
- Existing Cake Farm proposed SaaS fee: ₹4,900/month.
- New RI BUSINESS Growth listed price: ₹4,999/month + setup.
- Driver payout and merchant delivery invoice are separate; never conflate gross billing with earned RINADS margin.
- Independent rider: no daily minimum and no punitive declines unless a separately agreed availability contract applies.
- Insurance, worker classification, labour duties, GST and platform welfare obligations need professional review.

## Required verification and release gate
- \`pnpm --filter @rinads/operations typecheck\`
- \`pnpm --filter @rinads/operations test\`
- \`pnpm --filter @rinads/owner-portal typecheck\`
- \`pnpm --filter @rinads/owner-portal build\`
- RLS isolation tests, mobile device checks and approved provider integration tests before any real delivery.
- GitHub checks green, owner review, production approvals. **Do not auto-merge or auto-deploy this PR.**

This proposal does not add a deployed driver application, customer WhatsApp notifications, real accounts, payment processing, GPS collection, or activated dispatch.
