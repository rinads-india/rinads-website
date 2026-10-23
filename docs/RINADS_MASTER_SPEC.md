# RINADS MASTER SPEC

**Status:** FROZEN v1.0 — 23 October 2026
**Owner:** Andrino TD, Founder, RINADS TECHNOLOGIES (Thrissur, Kerala)
**Applies to:** Claude Project, Claude Code, Cursor, Cowork, and every human or AI contributor.
**Canonical repo:** `rinads-india/rinads-website` · branch `main`
**Launch gate:** 14 November 2026

> This document is the constitution of the RINADS platform. Where any other document, prompt, ADR or code comment conflicts with it, this document wins until changed through §20 Change Control. AI coding agents must not invent architecture that contradicts it.

---

## 0. Frozen decisions (23 Oct 2026)

| # | Decision | Applies until |
|---|---|---|
| D1 | **Production hosting for launch stays on existing Vercel + Supabase.** Coolify + Hostinger VPS is the post-launch target (Stage A, §14). No infrastructure migration before 14 Nov. | Post-launch review, Jan 2027 |
| D2 | **Temporal is the intended durable-workflow engine but is NOT introduced before launch.** Launch uses the existing job/queue mechanism, made idempotent and retryable (§9). Workflow code must sit behind a `WorkflowRunner` interface so Temporal can replace it. | Post-launch |
| D3 | **n8n is internal-only.** It may run RINADS's own operations and integration prototypes. It must never host customer workflows or customer credentials, and must never be exposed in customer UI. Customer automation uses the native RINADS rule/trigger engine. | Until a commercial n8n licence is deliberately purchased |
| D4 | **RINADS WORLD / RI RINAVERSE are out of launch scope.** Shown only as PREVIEW in Explore Demo. No World work may block the launch gate. | Release G |
| D5 | **Launch Industry Packs are limited to what passes end-to-end tests.** Target: `starter-business` (required) and R GLOW (only if §15 gate passes). All others display PLANNED or PREVIEW. | Per-pack release gates |
| D6 | **Tenant boundary is `organization_id`.** Workspace/location is subordinate. One shared database with RLS; no database-per-customer by default. | Permanent |
| D7 | **RINPO must work without an LLM.** Deterministic rules ship first; AI reasoning is an enhancement behind the Model Gateway. | Permanent |
| D8 | **Positioning language:** "Autonomous where it matters. Human-controlled where it counts." Do not claim "No Staff Dependency" or "Zero Manual Work" platform-wide. | Permanent |

---

## 1. Definition

**RINADS = Intelligence Infrastructure for Software-Defined Business.**
Public promise: **Business Simplified.**

RINADS is one Business Operating System platform — one kernel, one intelligence runtime, one data model — on which businesses start, sell, operate, deliver, market, automate, learn and grow. It is not a collection of separate SaaS products.

**Fundamental rule:** RINADS owns the business logic. External technology supplies infrastructure, always through RINADS-owned interfaces.

```
RINADS business logic → RINADS interface/adapter → provider
```
Never `provider SDK → called directly from domain code`.

The user experiences it as: **Talk to RINPO. Open your RI SPACE. Run your business.**

---

## 2. Canonical names (glossary)

Use these exact names in UI, docs and code. Code identifiers in parentheses.

