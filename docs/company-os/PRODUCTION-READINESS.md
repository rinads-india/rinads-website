# RINADS Company OS + Founder Control Tower — Production Readiness Report

Issue: #127 · Draft PR: #128 · Branch: `claude/rinads-company-os-mvp-ipygn8` · Report date: 2026-10-16

## Recommendation

**CONDITIONAL GO for staging. NO-GO for production until the founder-only steps below are done and their evidence is attached to this report.**

Why not production today:

1. **No Company OS migration has been applied to any database**, so every claim about live behaviour is proven only against an in-process Postgres (PGlite) running the real 44-migration chain, not against Supabase staging.
2. **No authenticated UAT has been run.** The founder/staff Playwright personas exist but were skipped (no credentials, no deployment).
3. **PR #115 (function-privilege hardening) and PR #119 (runtime hardening) are not merged.** The release gate for raising autonomy is therefore not met; this release deliberately keeps every AI role at *read + propose*.
4. **No preview or staging deployment of this branch exists yet**, so there is no staging evidence.

Nothing here is marked ready by inference. Where evidence is missing it says so.

---

## 1. What shipped (in the branch)

### One shell, 21 areas
Home, Founder, Customers, Sales, Work, Studio, Growth, Ads, Engineering, AI, Commerce, Finance, People, Logistics, Communication, Academy, Platforms, Assets, Approvals, Reports, Settings. Navigation is permission-aware (`packages/company-os/src/modules.ts`), grouped, and collapses into the existing mobile bottom bar + More sheet. Legacy routes (`/os/money`, `/os/automate`, `/os/rooms`, `/os/work/*`) still work and are bridged into the new areas. Every area has a real page (asserted by a test); 30 `/os` routes build.

| Area | What it does | Data source |
|---|---|---|
| Home | Existing command centre + "Needs attention" strip (hidden in demo / no-org) | company facts |
| Founder | Company pulse, Today, attention queue, decisions, cash, receivables, weighted pipeline, client/project risk, work, capacity, Studio/Growth/Ads, Engineering, AI, logistics/comms exceptions, daily close, tomorrow | all permitted facts |
| Customers | Companies/contacts, **client workspace** aggregating contacts, deals, proposals, contracts, projects, deliverables, invoices, payments, comms | CRM + delivery + finance |
| Sales | Leads → qualify → convert; pipeline (basis labelled); opportunities; proposals; contracts; website-lead import | CRM |
| Work | Board, explainable allocation with factor breakdown and recorded override rationale, projects, tasks | `operational_tasks` (reused) + projects |
| Finance | Cash (cash basis), aging receivables, invoices, payment recording | finance |
| Approvals | Pending queue + history of governed actions (the one ledger) | `rinpo_actions` (reused) |
| People | Skills, capacity, load | people profiles |
| Studio / Assets | 19-stage pipeline with enforced gates; asset provenance, licensing, lineage, review, publishing history | studio tables |
| Growth / Ads | One campaign/content model across 12 channels; ad signals with visible numbers and thresholds; budget changes | growth tables |
| Engineering | GitHub / Vercel / Supabase read-only signals, release-readiness summary | env-gated adapters |
| AI | Provider registry, 12 role profiles, routing, runs, cost, errors | `@rinads/intelligence` + `ai_runs` |
| Commerce / Logistics | Read of existing orders/shipments/returns + bridges to the commerce portals | existing ERP tables |
| Communication / Academy | Activity log linked to records; skill graph → certification (advisory) | comms / academy |
| Platforms / Reports / Settings | Surfaces + daily close; action policy, catalogue, integration status | policy + catalogue |

### RINPO
`POST /api/os/rinpo` answers "How is RINADS today?" (and 12 other intents) from the caller's own permission-filtered facts: what happened, what changed, what is at risk, why it matters, owners, next steps, what RINPO can prepare, what needs approval, and which sections are unavailable. It is authenticated, rate-limited, read-only, tenant-scoped, makes **no model call**, and the dock falls back to the public chat when it cannot answer.

### Governed action runtime (one pipeline)
Request → context → permission → risk classification → approval policy → typed domain tool → postcondition `verify` → audit + canonical `….v1` event → result. ~48 catalogued actions. Agents are always propose-only. HIGH/CRITICAL always need a distinct approver; CRITICAL needs an admin/founder. Idempotency keys are enforced end to end. Production deploy, secret rotation, database migration, permission change and refund are in the catalogue as **non-executable**.

### AI workforce
12 roles as configuration (`packages/company-os/src/agents.ts`) beneath a provider-neutral `AgentWorker` port. Routing authority stays in `@rinads/intelligence` (`selectRinpoModel`); Grok, Claude, OpenAI or Google are replaceable workers. No provider is wired as an executor in this release.

---

## 2. Schema, migrations and RLS

Seven additive migrations, none applied anywhere, none destructive, none touching existing tables except additive `rinpo_actions` / `operational_tasks` columns and policies:

