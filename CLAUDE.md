# RINADS Technologies Platform — Claude Code Build Contract

## Mission

Build the **RINADS Company OS + Founder Control Tower production MVP** on top of the current RINADS monorepo while preserving the existing public RINADS.com V2 experience and every verified working capability.

Tracking issue: **#127 — RINADS Company OS + Founder Control Tower — production MVP build**.

Work on branch `claude-rinads-company-os-mvp` unless explicitly instructed otherwise.

This is an implementation task. Inspect the repository, make incremental changes, run verification after each slice, repair regressions, and finish with a production-readiness report. Do not stop at a plan.

---

## First actions in every fresh session

1. Read:
   - `README.md`
   - `docs/STATUS.md`
   - `docs/founder-audit/PRODUCTION-TRUTH.md`
   - `docs/deployment/POLICY.md`
   - relevant RINPO/security/runtime docs
2. Inspect current `main`, this branch, open PR overlap, migrations, package boundaries and existing `/os` implementation before editing.
3. Treat current `main` and the live RINADS.com V2 public experience as the preservation baseline.
4. Never recreate functionality that already exists. Reuse existing packages, domain services, runtime primitives, routes and tests.

---

## Non-negotiable product architecture

- **RINPO** = persistent human/business interface.
- **RINADS Intelligence** = context, reasoning, recommendations, model routing and business understanding.
- **RINPO Runtime** = governed tools, workflows, actions, permissions, approvals, verification, retries and audit.
- **RINADS Business Graph / domain services** = authoritative business state.
- **RINADS Cloud** = identity, tenancy, PostgreSQL/Supabase, storage, APIs, events, integrations and infrastructure.
- External AI providers such as xAI/Grok, Anthropic, OpenAI and Google are **replaceable workers/providers behind RINADS Intelligence**. They are never the authority for permissions, tenancy or production business state.

Do not build a parallel ERP, duplicate task engine, second auth system, second RINPO runtime, independent vertical databases or model-specific product architecture.

---

## Preservation requirement

The existing public website must not regress.

Preserve current:
- homepage and RINADS.com V2 design/content unless a required Company OS integration needs a minimal compatible change
- Platform, RINPO, Intelligence, Runtime, Cloud, Solutions, Services, Academy, Customers, Pricing, Trust and Company routes
- lead capture and Business Readiness flows
- current redirects and SEO metadata
- RINPO public presence/Phone behaviour
- availability/readiness truth labels
- legal/compliance non-claims
- current R GLOW, commerce, storefront, customer portal, owner portal and platform-admin behaviour

No invented customer metrics, logos, commercial pricing, certifications, SLAs or production-readiness claims.

---

## Canonical Company OS `/os`

Build/complete one shared shell with these product areas, using role-aware visibility rather than separate apps where possible:

- Home
- Founder
- Customers
- Sales
- Work
- Studio
- Growth
- Ads
- Engineering
- AI
- Commerce
- Finance
- People
- Logistics
- Communication
- Academy
- Platforms
- Assets
- Approvals
- Reports
- Settings

Do not expose every internal object as a top-level navigation item. Use nested workspaces and reusable components.

---

## Founder Control Tower

Extend the existing Founder Intelligence/control-plane work rather than rebuilding it.

Founder must see production-backed, permission-safe summaries for:
- company pulse
- Today
- Attention / exception queue
- decisions / approvals
- revenue and cash summary
- receivables
- weighted sales pipeline
- client health and risks
- project/work risk
- staff/team capacity
- Studio/Growth/Ads production health
- Engineering/GitHub/Vercel/Supabase health
- AI provider/run/cost/error visibility
- logistics/communications exceptions
- daily close and tomorrow priorities

RINPO should compress the company into actionable exceptions. Founder should not be forced to inspect every module.

Do not create synthetic urgency or health scores when source data is insufficient. Clearly mark unavailable data.

---

## Canonical client lifecycle

Implement one connected lifecycle:

