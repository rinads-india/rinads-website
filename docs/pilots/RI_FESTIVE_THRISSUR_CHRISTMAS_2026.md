# RI FESTIVE × RINADS WORLD — Thrissur Christmas 2026 pilot contract
Date: 9 November 2026
Status: PROPOSAL / NON-PRODUCTION
Owner: RINADS product + platform engineering
Tracked work: https://github.com/rinads-india/rinads-website/issues/279
Spatial companion: https://github.com/rinads-india/RinadsWorld/issues/39

## Executive decision
Deliver a reusable, multi-tenant hyperlocal commerce vertical slice before attempting a general-purpose virtual Kerala or an owned-inventory quick-commerce operation. The experience begins with Christmas stars, bakery products, gifts and local shopping in Thrissur. Unity 3D is an optional discovery surface; ordinary web/mobile commerce must work without Unity.

Release 1 (14 Nov 2026): honest DEMO/waitlist, no unverified transactions.
Release 2 (Christmas period): supervised real-order pilot only when founder-approved end-to-end payment, RLS, fulfilment, legal and merchant rights gates pass.
Do not publish v0.19 spatial commerce, merge blocked PRs or enable paid flags based on this document.

## Boundary and reuse
- Canonical platform: rinads-india/rinads-website (existing Next.js apps, tenancy, auth, commerce, operations, intelligence, RINPO, customer portal).
- Spatial runtime: rinads-india/RinadsWorld (existing Unity 6000.6.3f1 project, DLS5/typed intents, WebGL).
- World bridge: packages/world-contract; existing platform World Integration Guide; do not duplicate message protocols.
- Source of truth for SKU, price, tax, stock, merchant permissions, orders, payment, refunds and shipment: authenticated platform domain services backed by the intended authorized production database. Never Unity, browser local state or LLM output.
- One RI ID and canonical merchant/business graph identity. Cross-business records require tenant and permission validation on every sensitive operation.
- RINPO Runtime can propose and orchestrate; consequential actions must be authorized, verified and audited.
- Do not switch to an unrelated Supabase instance because the intended project is inaccessible through a connector.
- Use real merchant logos/images/locations only with documented permission and asset rights; otherwise show clearly fictional demo fixtures.
- Preserve website and WORLD production aliases until explicit acceptance.

## Pilot product boundaries
Product surfaces:
1. Instant: 2D shop/catalogue/search/checkout in standard browser; works on low-end mobile.
2. Explore: lightweight location browser, merchant cards and distance/serviceability indications.
3. Immersive: optional Unity zone, RINPO conversation, original star display, preview and trusted store handoff.

Product categories for Phase 1: Christmas stars, lights, decorations, gifts, cakes, bakery; avoid perishable grocery expansion until cancellation/cold-chain and delivery rules are proven. Courses and local service booking are distinct future vertical modules that reuse identity, commerce and authorization but have their own fulfillment logic.

## Pilot journey and data contract
1. Customer enters Thrissur pilot and optionally selects an area/pincode (request location only with consent).
2. Public search returns APPROVED/MERCHANT_VISIBLE products only.
3. Item view references canonical product_id and organization_id; World object carries an opaque entity ID, not arbitrary database references or secrets.
4. Availability is server-computed from verified inventory, fulfillment window and coverage; UNKNOWN means unavailable, not an estimated promise.
5. Server quote revalidates product, quantity, price, stock, merchant policy, address serviceability, shipping, GST and discounts.
6. Checkout creates a pending order only after idempotent validation, then payment occurs through the trusted provider.
7. Signed webhook and a durable reconciliation job establish payment truth; UI response alone never marks order paid.
8. Merchant staff accept/reject with explicit inventory and cancellation rules; fulfillment provider supplies delivery tracking/POD, or supervised merchant delivery is used.
9. Customer sees server-derived timeline and accessible support/refund route.
10. Events report funnel progress without exposing customer private data.

Canonical data requirements (reuse/migrate existing services, do not blindly add duplicate tables):
- merchants: organization_id, approved_public_profile, branch_id, consent_scope, service_polygon/postcodes, hours, contact_visibility.
- products: id, organization_id, canonical_real_sku, variants, public_name, rights_approved_media, price_currency INR, status, revision, updated_at.
- stock: variant/location and reserved/available quantities, reservation_expiry, immutable ledger/audit.
- serviceability: location/postcode, dispatch_mode, cutoff, estimated window, capacity state, fee and fallback reason.
- order: idempotency key, customer and merchant, immutable priced lines, status, amount/currency, payment reference, shipping decision, timestamps and revision.
- fulfillment: accepted_by, dispatch_assignment, pickup, delivery proof, exception, return/refund status.
- world mapping: entity_id, place_id, approved_manifest_id, asset_rights_ref and non-sensitive storefront URL.

## Proposed service endpoints (names tentative; conform to existing route conventions)
- GET marketplace/catalogue?area=...&category=... — allow-listed publicly publishable fields only.
- GET marketplace/catalogue/:id — approved product projection; no private merchant metadata.
- POST commerce/quote — authenticated/guest-safe server quote with stock, tax and serviceability validation.
- POST commerce/checkout — idempotent server-authoritative order intent; existing payment implementation only.
- GET commerce/orders/:id — authorized customer/merchant view with role filtering.
- POST logistics/dispatch/request — server action after verified merchant acceptance, governed by routing policy.
- GET world/merchant-projection/:entityId — signed/allow-listed read model for approved merchant public data; no Unity direct DB access.