| Migration | Contents |
|---|---|
| `20261016120000_company_os_permissions` | permission keys + role grants |
| `…120100_company_os_ledger_events` | `rinpo_actions` columns, helpers, ledger state-machine trigger, restrictive/select/update policies, event + audit guards |
| `…120200_company_os_crm_sales` | companies, contacts, opportunities, leads, proposals, contracts |
| `…120300_company_os_delivery_finance` | projects, milestones, deliverables, invoices, payments; task columns + write policies |
| `…120400_company_os_people_work` | people profiles, work assignment decisions |
| `…120500_company_os_studio_growth` | campaigns, studio jobs, assets, content, publications, performance, ad campaigns, daily metrics, ad-budget trigger |
| `…120600_company_os_comms_academy_ai` | comms, academy, `ai_runs`, `ai_agent_profiles` |

- 26 new tenant tables, each with deliberate RLS (select / insert / update by permission; composite `(organization_id, id)` foreign keys prevent cross-tenant links).
- **Zero `SECURITY DEFINER` functions added** (the two textual matches are comments); helpers are `SECURITY INVOKER`. This deliberately avoids the PR #115 privilege-drift class.
- DB-enforced approval gates (`private.company_os_is_approved_action`) on: proposal send, contract signature, invoice issue / void, payment record, content publish, asset publication, and ad budget changes (trigger). A payment/publication row cannot exist without an approved ledger row of the right type, and one approval authorises exactly one payment.
- Rollback: `supabase/rollback/20261016120000_company_os_rollback.sql` (deliberately outside `migrations/`). Tested: apply → rollback → identical baseline → re-apply.

## 3. Permission changes

23 new permission keys (`company.founder.view`, `crm.read|manage`, `projects.read|manage`, `finance.read|manage`, `people.read|manage`, `studio.read|manage`, `growth.read|manage`, `engineering.read`, `ai.read|manage`, `comms.read|manage`, `academy.read|manage`, `reports.read`, `approvals.read|decide`). Founder / super_admin / admin hold all; manager holds the operating subset (not `finance.manage`, `company.founder.view`, `ai.manage`); staff holds read-only on CRM/projects/Studio/Growth/comms/academy/approvals; client and viewer hold none. **No existing role loses a permission.**

Documented widening to review: `operational_tasks` write policies now also admit holders of `tasks.manage` (needed for governed task creation/updates).

## 4. Runtime actions and integrations

- Server actions `submitOsAction` / `decideOsAction` take only an action key + input + idempotency key from the browser; tenant, role and permissions come from the session.
- **Service role is referenced in exactly one file** (`lib/company-os/site-leads.ts`): a read-only `select` of website leads, enabled only when `SUPABASE_SERVICE_ROLE_KEY` **and** `COMPANY_OS_SITE_LEADS_ORG_ID` are set. Enforced by a test.
- Engineering adapters (GitHub / Vercel / Supabase health) are read-only, env-gated, time-limited, token-redacted, cached 60 s. Missing credentials ⇒ "not connected".
- No worker was enabled. No auth config, secret or production integration was touched. `.env.example` documents the new optional variables.

## 5. Verification actually run (this sandbox, 2026-10-16)

| Check | Result |
|---|---|
| `pnpm lint` (27 tasks) | **0 errors**, 2 pre-existing warnings in other apps/tests |
| `pnpm typecheck` (27 tasks) | **pass** |
| `pnpm test` (48 tasks) | **pass** — `company-os` 217, `company-os-server` 42, `website` 289 (277 pre-existing + 12 new), all other packages unchanged |
| Real-Postgres (PGlite) DB tests | **pass** — 68 tests: migration safety, RLS, cross-tenant isolation, approval gates, ledger state machine, rollback/re-apply |
| `pnpm build` | `website` builds (30 `/os` routes + `/api/os/rinpo`). `storefront`, `customer-portal`, `rinaglow` each build **individually (exit 0)**; under `turbo` one of them intermittently fails because `next/font` cannot fetch Google Fonts through this sandbox proxy (reproduces on the unchanged storefront; those apps import no Company OS package). **Not yet confirmed green in CI.** |
| Playwright (local dev server, **demo-auth mode**) | **26 passed, 4 skipped** (founder/staff personas need credentials) |
| `pnpm ops:preflight` | **fails by design here** — no production env in the sandbox (Supabase URL/keys, Twilio, Razorpay absent). Not a regression; must be re-run in the target environment. |
| `pnpm ops:verify` | **not run against any target** (needs `--website`/`--glow` URLs and credentials). |

What the tests prove: lifecycle state machines; money maths; aging; weighted pipeline basis; allocation explainability; attention ordering; client-risk rules; briefing structure; policy engine (ALLOW / APPROVAL_REQUIRED / DENY, distinct approver, CRITICAL admin-only); idempotent replay; postcondition verification; rollback on partial failure; cross-tenant isolation; that a forged or reused approval cannot satisfy a DB gate; that pages are gated and never query the database directly; that service role is contained; that the RINPO endpoint is authenticated, read-only and model-free.

