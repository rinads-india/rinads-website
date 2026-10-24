# RI Platform — Next Build Wave

**Status:** Proposed implementation contract
**Date:** 24 Oct 2026
**Repository:** `rinads-india/rinads-website`
**Scope:** Consolidate RINADS into one multi-tenant intelligence platform without creating another parallel platform, database silo, or provider-specific product fork.

## 1. Product invariant

RINADS is one platform. External vendors are capabilities behind RINADS-owned interfaces.

```text
RINADS TECHNOLOGIES
└── RINADS — Business Simplified
    ├── RINADS OS Kernel
    ├── RINADS INTELLIGENCE — RI
    │   └── RINPO Runtime
    │       └── RINPO
    ├── RI ID
    ├── RINASPACE
    │   └── RINPO Phone
    ├── RI Connector Gateway
    ├── RI Marketplace
    ├── RI Network
    ├── RI Labs
    ├── RINADS Studios
    ├── RINADS Logistics
    ├── Industry Packs
    └── RINADS World (preview / non-launch-critical)
```

### Public naming decision to ratify

- `RI ID` = universal person identity.
- `RINASPACE` = personalised operating environment for a person/organisation/context.
- `RI SPACE` remains a legacy/internal alias until all public UI and docs are migrated.
- `RINPO Phone` = universal cross-device interaction surface, not a separate auth or backend.

This naming change must be applied through master-spec change control before public rollout.

## 2. Identity and tenancy

### 2.1 RI ID

Authentication methods may include Google, Apple, email OTP, mobile OTP, passkeys and enterprise SSO, but all methods resolve to one RI ID.

A single RI ID may hold multiple context memberships:

- Personal
- Student / learner
- Talent / freelancer
- Staff
- Manager
- Business owner
- Partner
- Developer
- Platform admin

Do not create separate identities per product or per organisation.

### 2.2 Tenant boundary

`organization_id` remains the hard data boundary. A RINASPACE is an authorised experience over identity + organisation + workspace + role + entitlement + current context. Personal and employer memories must not be merged implicitly.

### 2.3 Provisioning

New verified RI ID flow:

```text
verify identity
→ create RI ID
→ create personal RINASPACE
→ ask primary intent
→ optional organisation creation / join
→ provision starter pack
→ start RINPO guided setup
→ record first-value event
```

Provisioning must be asynchronous, idempotent, retryable and auditable.

## 3. RINPO Phone

RINPO Phone is the universal interface across `www`, `app`, industry packs, storefronts, partner surfaces and later native clients.

Primary tabs:

1. **Today** — briefings, meetings, attention items, reminders, approvals, exceptions.
2. **Ask** — text/voice/file/camera interaction grounded in authorised RINASPACE context.
3. **Actions** — proposals, workflows, scheduled jobs, approvals, execution history.
4. **Growth** — leads, content, campaigns, social, reputation, analytics, attribution.
5. **Apps** — installed packs, connectors, marketplace capabilities and settings.

RINPO avatar click anywhere in RINADS opens the same authenticated RINPO Phone session.

## 4. RINADS Intelligence and RINPO Runtime

RINPO is the human-facing character. RINPO Runtime is the governed execution layer. Model providers are replaceable.

Canonical action pipeline:

```text
request/event
→ authorised context
→ deterministic policy/rules
→ optional model reasoning via ModelGateway
→ recommendation/proposal
→ authorisation gate
→ typed tool execution
→ audit event
→ memory/evidence update
```

Autonomy policy:

- L0: read only
- L1: recommend
- L2: draft
- L3: execute after approval
- L4: execute automatically only inside explicit, revocable policy boundaries

High-impact actions (payments, payroll, refunds, ad spend, bulk messaging, publishing, destructive changes, sensitive exports) require stronger policy gates.

## 5. RI Connector Gateway

Build one connector plane instead of provider-specific business logic.

```text
RINPO / domain service
→ Capability Registry
→ policy + entitlements + role
→ RI Connector Gateway
→ provider adapter
```

Supported integration forms:

- MCP
- REST
- GraphQL
- OAuth 2.x
- Webhooks
- WebMCP
- UCP / commerce protocols
- server-to-server APIs

### Provider categories

**Models / intelligence**
- OpenAI
- Google Gemini
- Anthropic
- xAI
- local/self-hosted models where appropriate

**Commerce / website**
- Shopify
- Wix
- WordPress / WooCommerce

**Workspace / productivity**
- Google Workspace
- Microsoft 365 later

**Creative**
- Adobe
- Canva
- Runway