| Name | What it is | Is NOT |
|---|---|---|
| **RINADS** | The platform and company brand | An agency site or chatbot |
| **RINADS OS Kernel** (`kernel`) | Industry-neutral core domains (§6) | Customer-facing name |
| **RINADS INTELLIGENCE — RI** (`ri`) | Orchestration/intelligence layer: Observe → Understand → Recommend → Authorize → Act → Audit | A model vendor |
| **RINPO** | Human-facing intelligence character: chat, voice, visual | A separate backend |
| **RINPO Runtime** (`rinpo-runtime`) | Governed execution layer for all actions (§10) | An LLM wrapper |
| **RI ID** (`ri-id`) | RINADS platform identity for any person | Government identity |
| **RI SPACE** (route `/space`) | Authenticated operating workspace shell | A separate backend. Legacy `RINASPACE` identifiers may remain internally; public UI says RI SPACE |
| **Industry Pack** (`industry_pack`) | Technical unit: modules + defaults + workflows + RINPO skills for a vertical | A forked codebase |
| **R OS family** (R GLOW, R AUTO, R LANDSCAPE, R BUILD, R CLINIC, R RETAIL, R ACADEMY, R EAT, R STAY, R AGENCY, R LEGAL, R REALTY, R PRO) | Customer-facing brand names of Industry Packs | Separate products/repos |
| **Capability Pack** (`capability_pack`) | Cross-vertical add-on (e.g. Commerce, Logistics, Growth) | — |
| **Solutions** | Provisionable software (Business OS, Industry Packs, RINPO, RI SPACE…) | Services |
| **Services** | Human + AI fulfilment delivered by RINADS STUDIOS | Static marketing pages |
| **RINADS Marketplace** | One catalog for software, packs, services, training, integrations, credits | A directory |
| **RINADS STUDIOS** | Service production OS + physical studios (001 Mannuthy — Build Studio; 002 Thrissur — RI Intelligence Lab, labelled "future" until open) | — |
| **RI LABS** | Governed product factory: Signal → Thesis → Spec → Sandbox → Eval → Pilot → Productize → Launch → Scale/Kill | The education academy |
| **RINADS Academy** | Learn → Practice → Work → Ship → Measure → Improve → Certify | A course marketplace |
| **RI Opportunities** | Real work → deliverable → evidence → approval → payout | Gaming rewards |
| **RINADS Logistics** | Horizontal shipping/fulfilment capability with adapter framework | Automotive-only feature |
| **RINADS OS Factory** | Meta-system that composes new Industry Packs (post-launch) | — |
| **RINPO Phone** | Cross-device RINPO interface: Today · Ask · Actions · Growth · Apps | A separate auth silo |
| **RINADS WORLD** (`world.rinads.com`) | Spatial/gamified experience | Launch-critical (D4) |
| **RI RINAVERSE** | Network connecting RI SPACEs, identities, places, products, World | A dashboard |
| **Control Plane** (`control.rinads.com`) | Founder/platform-admin console | Tenant-accessible |

Family platforms (THEKKANATH NETWORK, MA LIVING STUDIO) run as tenants on the same kernel. Their characters are domain guides powered by RINPO Runtime and are not called RINPO.

---

## 3. Product hierarchy

```
RINADS TECHNOLOGIES
└── RINADS — Autonomous Business OS
    ├── RINADS OS KERNEL ............ identity, tenancy, business, money, commerce, growth, automation, governance
    ├── RINADS INTELLIGENCE (RI)
    │   └── RINPO RUNTIME ........... context, policy, memory, planner, approvals, executor, audit
    ├── RI SPACE .................... Today · Ask RINPO · Run · Sell · Grow · Create · Build · Learn · Work · Marketplace · Experience · Settings
    ├── INDUSTRY PACKS (R OS) ....... starter-business, R GLOW, then R LANDSCAPE, R AUTO, Jewellery, Projects, Logistics…
    ├── RINADS COMMERCE ............. catalog, SKU, inventory, cart, checkout, orders, storefront
    ├── RINADS MARKETPLACE + STUDIOS  service SKUs → orders → work units → QA → approval → delivery
    ├── RINADS LOGISTICS ............ shipment, courier adapters, manual courier portal, POD, COD settlement
    ├── RINADS ACADEMY + RI OPPORTUNITIES
    ├── RI LABS + OS FACTORY
    └── RINADS WORLD + RI RINAVERSE (post-launch)
```

Relationship: `RI ID → RI SPACE → RI RINAVERSE → WORLD / Commerce / Marketplace / Opportunities`

---

## 4. Architecture principles

1. **Extend, don't fork.** Finish the existing architecture in the canonical repo. No parallel platform.
2. **Build once, configure many.** One monorepo; verticals are packs, not repos.
3. **Server is the source of truth** for identity, organization, role, plan, entitlement, trial and permissions. Never trust client-supplied values for these.
4. **Provider portability.** Every external dependency sits behind a RINADS interface:

| Concern | RINADS interface | Launch provider | Alternatives |
|---|---|---|---|
| Database | Standard PostgreSQL + migrations | Supabase (managed) | Self-hosted Supabase / Postgres |
| Auth | `AuthProvider` | Supabase Auth | Self-hosted |
| Storage | S3-compatible `ObjectStore` | Supabase Storage | MinIO / RustFS / S3 |
| AI models | `ModelGateway` | API provider(s) | LiteLLM, Ollama, llama.cpp, vLLM |
| Payments | `PaymentProvider` | Razorpay | Stripe-compatible, Cashfree |
| Messaging | `MessagingProvider` | WhatsApp Business (official/approved BSP) | SMS/voice adapters |
| Logistics | `LogisticsProvider` | Manual courier portal + first verified adapter | Shiprocket, Delhivery, Porter, India Post, DTDC |
| Workflows | `WorkflowRunner` | Existing queue | Temporal (D2) |
| Hosting | Docker-compatible build | Vercel | Coolify, Netlify |