What they do **not** prove: behaviour on real Supabase, real auth cookies/org switching, browser rendering of authenticated pages, real GitHub/Vercel responses, performance at volume.

## 6. Evidence still missing

- Preview / staging deployment of this branch — **none**.
- Authenticated UAT with founder, manager and staff personas — **none**.
- Migrations applied to Supabase staging and RLS verified there — **none**.
- CI status on PR #128 for the final commit — **not collected** (I do not have the CI result in this session).
- Accessibility audit beyond semantics (labelled forms, table captions, live regions; form and primary buttons are 44 px, row-level quick actions are 36 px) — **no automated or manual audit run**.
- Console-error sweep of authenticated pages — **only written (founder-run spec), not executed**.
- Public-site regression: the 277 existing website tests, the production build and the anonymous Playwright smoke (home, health, pricing, `/os` gating) pass; no public route, redirect, metadata or content file was changed. A visual diff against production was **not** performed.

## 7. Security findings

Open, ranked:

1. **(Medium) Approval for human-initiated HIGH actions on tables without a DB gate is enforced at the application layer only.** DB gates exist for the money, contract, publish and budget paths listed above; other HIGH classifications (e.g. a future table) must add a gate. Mitigation: the pipeline is the only code path, tested; add DB gates when new HIGH actions are added.
2. **(Medium) Solo-founder deadlock for CRITICAL actions:** CRITICAL needs a distinct admin/founder approver, so a one-person organisation cannot execute them until a second admin exists. Safe, but operationally surprising; by design.
3. **(Medium) `operational_tasks` write-policy widening** to `tasks.manage` holders — review before production.
4. **(Low) In-memory rate limits** (`/api/os/rinpo`: 20/min per user/org) are per-instance; they bound a single node only. Use the platform WAF for global limits.
5. **(Low) Applied-migration count is not read** (needs a privileged token); shown as "Not read", never guessed.
6. **(Low) Tenant approval-policy editing UI is not built**; the policy is read from `tenant_policies` key `company_os.actions`, defaults are the strict ones.
7. **(Info) No verified delivery-history source exists**, so allocation excludes the "history" factor rather than guessing. Academy certification only raises confidence.
8. **(Info) Prompt/model egress:** the Company OS makes no model calls in this release; the existing public chat path is unchanged.

Not found: service-role in client code, model→database write path, SECURITY DEFINER additions, anonymous table access, cross-tenant read/write in the DB tests.

PR #115 and #119 were not bypassed or duplicated. Draft PRs #121, #120, #113, #112, #104 were reviewed for overlap and not merged or cherry-picked; expect a trivial conflict with #120 in `lib/os-nav.ts`.

## 8. Credentials, configuration and decisions needed from the founder

Exact manual actions (none were performed automatically):

1. **Apply the seven migrations to Supabase staging** (never production first). Then run the DB checks in `docs/company-os/ARCHITECTURE.md` and `pnpm ops:verify` against staging.
2. **Create test personas** in a staging organisation: founder/admin, manager, staff, client, and a second organisation for cross-tenant checks; set `E2E_BASE_URL`, `E2E_FOUNDER_*`, `E2E_STAFF_*` and run `pnpm test:e2e`.
3. **Deploy the branch to a Vercel preview** pointing at staging Supabase.
4. Optional integrations (each fails closed if absent): `COMPANY_OS_GITHUB_TOKEN` (+ `COMPANY_OS_GITHUB_REPO`), `COMPANY_OS_VERCEL_TOKEN` / `COMPANY_OS_VERCEL_TEAM_ID` / `COMPANY_OS_VERCEL_PROJECTS` (read-only scopes only), `COMPANY_OS_SITE_LEADS_ORG_ID` (+ existing `SUPABASE_SERVICE_ROLE_KEY`), and AI provider keys via the existing `@rinads/intelligence` variables.
5. **Decide** the PR #115 → #119 sequence; the Company OS will not raise autonomy before the #119 release gate passes.
6. After staging UAT and security verification, give written approval before any production migration or merge. Rollback file is ready if staging reveals a defect.

## 9. Gate to move from CONDITIONAL GO → GO

- [ ] CI green on PR #128 final commit
- [ ] Migrations applied to staging, DB tests re-run there, RLS cross-tenant checks pass
- [ ] Authenticated founder / manager / staff UAT recorded (screenshots + spec output)
- [ ] Console and server logs clean during UAT
- [ ] `pnpm ops:preflight` and `pnpm ops:verify` pass against staging
- [ ] #115 / #119 status resolved per section 8
- [ ] Open security findings 1–3 accepted or fixed
- [ ] Founder written approval for production migration and merge