**Social / growth**
- Meta / Instagram / Facebook / WhatsApp
- Hootsuite
- YouTube
- LinkedIn where APIs permit
- other providers behind `SocialProvider`

**Logistics**
- Delhivery
- Shiprocket
- Porter
- Sequel
- BVC
- DTDC
- India Post / future adapters

### Rules

1. Provider credentials are never exposed to browsers.
2. Customer-owned services should default to BYO-account / OAuth.
3. Domain code calls RINADS interfaces, never provider SDKs directly.
4. Provider availability is reflected truthfully in the Capability Registry.
5. Every write path is permissioned and audited.

## 6. WhatsApp automation

WhatsApp is a first-class `MessagingProvider`, not a generic unrestricted automation channel.

### Supported workflows

- booking confirmations
- appointment/service reminders
- order and shipment notifications
- payment reminders
- lead follow-up
- opted-in reactivation campaigns
- customer support
- human handoff

### Compliance contract

- store proof of opt-in and message category consent
- honour opt-out immediately
- outside the customer-service window, use approved templates where required
- retain a clear human-escalation path
- do not permit unauthorised bulk messaging
- rate-limit by organisation and campaign
- log template, recipient, consent state, provider message id, delivery state and cost evidence

### RINPO action pattern

```text
RINPO identifies audience
→ filters consent + suppression + policy
→ drafts campaign
→ estimates recipient count + provider cost
→ approval
→ queue
→ provider send
→ delivery/webhook reconciliation
→ attribution
→ audit
```

## 7. RI Credits

RI Credits meter variable-cost operations; subscriptions govern entitlements.

Meterable operations include:

- model calls
- live voice
- Runway/live-character sessions
- media generation
- transcription/OCR
- WhatsApp or messaging provider usage where applicable
- premium external data/research
- automation jobs with measurable third-party cost

Use the existing reserve → provider call → capture/release contract. Add:

1. subscription credit grant worker
2. Razorpay credit top-up
3. balance + usage UI
4. budget alerts and hard caps
5. provider-specific metering adapters
6. organisation-level and user-level spend policies
7. BYOK option for qualified customers

Do not market low-cost tiers as unlimited AI.

## 8. Odoo-inspired segmentation without copying Odoo architecture

RINADS should borrow Odoo's go-to-market segmentation: broad industry catalogue + shared horizontal apps + all-app value proposition. It should not create a separate forked codebase per industry.

### Market hierarchy

```text
Market
→ Industry family
→ Industry
→ Business model
→ Organisation size
→ Role
→ Department
→ Capability need
→ Industry Pack + Capability Packs
```

### Proposed industry families

- Business & Professional Services
- Education & Training
- Health, Wellness & Personal Care
- Retail & eCommerce
- Food & Hospitality
- Automotive & Mobility
- Real Estate, Construction & Home Services
- Manufacturing & Supply Chain
- Logistics & Distribution
- Creative, Media & Marketing
- Finance & Professional Operations
- Community, Nonprofit & Associations

### Initial RINADS packs

- Starter Business
- R GLOW — Salon / Beauty / Wellness
- R AUTO — Automotive
- R LANDSCAPE — Landscape / Nursery
- R RETAIL
- Jewellery
- Agency / Creative Services
- Logistics

Pack composition must be configuration + workflows + defaults + RINPO skills over the same kernel.

## 9. RI Marketplace

One economic catalogue, not separate stores per vertical.

Product types:

- software subscriptions
- industry packs
- capability packs
- integrations/connectors
- usage credits
- managed services
- training / onboarding
- digital products
- talent services
- logistics services

Marketplace orders may generate software provisioning, connector activation, Studios work units, learning entitlements or logistics jobs depending on SKU type.

## 10. RI Network

Do not rebuild Instagram, YouTube, LinkedIn and Upwork as separate clones.

RI Network is the business/economic graph connecting:

- people
- identities
- organisations
- roles
- skills
- portfolios
- products
- services
- content
- opportunities
- work evidence
- reputation
- transactions

Content can originate in RINADS and distribute outward through connectors. External engagement should flow back into CRM/attribution where APIs and consent permit.

## 11. RI Labs and RINPO Tutor

RI Labs is the governed product factory:

```text
Signal → Thesis → Spec → Prototype → Sandbox → Eval → Pilot → Productise → Launch → Scale/Kill
```

Lovable, Figma, AI coding agents and rapid prototypes belong in the Prototype/Sandbox stage. Production truth remains the canonical GitHub monorepo and controlled production infrastructure.