5. **Fail closed.** Unknown entitlement = no access. Unknown health = shown as UNKNOWN.
6. **Truthful product surface.** No feature, integration or health status is shown as LIVE unless verified end-to-end (§12).
7. **Mobile first.** Every critical owner workflow must work at phone width.

---

## 5. Tenancy model

```
Platform
└── Organization  (tenant boundary — organization_id)
    ├── Workspaces / Locations (subordinate)
    ├── Memberships (RI ID ↔ organization, role)
    ├── Entitlements (from trusted catalog)
    ├── RINPO instance (memory partitioned by org / user)
    └── Business data (every row carries organization_id)
```

**Required columns on every tenant-owned table:**
`id uuid pk`, `organization_id uuid not null`, `workspace_id uuid null`, `created_by uuid`, `updated_by uuid`, `created_at timestamptz`, `updated_at timestamptz`.

**RLS contract (pattern):**
```sql
alter table <t> enable row level security;
alter table <t> force row level security;

create policy <t>_member_read on <t> for select
  using (organization_id in (select app.current_org_ids()));

create policy <t>_member_write on <t> for insert
  with check (organization_id = app.active_org_id()
              and app.has_permission('<domain>.write'));
```
- `app.current_org_ids()` / `app.active_org_id()` derive from the authenticated session (JWT claim set server-side or membership lookup) — never from a request body.
- Service-role keys are used only in server code and workers, never shipped to browsers.
- Cross-tenant platform access happens only through the Control Plane with audit.

> Function names above are the target contract. Claude Code must map them to whatever helpers already exist in the repo (verify during audit) rather than duplicating them.

---

## 6. Kernel domains

| Domain | Entities |
|---|---|
| Identity | ri_ids, organizations, workspaces/locations, memberships, roles, permissions, sessions, invitations |
| Business | contacts, customers, leads, opportunities, activities, tasks, projects, calendars, documents |
| Money | products/services, invoices, payments, expenses, taxes (GST-capable), refunds, subscriptions, ledger |
| Commerce | catalog, SKUs, inventory, carts, orders, returns, coupons, storefronts |
| Growth | campaigns, audiences, content, reviews, attribution, messaging |
| Automation | events, triggers, conditions, actions, schedules, approvals, executions |
| Intelligence | rinpo_memory, context snapshots, recommendations, runtime_actions |
| Governance | audit_events, policies, approvals, retention rules, cost budgets |
| Platform | product_catalog, entitlements, trial_grants, provisioning_jobs, first_value_events, capability_registry, health_checks |

Launch scope: Identity, Business (contacts, customers, leads, tasks, projects), Money (products/services, basic invoices, payments), Governance, Platform. Other domains may exist in code but are gated by the Capability Registry.

---

## 7. RI ID and roles

RI ID resolves: account, verified contacts, memberships, roles, permissions, preferences, privacy controls; later skills, portfolio, certifications, reputation.

**Launch roles (per organization):** `owner`, `admin`, `staff`, `viewer`. Platform roles: `founder`, `platform_admin` (Control Plane only).
Permissions are strings `<domain>.<action>` (e.g. `finance.invoice.create`). Roles map to permission sets in the database, not in UI code.

---

## 8. Catalog, entitlements, trial

### 8.1 Global Product Catalog (server-side, versioned)
Product types: `software_subscription`, `industry_pack`, `capability_pack`, `digital_product`, `managed_service`, `training`, `integration`, `usage_credit`.

Each product: `key`, `type`, `name`, `markets`, `currencies`, `prices[]`, `billing_mode` (monthly/annual/one_time/setup_fee/usage), `trial_policy`, `limits`, `entitlement_manifest`, `provisioning_template`, `first_value_event`, `cancellation_behavior`, `suspension_behavior`, `support_policy`, `metadata_version`.

Pricing pages render from the catalog. Frontend pricing cards never grant privileges. Provider metadata never contains trusted permissions.

Public tiers: **START · GROW · SCALE · ENTERPRISE**, plus Industry Pack add-ons. "Training" is sold as **RINADS Launch & Onboarding** (self-service RINPO onboarding first, human optional).

