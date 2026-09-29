# RINADS Creative OS — Founder Launch Blueprint v1.0
Date: 2026-09-28
Status: PROPOSED / NOT PRODUCTION-READY
Owner: RINADS founder
Scope: Independently engineered functional parity with publicly advertised AI marketing/creative workflows, integrated into existing RINADS core. Do not copy any competitor's code, visual assets, proprietary prompts or branding.

## 0. Source-of-truth and hard boundaries
- Current root is a pnpm/Turborepo monorepo, website is Next.js 16 / React 19, with existing `@rinads/auth`, `@rinads/billing`, `@rinads/tenancy`, `@rinads/permissions`, `@rinads/database`, `@rinads/brand` packages. **Inspect and reuse** actual package contracts before adding APIs or migrations.
- `/platform/creative-os` currently reuses `OsMarketingPage`; `PLATFORM_OS` marks it Coming soon. Its current signature demonstration is synthetic. Do not label the demo live.
- Keep canonical authenticated `/os` routing unchanged. Mount Creative modules beneath the existing shell and launch `creative.rinads.com` as an optional product-specific front door only after domain and auth strategy review.
- This plan does not authorize mutating production data, provider spend, billing or customer social accounts.
- Feature parity must use independently created RINADS interface and assets.
- **PR-C0 inventory (2026-09-30):** [PR-C0-INVENTORY.md](./PR-C0-INVENTORY.md), [PACKAGE-CONTRACTS.md](./PACKAGE-CONTRACTS.md), [GATE-A-CHECKLIST.md](./GATE-A-CHECKLIST.md).

## 1. Release decisions
- Today: open a design/architecture branch; confirm existing package APIs; implement docs, gates and cost/latency benchmark harness in isolation.
- Seven-day proof: founder-only internal preview using fake credit payments and sandbox/test provider requests; single brand, upload, image generation, project gallery and basic metered video.
- 30-day target: private paid beta only if ledger reconciliation, consent, RLS, restore drill, safety and gateway readiness pass.
- 60–90 day target: external self-serve launch only after real usage, provider contract/commercial terms and scheduled publishing review.
- A production-safe complete multi-channel parity programme should be planned as separate quarterly epics, not called a seven-day clone.

## 2. PR sequence (one PR per vertical slice)
PR-C0: Inventory packages and runtime routes; write contracts/RFCs, trace existing migrations, test public metadata/Creative IA. No feature-status changes.
PR-C1: Organisation-scoped creative schema/migrations + RLS negative tests and audit event catalogue.
PR-C2: Canonical media assets / presigned upload / private access URLs / cleanup / versioning.
PR-C3: AI capability gateway: versioned provider-neutral request/response, allowlist of models, ceiling pricing, secrets and retry classification.
PR-C4: Ledger: credit accounts, grants, immutable postings, reservations, captures/releases, expiring lots, invoice/payment webhooks and duplicate processing tests.
PR-C5: Generation state machine, transactional outbox, durable workers and provider callbacks, retry budgets, stuck-job monitor and cost reconciliation.
PR-C6: Brand memory + Post Maker + industry-tested image templates and editorial export.
PR-C7: Product photo studio + reference identity evaluation suite; hard QA guardrail for SKU/color/jewellery detail.
PR-C8: Reels + AI actor/performance lane, speech consent record, optional FFmpeg worker, exact cost quote before job submission.
PR-C9: Calendar, project collaboration, internal review/approval, export; social OAuth/publishing separate after platform authorization.
PR-C10: Founder/admin console, observability, reconciliation dashboards, privacy/deletion and backup restore drill.
PR-C11: Beta onboarding, documented usage/pricing, customer support + enterprise controls; public release only after acceptance tests.

## 3. Target packages and app surfaces (adjust after code survey)
```text
apps/
  website/                      # existing public marketing and /os
  creative/                     # optional dedicated app AFTER shared-auth review
  creative-worker/              # async execution; never run video inference in web request
packages/
  creative-contracts/           # shared TS types, enums and zod validators
  creative-api/                 # BFF routes, quote/create/list/cancel
  creative-provider-router/     # adapters and pricing catalogue
  creative-jobs/                # outbox/state machine/workflow
  creative-media/               # private R2, transformations, retention
  creative-safety/              # content and likeness policy, consent
  creative-ui/                  # branded user-facing components
  # integrate rather than duplicate existing auth, billing, tenancy, permissions, database, brand
supabase/migrations/
  ...                           # ordered migration files with rollback plans
docs/creative-os/
  ...                           # threat model, cost model, operations, benchmarking
```