Lead → Company/Contact → Opportunity → Discovery → Solution → Proposal → Contract → Client → Project/Retainer → Task → Deliverable → Approval → Invoice/Payment → Performance → Renewal/Upsell.

Every object must remain organization-scoped and linked where appropriate.

Client workspace should aggregate contacts, contracts, projects, tasks, deliverables, approvals, content, campaigns, ads, support, invoices, payments, documents, communications and analytics.

---

## Work allocation

Use existing task/work primitives.

Add recommendation logic using available facts such as:
- skill match
- current capacity
- deadline urgency
- client priority
- dependencies
- historical delivery data where verified
- cost/role fit where appropriate

Human managers remain authoritative. Record manual overrides/rationale when useful. Do not make employment decisions autonomously.

---

## RINADS Studio MVP

Use a shared production workflow:

Request → Brief → Strategy → Creative Direction → Copy/Script → Storyboard → Design/Image/Video/Animation/VFX/Audio → Edit → QA → Approval → Master → Channel Variants → Publish → Performance.

Asset provenance should support:
- client/brand/campaign/project
- source/licensing information
- human or AI creator
- model/provider where applicable
- prompt/version reference where appropriate
- approval status
- master/derived-asset relationship
- publishing history
- performance linkage

Do not auto-publish consequential client content without policy/approval.

---

## Growth, Ads and YouTube

Create/reuse one campaign/content model across web, blog, YouTube, Shorts, Instagram, Facebook, LinkedIn, X, WhatsApp, email, Google Business and paid ads.

Link channel variants to the same campaign/source idea.

Ads intelligence may detect fatigue, poor CTR/CPL, winning hooks/audiences and landing-page mismatch, but recommendations must remain explainable and policy-governed.

Prefer official provider APIs/adapters when integration exists. Browser automation must not become the authoritative integration layer.

---

## Grok / AI workforce

Treat Grok as one replaceable provider/worker behind RINADS Intelligence.

Initial logical roles may include:
- Founder Chief of Staff
- Operations Controller
- Sales Intelligence
- Client Success
- Creative Director
- Production Director
- Trend Intelligence
- Growth Director
- Ads Manager
- Engineering Lead
- AI Production Lead
- Academy Director

Prefer configurable role/skill profiles over twelve separate security domains.

Bots/agents may research, read, analyze, draft, summarize, prepare actions, create briefs/issues/tasks and request approvals.

They must not bypass RINADS permissions or directly perform high-risk production mutations.

---

## RINPO Runtime action policy

Every material action follows:

Request → Context → Permission Check → Risk Classification → Approval Policy → Tool/Domain Service → Postcondition Verification → Audit/Event → Result.

High-risk examples requiring explicit governed approval include:
- contracts
- payments/refunds
- permission changes
- destructive data changes
- production deployment
- sensitive client publishing
- large ad-budget changes
- secrets/infrastructure changes

Model output is never authorization.

---

## Supabase / data safety

- Keep Supabase/domain services as system of record.
- Every new tenant-owned table must have deliberate RLS.
- Do not place service-role credentials in client code.
- No direct model-to-database mutation.
- Prefer additive, reversible migrations.
- Never apply production migrations merely because local/CI tests pass.
- Security hardening work around PR #115 must be validated in isolated/staging infrastructure before production.
- RINPO runtime/security hardening around PR #119 must pass the release gate before autonomy increases.
- Do not bypass inventory authority/atomicity work around PR #104.

---

## Existing open-work overlap

Before implementing overlapping code, inspect open PRs rather than duplicating them.

In particular:
- PR #121 — Founder Today / Attention / deployment parity
- PR #120 — Jewellery MVP
- PR #119 — RINPO runtime hardening
- PR #115 — production function privilege hardening
- PR #113 — founder session inspection
- PR #112 — CMS media upload
- PR #104 — inventory authority

Reuse/rebase/cherry-pick only after reviewing the actual diff against current `main`. Do not blindly merge draft/security-gated work.

---

## Communications, Logistics, Academy

Communication activity should link calls/voice/WhatsApp/email/SMS/web chat to the relevant lead/customer/project/ticket/order/invoice.