### 8.2 Entitlements
An organization's effective capabilities = union of (active paid entitlements ∪ valid unexpired server-issued trial grant) ∩ Capability Registry availability ∩ role permissions.

### 8.3 Self-serve 7-day trial
- Requires verified RI ID (email). No card in beta.
- One trial per identity and per business (anti-abuse: verified email, normalized domain/phone checks, rate limits).
- Grant is created **only server-side**, idempotently:

```
trial_grants(id, organization_id, ri_id, plan_key, manifest jsonb,
             starts_at, ends_at, status, idempotency_key unique, created_at)
```
- Lifecycle: `trialing → expiring (T-2d) → expired_read_only → converted_active`. Expired = read-only for 30 days, then eligible for cleanup after notice.
- **Trial limits:** 1 organization, 1 workspace, 2 users, 100 contacts, 50 products/services, 10 active projects, 500 MB storage, capped RINPO/AI credits, no bulk messaging, no ad spend, no L4 actions, no paid third-party usage without credits/BYOK/paid plan.

---

## 9. Provisioning

```
requested → validated → queued → provisioning → pack_installing → ready → first_value → active
failure:  blocked | retrying | failed | suspended
```
Requirements: asynchronous (never in the browser request), idempotency key, bounded exponential backoff, attempt count, classified errors, dead-letter state, operator retry in Control Plane, audit event per transition.

Worker precondition: **valid active paid entitlement OR valid unexpired server-issued trial grant.** A browser flag is never sufficient.

Default pack `starter-business`: organization, workspace, profile, contacts, customers, products/services, leads, tasks, projects, basic invoices, dashboard, RINPO, RINPO Phone, RI SPACE, Marketplace access.

**Onboarding:** ask only business name, industry, country, location, primary goal → create RI SPACE immediately → RINPO continues setup progressively with a visible progress indicator.

**First value (persisted in `first_value_events`):**
| Product | First-value event |
|---|---|
| Business OS | first customer + first task |
| R GLOW | first appointment + first invoice |
| Commerce | first product published + first order |
| Logistics | first shipment booked |
| Growth | first campaign launched / first qualified lead |
| Academy | first lesson completed |
| Studios | first approved deliverable |

Funnel metrics: signup→RI SPACE, RI SPACE→first value, trial→first value, first value→conversion, paid→ready.

---

## 10. RINADS INTELLIGENCE and RINPO Runtime

### 10.1 Pipeline
```
Event / user request
 → Context Engine (server-authorized context only)
 → Decision: Deterministic rules  |  AI reasoning via ModelGateway
 → Planner
 → Policy + Entitlement + Permission + Cost check
 → Approval Router
 → Action Executor (registered tools only)
 → Verification
 → Audit
```

### 10.2 Autonomy levels
| Level | Meaning |
|---|---|
| L0 Observe | Read and report |
| L1 Recommend | Suggest; human acts |
| L2 Prepare | Draft the action; human submits |
| L3 Execute after approval | RINPO executes after explicit approval |
| L4 Policy-autonomous | Executes automatically inside pre-approved policy |

**Never L4 by default:** refunds, financial transfers, destructive deletion, tax configuration, permission escalation, subscription/plan changes, large budget changes, publication without rights evidence, regulated actions.
**Platform actions reserved to founder:** deleting production infrastructure, destructive migrations, core security policy changes, tenant deletion, legal/billing policy changes, credential rotation, provider migration, irreversible financial actions.
Launch default for tenants: **L0–L2 only; L3 for low-risk CRM/task actions.**

### 10.3 Action contract (every runtime action)
```json
{
  "action_id": "uuid",
  "capability_key": "crm.create_lead",
  "organization_id": "resolved server-side",
  "workspace_id": "resolved server-side",
  "actor": { "type": "user|rinpo|system", "ri_id": "uuid" },
  "intent": "string",
  "parameters": {},
  "risk_level": "low|medium|high|critical",
  "autonomy_level": "L0-L4",
  "policy_decision": { "allowed": true, "reasons": [] },
  "approval": { "required": true, "approved_by": null, "approved_at": null },
  "cost_estimate": {},
  "idempotency_key": "string",
  "execution_plan": [],
  "result": {},
  "audit_event_id": "uuid",
  "created_at": "timestamptz"
}
```

