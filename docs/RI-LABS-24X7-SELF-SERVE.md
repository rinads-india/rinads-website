# RI LABS + RUN BUSINESS 24/7

Status: implementation foundation

## Objective

Turn RINADS into a global self-serve multi-tenant business platform where customers can discover, purchase, provision, operate and grow digital products and services without manual RINADS setup for the normal path.

RI LABS is the governed product factory that turns signals and knowledge into reusable capabilities. RUN BUSINESS 24/7 is the operating model that applies those capabilities continuously across SELL, DELIVER, RUN, GROW and SUPPORT loops.

## Architectural rule

Do not create a second platform beside the existing RINADS control plane. Extend the existing tenancy, identity, billing, provisioning, capability registry, RINADS Intelligence, RINPO Runtime, Work Graph and audit foundations.

## RI LABS lifecycle

Signal -> Thesis -> Spec -> Sandbox -> Eval -> Pilot -> Productize -> Launch -> Scale / Kill

A stage may only advance when its evidence gate passes. Experiments must remain tenant-bound, permission-bound and reversible until launch.

### Modules

1. Signals — customer, market and operating observations.
2. Knowledge — research and evidence converted into capability hypotheses.
3. Product Lab — reusable products, services and Industry Pack capabilities.
4. Automation Lab — workflow and policy experiments.
5. Agent Eval — RINPO task success, safety, tool use and cost evaluation.
6. Tenant Sandbox — tenancy, entitlement, isolation and provisioning validation.
7. Launch Gate — security, reliability, economics and rollback requirements.
8. Scale / Kill — scale validated bets; stop failing bets.

## Global product catalog

Every sellable item should resolve to one catalog contract rather than a bespoke checkout flow.

Supported product classes:

- software_subscription
- industry_pack
- capability_pack
- digital_product
- managed_service
- training
- integration
- usage_credit

Each catalog item declares:

- stable product key
- product type
- regional availability
- supported currencies/payment providers
- capabilities and entitlements
- plan/usage limits
- provisioning template, if required
- recurring vs one-time billing
- first-value event
- cancellation/suspension behavior
- support policy

The server-side catalog is the trusted source of capabilities, entitlements, quotas and provisioning templates. Payment-provider metadata contains stable identifiers only and must never be trusted as a source of privileges.

## Global self-serve activation state machine

Discover -> Identity -> Tenant reserve -> Payment pending -> Paid -> Entitled -> Provisioning -> Pack installed -> First value -> Active

Failure paths are explicit: Blocked, Failed, Suspended.

### Security invariant

Browser-side payment success must never provision a production tenant. Provisioning begins only after a verified server-side billing event has created an active entitlement. Provisioning jobs must be idempotent and tenant-scoped.

Blocked or failed recovery must not jump directly to Entitled or Provisioning. Recovery re-enters the pre-entitlement commercial path so the verified payment -> entitlement gate is crossed again.

### Catalog activation gate

`@rinads/billing` defines a provider-neutral activation contract for server-verified commercial signals. It supports Razorpay/Stripe normalization, one-time/subscription billing modes, policy-approved currencies and stable product/offer/catalog-version identifiers. The signal is compared against trusted catalog policy before activation can proceed.

Provider adapters remain responsible for webhook signature verification and provider-event deduplication before emitting the normalized signal.

### Idempotency

Use stable idempotency keys for:

- purchase intent
- payment/provider event
- subscription mirror
- entitlement grant
- provisioning job
- pack installation
- connector installation
- first-value event

Repeated provider events or worker retries must not duplicate tenants, subscriptions, catalog installs or customer data.

## Tenant model

Normal SMB path:

- shared RINADS control plane
- organization_id on tenant-owned operational records
- strict row-level authorization
- tenant-aware service adapters
- per-tenant entitlements, limits and audit events

Enterprise isolation may later support dedicated infrastructure as a separate tier without changing the catalog or activation contract.

## RUN BUSINESS 24/7 loops

### SELL

Demand discovery -> lead capture -> qualification -> proposal/quote -> checkout -> payment -> conversion attribution.

### DELIVER

Tenant/product provisioning -> workflow fulfillment -> order/service delivery -> customer communication -> exception handling.

### RUN

Work -> people -> finance -> approvals -> compliance -> business health -> incident response.

### GROW