### RINPO Tutor

RINPO Tutor is the learning interface for Academy / RI Labs:

- personalised learning path
- bilingual voice-first support (Malayalam/English first)
- lessons and assessments
- practice tasks in sandbox tenants
- project briefs
- skill evidence
- portfolio generation
- RI Opportunities linkage
- mentor/escalation path

Students and interns must never receive production access by default.

## 12. People operating model

### Founder / platform team

Use RI TOWER / Control Plane for:

- release gates
- health
- tenants
- entitlements
- RI Credits
- provider spend
- connector health
- approvals
- incidents
- audit
- feature flags
- revenue / MRR / churn
- cost-to-serve

### RINADS staff

Role-scoped RINASPACE with department permissions. No shared admin credentials.

### Digital Partners

Partner workspace with customer-scoped delegated access, implementation checklists, commissions/referrals, certification and audit trail.

### RI Labs interns

Sandbox-only by default. Promotion to customer work requires evidence, approval and least-privilege access.

### Clients

Client owns organisation, data and connector authorisations. RINADS access is explicit, revocable and auditable.

## 13. RINADS Studios

RINADS Studios is the managed-service production layer for work that software alone cannot complete.

Possible service lines:

- branding/design
- software implementation
- content/video
- ads/growth
- onboarding/data migration
- automation setup
- consulting
- managed operations

Studios work should be ordered through Marketplace and converted into work units with SLA, assignee, QA, approval and delivery evidence.

## 14. RINADS Logistics

Keep logistics horizontal and provider-neutral.

Core entities:

- shipment
- package
- pickup
- carrier quote
- tracking event
- exception
- POD
- COD settlement
- reverse shipment

RINPO can recommend and book only through authorised LogisticsProvider tools. Provider selection may consider price, serviceability, SLA, weight/size, COD, route and historical performance.

## 15. Infrastructure strategy

### Launch / near-term

Retain Vercel + managed Supabase for production until the launch gate is complete. Do not introduce an infrastructure migration as a launch blocker.

### Hostinger + Coolify

Use as a cost-controlled portable application/worker tier after launch, not as an immediate replacement for every managed service.

Recommended first workloads:

- background workers
- queue consumers
- internal tools
- connector workers
- webhook processors
- scheduled jobs
- MCP gateway replicas
- non-critical previews / staging

Do not initially self-host the primary production database or auth unless backup, HA, observability, patching and restore drills are operationally proven.

### AWS

Use selectively for workloads that benefit from mature managed infrastructure:

- object storage / archival
- CDN or edge distribution where justified
- queues/events
- GPU/compute bursts
- backup copies
- enterprise customer requirements

Avoid duplicating Vercel, Hostinger, Coolify and AWS for the same workload without a documented reason.

### Target hybrid pattern

```text
Cloudflare / DNS / edge controls
        │
        ├── Vercel: customer-facing Next.js surfaces
        ├── Supabase: managed Postgres/Auth/Realtime/Storage (launch)
        ├── Coolify on Hostinger: workers/connectors/internal services
        └── AWS: selective storage/queue/compute/backup services
```

## 16. AI development toolchain

### Codex / ChatGPT

Use for repository implementation, code review, agent/plugin work, MCP integration and controlled multi-step execution. RINADS should publish a portable plugin containing:

- RINADS MCP server connection
- workflow skills
- optional UI surfaces

### Claude Code / Cowork

Use Claude Code for deep repository work with:

- root `CLAUDE.md` for invariants
- skills for release/audit/migration workflows
- subagents for security, dependency and log analysis
- hooks for deterministic checks
- MCP for GitHub, docs and other controlled external tools

Do not place critical safety constraints only in prompts; enforce them in permissions, hooks, server policy and runtime gates.

### Gemini / Google AI Pro

Use Google AI Pro for founder/developer productivity, Gemini app/Deep Research, Gemini Code Assist, Jules, AI Studio and development quotas. Production RINADS model calls must use RINADS-owned API projects behind ModelGateway, not a personal consumer subscription.

### Lovable

Use for prototype and UI validation within RI Labs. Promote accepted work to canonical GitHub after security/tenancy review rather than running multiple permanent production clones.

## 17. Website / commerce creation strategy

RINADS should orchestrate multiple site providers instead of forcing every customer onto one builder.

- Shopify: commerce-first connector/provider
- Wix: site, commerce, bookings and business-solution connector
- WordPress/WooCommerce: content/SEO/commerce connector
- RINADS native storefront: simple provisioned storefront for customers who do not need an external CMS