### 10.4 Tool registry
Each tool = `key` + JSON schema + required permission + risk level + max autonomy + cost class + audit mapping. Launch tools: `crm.create_contact`, `crm.create_lead`, `crm.update_customer`, `projects.create_task`, `projects.update_status`, `finance.create_invoice_draft`, `commerce.create_product`, `rinads.generate_report`, `rinads.attention_summary` (read-only).

### 10.5 Explainability
RINPO responses that propose or execute actions state: the observation, the evidence, the recommendation, the action, risk, and whether approval is required. UI labels every AI surface as **Observed · Inferred · Recommended · Executed**.

### 10.6 Model Gateway
No domain code calls an AI vendor SDK. All calls go `RINPO → ModelGateway → provider adapter`, with per-tenant cost tracking and the ability to swap to local models.

### 10.7 Memory
Partitioned by `organization_id` + `ri_id`; separated into personal preferences, organization context, project context, conversation context, explicit business facts. Permission-aware, purpose-limited, user-controllable. Cross-tenant isolation has automated tests.

---

## 11. Industry Pack manifest

Every pack is declared, not hand-coded:

```yaml
key: r-glow
brand_name: R GLOW
type: industry_pack
status: BETA          # §12 labels
depends_on: [starter-business]
modules: [appointments, front_desk, pos, inventory, loyalty, staff_commissions]
terminology: { customer: client, task: appointment }
defaults: {}
workflow_templates: [rebooking_reminder, low_stock_alert]
dashboard: { kpis: [appointments_today, revenue_today, rebooking_rate] }
rinpo_skills: [salon.attention_summary, salon.rebook_suggestions]
integrations: [razorpay, whatsapp]
first_value_event: first_appointment_and_invoice
```

Launch priority order: starter-business → R GLOW → R LANDSCAPE / Commerce → Projects → R AUTO → Jewellery → others.

---

## 12. Capability Registry and status labels

One registry consumed by every surface (website, RI SPACE, RINPO, Control Plane). Record: `key, name, category, status, entitlement, required_role, required_integration, cost_class, route, runtime_action, risk_level, availability`.

**Allowed statuses only:**
| Label | Meaning |
|---|---|
| LIVE | Production infrastructure verified end-to-end |
| READY | Code complete + tested, awaiting controlled activation |
| BETA | Functional, limited supported use |
| PREVIEW | Demonstration only, not contractual |
| BLOCKED | Known infra/security/provider blocker |
| PLANNED | Not implemented |

Connectors are never LIVE without credentials + API/webhook + end-to-end proof. Health shows UNKNOWN when unknown.

---

## 13. Billing

- Razorpay first (India); Stripe-compatible abstraction for later international.
- Verified server webhook is the only source of entitlement truth. Browser "success" grants nothing.
- Provider event IDs deduplicated; handlers idempotent.
- Modes: monthly, annual, one-time, setup fee, usage credits.
- Cancellation revokes future entitlement; `past_due` fails closed per policy.
- Trial → paid conversion keeps the same organization and data.

---

## 14. Infrastructure topology

**Launch (D1):** existing Vercel Pro (web/app) + Supabase Pro (Postgres, Auth, Storage) + existing queue/workers + Razorpay + self-hosted n8n on Hostinger (internal only, D3).

**Stage A (post-launch target):**
| Node | Size | Role |
|---|---|---|
| VPS-1 Control/Staging | Hostinger KVM 2 | Coolify, staging, CI runners, internal tools |
| VPS-2 Production core | Hostinger KVM 8 | API, RINPO Runtime, workers, Valkey |
| VPS-3 Automation/workers | Hostinger KVM 4 | Temporal, n8n (internal), OCR, PDF, scheduled jobs |
Plus off-site S3-compatible backups. Budget at renewal prices, not promotional.

**Later stages:** B separate DB/workers/storage/AI · C multi-region, replicas, GPU · D RINADS Private Cloud · E Sovereign deployment in customer infrastructure with local models.

**Not now:** Kubernetes, GPU servers, per-tenant databases, per-vertical VPS, n8n Enterprise/Embed.

---

## 15. Security non-negotiables and required tests

Must preserve: RLS, server-side context, least privilege, audit logs, secret isolation (no secrets in frontend, git, or n8n workflows), fail-closed entitlement, verified webhooks, idempotency, rate limits, abuse controls.

**Automated tests that must pass before launch:**
1. Tenant A cannot read or write Tenant B (every launch table).
2. User cannot forge organization, workspace or role.
3. Browser cannot grant paid entitlement.
4. Browser cannot grant trial entitlement.
5. Webhook replay does not duplicate payment, entitlement or provisioning.
6. Expired trial loses write capability; conversion restores it.
7. Unauthorized RINPO tool calls fail and are audited.
8. RINPO memory never returns another organization's data.
9. Anonymous users cannot read any tenant table.