## 4. Tenant and actor model
organisation -> workspace (internal, customer, agency, partner) -> brand -> project -> generation jobs/assets.
- Roles: founder-platform-superadmin (audited, separate internal boundary), organisation owner, billing admin, manager/approver, creator, viewer, external client-reviewer.
- Agencies may manage multiple client workspaces with explicit per-workspace grants; never infer permissions from sharing the same email/domain.
- Every accessible row carries org/workspace scope directly or through a protected parent. Browser never receives a service-role key.
- Cross-tenant negative tests for ALL user-reachable queries, vectors, queue callbacks and signed media URLs.
- Do not silently grant partner/shareholder accounts founder authority. Production operator access is time-bound and audited.

## 5. Minimal schema proposal (names adapt to existing migrations)
`creative_brands`, `creative_brand_versions`, `creative_products`, `creative_characters`, `creative_character_reference_assets`, `creative_consent_records`, `creative_projects`, `creative_project_versions`, `creative_assets`, `creative_asset_derivatives`, `creative_generation_jobs`, `creative_generation_attempts`, `creative_provider_calls`, `creative_templates`, `creative_calendars`, `creative_calendar_items`, `creative_publications`.
Extend existing billing package with `credit_accounts`, `credit_lots`, `credit_ledger`, `credit_reservations`, `credit_usage_events`, `payment_intents`, `payment_webhook_events` IF not already implemented; avoid duplicate ledger systems.
Unique keys: payment provider event ID; org + idempotency key per generation; job + attempt number; provider request ID, where provided.
Immutable event/audit entries. No DELETE/UPDATE of settled financial postings except compensating postings.