Logistics should use a provider-neutral Order → Shipment → Carrier → Tracking → Exception → Delivery → Return model.

Academy should connect Skill → Learn → Practice → Lab/Simulation → Supervised Work → Evidence → Assessment → Certification. Training may influence skill eligibility but must not automatically make employment decisions.

---

## Engineering and AI observability

Integrate available GitHub/Vercel/Supabase signals into Engineering and Founder views.

Expose useful status without leaking credentials:
- build/deploy status
- release readiness
- incidents
- migrations/status
- AI provider/model selection
- run counts
- cost where available
- errors/failures
- approval/action state

Keep routing authority inside `@rinads/intelligence` and governed runtime abstractions.

---

## Events and audit

Use canonical events for important changes and preserve tenant context/correlation.

Examples:
- lead.created
- proposal.sent
- contract.signed
- task.completed
- milestone.delayed
- creative.submitted
- creative.approved
- content.published
- invoice.issued
- invoice.overdue
- payment.received
- deployment.failed
- shipment.delayed
- approval.requested
- approval.completed
- ai.action.executed
- ai.action.failed

Do not notify the founder for every low-level event. Aggregate normal activity and surface exceptions.

---

## Delivery sequence

Work incrementally:

1. Fresh repository/open-PR audit and overlap map.
2. Lock route/domain plan and additive migration plan.
3. Extend `/os` shell + Founder Control Tower using existing primitives.
4. Complete Customers/Sales/Work/client lifecycle.
5. Complete Approvals + governed action/activity surface.
6. Add People/capacity/work-allocation recommendations.
7. Add Studio/Growth/Ads workflows and asset model.
8. Add Engineering/AI observability + provider-neutral agent/tool interfaces.
9. Add Communications/Logistics/Academy MVP bridges.
10. Run full E2E/staging verification and write production-readiness report.

Keep slices small enough to review and test. Prefer multiple focused commits/PRs over one unreviewable rewrite.

---

## Required verification

Run after relevant slices and again before release:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Then, with production-equivalent test personas/environment:

```bash
pnpm test:e2e
pnpm ops:preflight
pnpm ops:verify
```

Also verify:
- cross-tenant isolation
- RLS for new tenant tables
- no unexpected anonymous/authenticated SECURITY DEFINER execution
- no broken current public routes/redirects
- no critical browser/server console errors
- no fabricated live data
- idempotency for retryable write paths
- postcondition verification for material operations
- approval enforcement for high-risk actions
- fail-closed behaviour when integrations/credentials are missing
- accessibility basics and responsive behaviour

---

## Deployment policy

Follow repository policy:

PR → CI → review → merge → staging → verification → production.

Never use emergency direct-production deployment for normal delivery.

Do not apply production migrations, enable workers, modify auth allowlists, rotate secrets, change production integrations or promote to production without explicit founder approval after staging/UAT evidence.

Do not use `--dangerously-skip-permissions` or equivalent shortcuts to bypass safety boundaries for production-affecting work.

---

## Definition of done

The production MVP is done when RINADS can substantially operate RINADS through `/os`:

- Founder sees real company state, decisions and exceptions.
- Teams see governed assigned work and daily priorities.
- Leads, clients, projects, deliverables, approvals, invoices/payments and renewals are connected.
- Studio/Growth/Ads/Engineering/AI/Finance/People/Logistics/Academy work from shared tenant-scoped data.
- RINPO can explain and recommend from permitted real context.
- Executable AI/system actions enter one governed permission/approval/audit runtime.
- Existing RINADS.com V2 and current shipped products remain stable.
- Security and authenticated tenant/founder UAT pass.

Finish with a written production-readiness report containing:
- shipped functionality
- migrations and RLS changes
- new permissions
- tests and commands run
- staging/preview evidence
- unresolved blockers
- security findings
- required credentials/integrations
- exact GO / CONDITIONAL GO / NO-GO recommendation

If evidence is missing, state that explicitly. Never mark production ready by inference.