**R GLOW gate (D5):** R GLOW is not marketed as self-serve until its production database is verified healthy, its RLS tests pass, and provisioning passes end-to-end on the canonical RINADS database. Never point production at an unverified database.

**Database change rule:** inspect current schema → additive migration where possible → rollback note → test on local/preview → run RLS tests → only then production.

---

## 16. Release plan to 14 November 2026

| Window | Release | Exit criteria |
|---|---|---|
| 23 Oct | Freeze | This spec + CLAUDE.md committed |
| 24–28 Oct | **A — Foundation hardening** | Baseline audit + `readiness.json`; demo/stub inventory classified; Capability Registry single source; entitlement persistence server-side; audit logging on all writes |
| 29 Oct – 3 Nov | **B — Self-serve trial** (P0) | Server trial grant; RI ID verify; org create; async idempotent provisioning; RI SPACE loads; RINPO loads; expiry → read-only |
| 4–8 Nov | **C — Billing conversion** + **D — Solutions** | Razorpay webhook → entitlement; trial→paid with same data; starter-business LIVE-candidate; R GLOW gate attempted |
| 9–12 Nov | **F (partial) — RINPO v1** + public site | "What needs my attention?" deterministic summary; RINPO Phone Today/Ask/Actions; site IA + CTAs behind flag; SEO rules |
| 13 Nov | Gate rehearsal | §17 journey passes in staging twice |
| 14 Nov | Launch | Flip "Start 7-Day Trial" CTA only if §17 passes in production |

Post-launch: E Services engine, F full (memory, voice EN + Malayalam), G World/RINAVERSE, OS Factory, Stage A infra, Temporal.

Priority if time is short: **P0 trial + provisioning + RI SPACE → P1 billing → P2 Business OS → everything else.**

---

## 17. Launch acceptance gate

A brand-new user can:
1. Visit rinads.com and understand RINADS.
2. Create and verify an RI ID.
3. Start a 7-day trial.
4. Create a business (5 fields).
5. Receive a tenant automatically.
6. Enter RI SPACE.
7. Talk to RINPO.
8. Create a real customer, product/service and task.
9. Trigger first value.
10. Log out, log back in, context preserved.
11. Invite a team member.
12. See only entitled capabilities.
13. Reach the Marketplace.
14. Receive trial-expiry communication (test clock).
15. Become read-only on expiry.
16. Convert via verified Razorpay payment.
17. Retain the same organization and data as an active paid tenant.

Simultaneously the founder sees in the Control Plane: tenant, subscription, entitlement, provisioning state, first-value state, usage, health (truthful), failures, audit events.

Deferred from the original 20-step gate (post-launch): World with governed identity, ordering a service through Studios fulfilment.

---

## 18. Public website

Top-level IA: **Platform · Solutions · Services · Industries · RINPO · RINADS WORLD · Academy · Pricing · Company**.
Hero: **Business Simplified.** CTAs: **Start 7-Day Trial** (behind flag until §17 passes) · **Explore Demo** · **Talk to RINPO**.
Demo mode: synthetic data, clearly labelled DEMO DATA, no persistent mutations, resettable.
Index product/solution/service/industry/Academy/company pages. Do not index RI SPACE, portals, checkout, admin or signup internals.

---

## 19. Open items requiring audit evidence

Resolved only by the Release A audit, not by assumption:
- Which tenancy helpers, RLS policies and migrations already exist.
- Current state of signup, `/onboarding/create-organization`, `/space`, provisioning worker, catalog, billing, Capability Registry, RINPO Runtime, World bridge.
- Which Supabase project R GLOW production uses and its health.
- Existing job/queue mechanism for D2.
- Which connectors have real credentials and verified flows.

Findings go to `docs/production/PLATFORM-READINESS.md` and `docs/production/readiness.json`.

---

## 20. Change control

- Changes to §0, §2, §5, §10.2–10.3, §15 require founder approval and a new ADR in `docs/decisions/`.
- Version bump on every change; log below.
- AI agents may propose changes; they may not apply them unilaterally.

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-23 | Initial freeze reconciling strategic blueprint and Full Platform Production Build prompt |
| 1.0.1 | 2026-10-23 | ADR path corrected to existing `docs/decisions/` (no substantive change) |