All path naming, database additions and API implementations must be reviewed against current repository ownership. Do NOT automatically implement these endpoints where an equivalent already exists.

## Feature switches
- festive_demo_enabled: may enable only an unmistakable demo fixture and no real-money operations.
- festive_merchant_listing_enabled: must depend on consent, approved merchant profile and owner review.
- festive_paid_checkout_enabled: DEFAULT OFF and server-rejected unless verified billing, stock, legal and fulfillment gates pass.
- world_festive_scene_enabled: DEFAULT OFF publicly until valid tested WebGL build and rights.
- world_festive_commerce_handoff_enabled: DEFAULT OFF until trusted 2D checkout is verified.

A front-end feature flag must never be the only security control. Missing flag/tenant/entitlement/merchant profile = DENY.

## End-to-end release scenarios
Happy path: guest discovery -> opt-in login/address -> quote -> payment test mode -> signed webhook -> reservation commit -> merchant accepts -> dispatch -> POD -> customer confirmed.
Negative paths: missing approved SKU; stock becomes 0 between view and place; invalid postcode; abusive retry; duplicate checkout; out-of-order/duplicate webhook; payment captured but merchant rejects; rider unavailable; partial fulfilment; return/refund; expired reserved stock; no tenant membership; cross-tenant query; expired user session; declined payment; unsupported iPhone WebGL.
Payment tests must reconcile provider-side amounts and currencies. Order states must never be rewritten solely by client messages.

## RINPO and world behavior
WORLD may emit typed events (world:entity:selected, world:transaction:intent) from canonical IDs. The web platform resolves tenant-safe product projections and can open a trusted checkout after explicit user action. RINPO provides bilingual descriptive assistance; it may not create phantom stock, present fake delivery promises, or confirm merchant booking without server evidence. On mobile WebGL failure, a link to the 2D listing must remain usable.

## Timetable (proposed; gates outrank dates)
- 9–11 Nov: inventory of existing code, scope one demo shop, mock catalog tests, rights verification, merchant interest workflow, architecture review.
- 12 Nov: CI + demo smoke + accessibility + responsive testing in isolated preview. Capture exact commit SHA, build and payload.
- 13 Nov: release freeze, founder review, verify unchanged production.
- 14 Nov: only a demonstrable showcase/waitlist, truthfully labelled DEMO.
- 15 Nov–10 Dec: onboard 5–10 merchants and 100–300 approved SKUs; integrate server quote and test-mode payment, handoff and delivery operations.
- 11–20 Dec: supervised real-order dry runs, support/refund checks, economics and customer experience QA.
- 21–25 Dec: optional limited public pilot after signed GO criteria; otherwise remain interest-only.

## Financial and KPI gates
Merchant-held inventory; no dark stores. Track GMV separately from recognized platform revenue. Track contribution/order = commission + delivery gross contribution + attributed ads/subscription allocation - gateway fees - incentives - failures/refunds/support variable cost. Beware subscription/advertising allocation double counting.

Initial validation targets (not actual data): 5–10 verified merchants, 100–300 eligible SKUs, 1–2 zones, first 3–10 supervised delivered orders. For any expansion, require >95% stock accuracy on spot checks, zero unacknowledged successful charges, explicit order-dispute workflow and repeatable contribution reporting. These targets should be adjusted after real operating data.
Dashboard: merchant activation, eligible SKUs, sessions, item-to-checkout conversion, paid orders, fulfilled orders, delivery completion, on-time deliveries, refunds, support time, CM/order, 7-day repeat buyers, 3D-to-2D handoff and device crash/load metrics.

## Non-negotiable blockers and linked evidence
- Main platform launch: https://github.com/rinads-india/rinads-website/issues/254
- Golden path and tenant safety: https://github.com/rinads-india/rinads-website/issues/239
- World v0.19 release gate: https://github.com/rinads-india/RinadsWorld/issues/34
- Unity activation: https://github.com/rinads-india/RinadsWorld/issues/35
- Spatial commerce source PR (not approved): https://github.com/rinads-india/RinadsWorld/pull/32
- Field rights and merchant consent: https://github.com/rinads-india/rinads-website/issues/93
- World isolated demo scope: https://github.com/rinads-india/rinads-website/issues/94

## Workstream ownership and expected deliverables
Platform engineer: current-code inventory, server quote/payment/tenant guards, test evidence, reviewed PR.
Unity engineer: rights-safe demo scene, typed handoff, real WebGL compile, optimized payload and device report.
Product/merchant lead: merchant consent, catalogue rights, inventory and cancellation playbook.
Delivery lead: service zones, provider terms, rider economics, exceptions and proof-of-delivery.
QA/security: dual tenant, webhook, mobile browser, privacy, rollback.
Founder: pricing, budget cap, legal/commercial signoff and GO/NO-GO.

## Completion definition
A feature is not complete because a route renders, a script compiles, a placeholder SKU appears, or Vercel says READY. Completion requires test-backed, authorized, observable evidence from the actual deployment and correct target environment. Any missing evidence means DEMO/WAITLIST only.