Retention -> re-engagement -> upsell -> cross-sell -> content/SEO -> campaigns -> conversion improvement.

### SUPPORT

Identity/context resolution -> answer/action -> verification -> escalation -> closure -> learning signal.

## RINADS Intelligence and RINPO

RINPO is the conversational interface. RINADS Intelligence performs governed reasoning. RINPO Runtime executes approved capabilities.

Autonomy levels:

- L0 Observe only
- L1 Recommend
- L2 Prepare/draft
- L3 Execute after approval
- L4 Execute automatically inside explicit policy limits

High-risk financial, compliance, destructive, refund, budget and privilege-changing actions must not default to L4.

## Capability + entitlement model

Catalog item -> Entitlement manifest -> Capability Registry -> Tenant policy -> Runtime execution.

Example:

`growth-pro` may grant `crm.lead.create`, `marketing.campaign.draft`, `seo.audit.run`, `communication.followup.schedule` plus monthly usage limits.

The runtime must check both entitlement and policy before execution.

## First-value model

Registration is not activation.

Each product declares a first-value event, for example:

- Salon OS: first appointment + first invoice
- Commerce: first published product + first paid order
- Logistics: first booked shipment
- Growth: first attributable qualified lead
- Digital product: first successful access/download/use

`@rinads/platform` now includes a deterministic first-value evaluator with tenant scope, definition versioning, required evidence properties and idempotency keys. Persistence must enforce uniqueness for those keys within tenant scope.

Track payment-to-tenant-ready and payment-to-first-value separately.

## Reliability / 24x7 requirements

- durable provisioning and runtime jobs
- retry policy with bounded backoff
- dead-letter/error state with operator visibility
- idempotent workers
- structured audit events
- health endpoints and provider health checks
- usage/cost budgets per tenant
- circuit breakers for failing external integrations
- human escalation for policy or confidence failures
- rollback or suspension path for every automated deployment/install

## Key metrics

- visitor -> signup conversion
- signup -> paid conversion
- paid -> tenant-ready p50/p95
- paid -> first-value p50/p95
- self-serve activation rate
- provisioning failure rate
- manual touches per activated tenant
- RINPO task success rate
- autonomous action success / rollback rate
- AI cost per active tenant
- gross margin by product
- net revenue retention
- support contacts per active tenant

## Build order

1. Lock catalog + entitlement schema.
2. Generalize billing activation away from product-specific vertical assumptions.
3. Make provisioning jobs durable, idempotent and observable for all catalog products.
4. Add first-value events and activation analytics.
5. Connect RI LABS launch gates to Capability Registry releases.
6. Add tenant policy/autonomy configuration.
7. Add global provider/currency adapters behind the existing billing abstraction.
8. Productize repeatable services so they enter the same catalog and fulfillment engine.
9. Add Scale/Kill economics to RI LABS.
10. Add enterprise isolation only after the shared multi-tenant path is reliable.

## Implementation status — PR #211

Implemented in the current branch:

- RI LABS module/lifecycle contract
- SELL / DELIVER / RUN / GROW / SUPPORT 24x7 operating loops
- L0-L4 governed autonomy contract
- global catalog item type contract
- self-serve activation state machine
- security recovery bypass fix plus regression coverage
- provider-neutral catalog payment activation contract
- first-value definition/event evaluator
- upgraded RI LABS operator UI

Still required before production self-serve activation:

- persistent global catalog offers and entitlement manifests
- generic webhook-to-catalog activation wiring
- durable activation event/idempotency persistence
- retry/dead-letter orchestration across activation steps
- first-value event persistence and activation dashboards
- tenant-configurable autonomy policies and cost ceilings
- capability publication bound to RI LABS release gates

## Release gates

No product is globally self-serve until all of the following pass:

- verified server-side billing event
- entitlement correctness
- tenant RLS/isolation tests
- idempotent provisioning retry test
- first-value telemetry
- cancellation/suspension behavior
- abuse/rate-limit controls
- support/escalation path
- auditability
- cost ceiling / unit-economics threshold
- rollback test

## Non-goals

- duplicating the existing RINADS control plane
- creating a separate database per SMB tenant by default
- allowing an LLM to bypass permissions or billing
- marking signup as successful activation
- automating unrestricted spend, refunds, tax changes or destructive operations
- launching every Industry Pack before the core self-serve path is reliable