## 6. Generation contract and state machine
Routes /v1/creative/assets/upload-intents; /brands; /projects; /generations/quote; /generations; /generations/:id; /generations/:id/events; /generations/:id/cancel; /credits/balance and /internal/provider-webhooks/*.
Client sends capability (`POST_IMAGE`, `PRODUCT_IMAGE`, `CHARACTER_FRAME`, `IMAGE_TO_VIDEO`, `ACTOR_VIDEO`, `TTS`), project, brand_version, reference_asset_ids, dimensions, duration, quality, idempotency key.
Quote server-side from versioned vendor rate-card + retry reserve + margin floor; NEVER trust browser quote, provider or credit price.
Atomic reservation and job creation; transactional outbox then worker.
`created -> quoted -> reserved -> queued -> submitted -> provider_running -> postprocessing -> storing -> completed`; `moderation_blocked`, `cancel_requested`, `cancelled`, `failed_retryable`, `failed_terminal`, `dead_letter` are explicit.
Recheck tenant and consent before dispatch; process signed provider callbacks idempotently.
On success: write immutable asset, actual provider spend, reconcile credit capture. On terminal failure before usable output: release reservation; on ambiguous provider charge: place job in reconciliation rather than repeated uncontrolled spend.
Bound concurrent video jobs per user/workspace, dollar spend/day and provider-specific retry limit.
Default exports: signed private originals, CDN watermarked previews, static poster frames; export derivatives recorded with source provenance.

## 7. Character / brand consistency
A character is an explicit `creative_character` with approved reference sheet, traits, wardrobe/voice rights, allowed brands, allowed render models and consent status.
For each shot: generate/edit canonical still from locked references -> human/automated reference checks -> image-to-video/Act-Two -> soundtrack/TTS only if consented -> FFmpeg assembly -> branded overlays/captions -> approval.
Never promise a persistent 3D identity from unrelated text-to-video calls. Persist prompt version, reference IDs, provider/model/version/seed/parameters for reproducibility.
For real persons/voices require affirmative consent, verification, permitted use and revocation workflow; stop new jobs immediately when revoked.
For product jewellery and fashion, build SKU reference benchmark; do not claim exact likeness when generation can alter critical details.

## 8. Pricing and unit economics (illustrative, NOT final tariff)
Exchange-rate planning assumption only: ₹90 per USD; refresh before charging. Official provider rate-card must be versioned and checked before each launch.
Current public external benchmarks (verified 2026-09-28): Scalio Growth $19.99/100 credits, Pro $39.99/250; standard image 1 credit, HD image 2, Reel 2/sec, AI actor 1/sec. RINADS must define independent credits.
Runway developer currently $0.01 per Runway credit: Gen4 Image Turbo 2 = $0.02/image; GPT Image 2 medium 5 = $0.05/image; Gen4 Turbo 5/sec = $0.50/10s; Gen4.5 12/sec = $1.20/10s; Act-Two 5/sec = $0.50/10s. These are provider examples, NOT proof Scalio uses Runway.
Draft RINADS: Trial limited/watermarked/no expensive free video; Launch ₹999 ex-GST/75 credits; Grow ₹2,499/250; Pro ₹4,999/600; Business custom.
Illustrative charges: standard image 1 credit; HD image 2; premium/high-resolution image price by actual quote; standard ten-second Reel 20; premium ten-second video 40; actor ten-second video + speech per quote (at least 20 if same Runway economics); text/calendar included subject to fair use. Credits reflect margin and vendor spend, not direct Runway credits.
Ensure worst-case 'all video' redemption still meets approved contribution margin floor after retry allowance. Do not launch free unlimited regenerations.
Monitor actual spend/credit, paid job retries, provider charge uncertainty, LTV/CAC, churn, org activation, cost per accepted/published asset.

## 9. Storage, privacy and recovery
- External original inputs and generated outputs: org-scoped private object keys, e.g. `org/{org}/project/{project}/asset/{asset}/original`; short-lived download URLs; media metadata in Postgres.
- Public social exports created only by deliberate publish/export action; non-expiring public storage of customer originals forbidden by default.
- Use Cloudflare R2 standard for retained media; check class-A/class-B operations and provider retention separately from storage GB.
- Primary DB: Supabase managed backup + PITR if subscribed/available, PLUS encrypted independent logical backup in a separate account/provider. Keep encryption keys out of the backup destination.
- Suggested launch RPO <=15 min for paid ledger/transaction DB ONLY once PITR proven; RTO <=4h once restoration test measured. Until verified state objectives as targets, not guarantees.
- Hourly ledger reconciliation report, daily immutable export of financial events, restore verification before charging real customers, scheduled quarterly disaster drill.
- Optional R2 lifecycle: ephemeral source uploads 30d following processing unless customer retains; post-processing intermediates 7d; failed payloads minimal retention; immutable completed outputs while retained by plan.
- DPDP/security, DPA/subprocessor, payment/GST, model commercial licences, takedown and AI-likeness terms require legal review before GA.

## 10. Infrastructure and operations
Start managed: existing Next.js on Vercel, Supabase Postgres/Auth/RLS, Cloudflare R2, managed Redis/queue OR Temporal Cloud for long-running jobs (choose one on architecture review), managed worker on a suitable container host, AI adapters to approved APIs, Razorpay sandbox then approved production merchant account, Sentry/OpenTelemetry.
Do not launch Vercel request handlers as long-lived video workers. Run FFmpeg in isolated worker container with bounded CPU/memory/disk and anti-malware/metadata sanitization on uploads.
Environment-specific credentials and spend caps; no model/API key in client. Redact secrets, real faces, raw client creatives from logs.
Measure p50/p95 and cancellation/cost behavior per provider with 100–1,000 real representative benchmark calls, not marketing-generation time claims.

## 11. Acceptance gates
GATE A: build/lint/typecheck/tests pass on feature branch; production main untouched.
GATE B: tenant-negative RLS and signed URL tests pass; support operator path audited.
GATE C: 100 duplicated/scrambled payment callbacks and 100 duplicated generation submissions create exactly one grant/reservation/job per idempotency key.
GATE D: provider timeout after charging does NOT silently double-dispatch or double-debit.
GATE E: zero failed terminal jobs with unaccounted locked credits; daily ledger sum matches available+reserved+captured accounting.
GATE F: content/consent tests cover minors, real people, prohibited impersonation and product-input rights.
GATE G: independent DB restore tested in isolated environment and documented; source/output storage lifecycle tested.
GATE H: direct model cost + retries + gateway fees leave target margin at worst allowed customer credit consumption.
GATE I: legal terms, privacy, data handling and supported social OAuth approvals are complete; do not publicly claim GA before these pass.

## 12. Work breakdown and staffing
Seven-day internal proof: founder product owner; 1 strong full-stack tech lead; 1 AI/platform integration developer; fractional designer/QA; on-call security reviewer. Reuse existing RINADS staff only if they have available engineering capability.
Private beta: add one strong backend/DB engineer and QA/SRE support. Full product-parity roadmap: 6–8 dedicated FTE for ~12 week valuable creative MVP; social ads, GBP, replies and fully supported web studio later.
Budget RANGE, subject to existing package reuse and contractor quotes: internal proof ₹0.75–3L incremental labor/providers; limited 30-day private beta ₹3–12L incremental; 12-week robust dedicated-team project ₹45–75L; extensive multi-channel public-feature parity approximately ₹1.05–1.75Cr cumulative.

## 13. Go/no-go at first real customers
At least 40% of qualified onboarding sessions reach first usable asset; >60% of generated images accepted with <=1 regeneration; standard video provider-cost gross margin above 60%; zero unresolved ledger discrepancies; rollback, backup restore, privacy/deletion and customer support playbooks exercised. If not met, improve this vertical slice before expanding provider catalogue.

## References (direct official/public sources)
- Scalio public: https://scalio.app/ and https://scalio.app/pricing/
- Runway developer unit cost: https://docs.dev.runwayml.com/guides/pricing/
- Supabase tiers and backup terms: https://supabase.com/pricing
- Vercel tier costs: https://vercel.com/pricing
- Cloudflare R2 unit costs: https://developers.cloudflare.com/r2/pricing/
- Razorpay commercial terms: https://razorpay.com/pricing/
- Indian DPDP notification: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190014