RINPO can audit requirements and recommend the correct surface based on business model, complexity, ownership, cost and integration needs.

## 18. Requirement audit by RINPO

Every prospect or new organisation can enter through a structured RINPO audit:

1. identity and organisation
2. industry and business model
3. locations
4. team size and departments
5. current tools
6. revenue/transaction model
7. operational pain points
8. required channels
9. data migration sources
10. compliance constraints
11. integrations
12. budget
13. first desired outcome

Output:

```text
Business profile
+ recommended Industry Pack
+ capability packs
+ connectors
+ migration plan
+ onboarding plan
+ automation opportunities
+ risk flags
+ pricing estimate
+ first-value milestone
```

No automatic purchase or high-impact execution is performed solely from the audit.

## 19. Pricing model to test

Do not copy Odoo's per-user-only pricing. Use organisation subscription + included seats/capabilities + usage.

Launch hypotheses:

- RI ID: free
- 7-day trial: free with controlled limits
- START: ₹1,999/month
- GROW: ₹5,999/month
- SCALE: ₹14,999/month
- ENTERPRISE: ₹49,999+/month
- Industry Packs: add-on pricing by vertical/value
- RI Credits: included allowance + top-up
- Studios: setup/project/retainer
- Marketplace: transaction or partner margin where applicable

Validate willingness-to-pay before locking public pricing.

## 20. Implementation waves

### Wave 0 — Canon and release truth

- ratify `RINASPACE` public naming
- reconcile master spec
- keep `organization_id` tenant boundary
- complete production migration ledger
- close security blockers
- fix root-domain verification

### Wave 1 — Identity and first value

- RI ID
- auth methods
- personal RINASPACE
- organisation create/join
- entitlements/trial grants
- async provisioning
- first-value telemetry

### Wave 2 — RINPO Phone production shell

- real Today
- Ask grounded in authorised context
- approvals/actions
- Growth shell
- Apps/connector registry
- voice toggle
- memory/permissions/settings

### Wave 3 — RI Connector Gateway

- OAuth connection registry
- MCP client layer
- webhook/event ingestion
- provider health
- connector scopes
- audit

Priority connectors:
1. Google Workspace
2. WhatsApp
3. Shopify
4. Wix
5. WordPress
6. logistics providers
7. Hootsuite/social

### Wave 4 — RI Credits

- subscription grants
- purchase/top-up
- provider metering
- dashboards
- budgets
- BYOK

### Wave 5 — Industry packs

- R GLOW production gate
- Starter Business
- then Automotive, Landscape, Retail, Jewellery, Logistics based on customer demand and reusable kernel maturity

### Wave 6 — RI Marketplace + Studios + Partner

- catalogue
- orders
- service work units
- digital partner programme
- partner permissions
- commissions/referrals

### Wave 7 — RI Labs + Academy + Opportunities

- RINPO Tutor
- sandbox tenants
- skills/evidence
- internships
- opportunities
- certification

### Wave 8 — RI Network

- profiles
- business pages
- proof/portfolio
- opportunities
- follows/relationships
- content distribution
- reputation

### Wave 9 — RINADS World

World consumes the same RI ID, Business Graph, Commerce, Marketplace and RINPO Runtime. It must not create a second identity, product catalogue or transaction system.

## 21. Non-goals

Do not:

- create another all-in-one parallel repo
- create a database per customer by default
- build provider SDK dependencies directly into domain logic
- clone Instagram/LinkedIn/Upwork/Shopify/Odoo feature-for-feature
- claim unrestricted autonomous execution
- migrate production infrastructure during launch hardening without a separate gate
- allow personal AI subscriptions to become hidden production dependencies
- allow intern/partner access outside explicit scoped permissions

## 22. Success metrics

Platform:
- signup → RINASPACE activation
- activation → first value
- trial → paid conversion
- tenant provisioning success rate
- connector success/error rate
- RINPO proposal → approved execution rate
- automation failure rate
- support tickets per active organisation

Economics:
- MRR
- gross margin
- infrastructure cost / tenant
- AI/provider cost / tenant
- RI Credit margin
- Studios gross margin
- CAC payback
- churn

Trust:
- cross-tenant incidents: zero
- unauthorised write actions: zero
- audited high-impact actions: 100%
- restore-test pass rate

---

**Implementation principle:** Build the narrowest reliable end-to-end loop first: `RI ID → RINASPACE → RINPO → authorised action → audit → first value`. Every additional industry, connector, marketplace category and World experience extends that same loop.