# Production truth — RINADS Founder Audit

**Audit date:** 2026-09-25 (UTC); **live E2E refresh:** 2026-09-26  
**Auditor run:** Cursor Cloud Agent (`bc-01a0d63b-8603-7c00-8376-d9afe406ea81`)  
**Repository:** `rinads-india/rinads-website`  
**Latest live evidence:** [LIVE-E2E-VERIFICATION-2026-09-26.md](./LIVE-E2E-VERIFICATION-2026-09-26.md)  
**Claim policy:** Every row includes evidence and access limitations. Labels are mutually exclusive per claim. Never invent metrics, customers, prices, certifications, or readiness.

## Labels

| Label | Meaning |
|-------|---------|
| **BUILT** | Present in repository source on the audited SHA |
| **MERGED** | Merged into `main` |
| **DEPLOYED** | Serving on a production hostname at a known deploy SHA |
| **TESTED** | Exercise proven in this audit (or cited prior CI with run link) |
| **PARTIAL** | Some of the claim is true; gaps listed |
| **DEMO** | Demo/local-store or marketing simulation path only |
| **BLOCKED** | Cannot verify or cannot enable without founder/ops access |
| **PLANNED** | Documented follow-up; not claimed as shipped |

## Git and deploy baseline

| Claim | Label | Evidence | Access limitation |
|-------|-------|----------|-------------------|
| Audited `main` SHA (2026-09-26) | MERGED | `67473ae` — `Secure production access to RINADS internal portals (#86)` | Local `git` + GitHub |
| Production website SHA | DEPLOYED | GitHub Deployments `Production – rinads-website` 2026-09-26T09:27:49Z → `67473ae` | Vercel MCP cannot read rinads projects (404/empty); SHA from GitHub Deployments API |
| Production R GLOW SHA | DEPLOYED | GitHub Deployments `Production – rinaglow` 2026-09-26T09:27:17Z → `67473ae` | Same Vercel MCP gap |
| PRs #73–#86 (commercial, OS, R GLOW, RINPO, docs, portals) | MERGED | GitHub PR state MERGED | — |
| Open PRs (2026-09-26) | PARTIAL | #79 superseded lint, #70 stale intake, #36 analytics, #87 Unity scaffold (review only) | Housekeeping: close #79/#70/#36 |

### Recent `main` history (evidence)

```
67473ae Secure production access to RINADS internal portals (#86)
235e888 feat(website): outcome-based journey IA on platform and solutions (#85)
13d0a13 fix(website): honest lead ack, form a11y, pricing contact copy (#84)
… includes #80–#83 founder-audit, BOS empty states, cutover, RINPO pilot
```

## Access limitations (apply to all rows below)

1. **Supabase MCP:** `needsAuth` — cannot list applied migrations, live RLS, Auth redirect allowlist, or confirm `site_leads` table exists in production.
2. **Vercel MCP:** `list_projects` OK (`rinads-website`, `rinaglow` on team `rinadss-projects-1ebcffe7`); `get_project` / `list_deployments` forbidden/not found — cannot read env keys, root directory, or deployment logs via MCP.
3. **No founder test credentials** — cannot authenticate into `/os`, R GLOW console, or multi-tenant flows.
4. **Secrets / Twilio / workers** — not readable; communications delivery remains BLOCKED until sandbox send + explicit enablement.

---

## Platform architecture

| Claim | Label | Evidence | Limitation |
|-------|-------|----------|------------|
| Six Next.js apps monorepo | BUILT | `apps/{website,rinaglow,storefront,customer-portal,owner-portal,platform-admin}` — Next 16.x | — |
| Shared CORE packages (auth, tenancy, permissions, database, brand, ui) | BUILT | `packages/*` | — |
| Salon + commerce + operations + intelligence packages | BUILT | `packages/salon*`, `commerce*`, `operations*`, `intelligence` | — |
| CI: lint, typecheck, test, build on PR/`main` | BUILT / TESTED | `.github/workflows/ci.yml`; #79 CI SUCCESS | No Playwright job in CI |
| Playwright full E2E in CI | PLANNED | Absent from workflow; cutover docs defer | — |

---

## Public commercial website (`www.rinads.com`)

Probed 2026-09-25 via HTTPS (agent egress). Apex `rinads.com` → 307 → `https://www.rinads.com/`.

| Route / capability | Label | Evidence | Limitation |
|--------------------|-------|----------|------------|
| `/` | DEPLOYED | HTTP 200; title contains RINADS AI Operating Platform | HTML only; no authenticated session |
| `/platform` | DEPLOYED | HTTP 200 | — |
| `/solutions` | DEPLOYED | HTTP 200 | — |
| `/rinpo` | DEPLOYED | HTTP 200 | — |
| `/pricing` | DEPLOYED | HTTP 200 | Numeric prices not claimed as verified commercial offers |
| `/security` | DEPLOYED | HTTP 200 | No SOC2/ISO claims verified |
| `/contact` | DEPLOYED | HTTP 200; LeadForm present in source (#73) | Live insert into DB not proven |
| `/projects` | DEPLOYED | HTTP 200 | Guided intake from #70 **not** on `main` |
| `/academy` | DEPLOYED | HTTP 200 | — |
| `/customers`, `/about`, `/services*`, `/docs`, `/developers/*`, `/integrations`, `/changelog`, `/careers`, `/status`, `/legal/*` | BUILT / DEPLOYED | Route registry + commercial rebuild #71–#73 | Spot-checked registry; not every subroute HTTP-probed this run |
| `/api/health` productionEnvContract | TESTED | `{"status":"ok","checks":{"productionEnvContract":"ok"}` | Contract check only — not full dependency health |
| Lead API (`/api/leads`) live persistence | TESTED | 2026-09-26 POST → `{ok:true,stored:true,id:32188892-…}` | Table Editor row view still needs founder Supabase UI |
| `site_leads` migration in repo | BUILT / MERGED | `supabase/migrations/20260924100000_site_leads.sql` | Full migration **list** on prod still BLOCKED (Supabase auth); persistence path proven live |
| GTM / analytics IDs | PARTIAL | Optional `NEXT_PUBLIC_GTM_ID`; dataLayer sink in AnalyticsProvider | Whether production IDs set = BLOCKED (env unread) |
| Counsel-approved legal copy | BLOCKED / PLANNED | `AwaitingCounselNotice` on legal shells | Needs counsel |
| Verified case studies / logos / numeric pricing | BLOCKED / PLANNED | Commercial PROGRESS.md leftovers | Must not invent |
| Lighthouse scores | BLOCKED | Not run against preview in this Phase 0 docs PR | Run on preview after founder OK |

---

## Business OS (`/os`)

| Claim | Label | Evidence | Limitation |
|-------|-------|----------|------------|
| `/os` unauthenticated → login | TESTED | Live `/os` returns Sign Up page (HTTP 200 after redirect) | Does not prove membership gate for authed users |
| Nested `/os/*` membership gate | MERGED / DEPLOYED | #75 `requireOsShellAccess()` in `apps/website/lib/os-shell-access.ts`; layout invokes for all `/os/*` | Authed multi-tenant E2E not re-run this audit |
| Org-role destinations / bridge tiers | MERGED | #75 `OsOrgRoleProvider`, `minTier`, `external_public` vs `available` | Live privileged link behaviour needs credentials |
| Mobile More dialog a11y | MERGED | #75 PR body cited Playwright passes | Playwright not in CI; not re-run here |
| Home Command Centre | MERGED / DEPLOYED | #78 on `main` / prod SHA `eb7a95a` | Live vs demo data paths need authed session |
| Module bridges (Customers, Work, Money, Growth, Automate, Rooms, Settings) | PARTIAL | Routes + `OsModuleBridge` exist; many destinations `external_public` or unavailable | Useful empty states / real modules vary |
| Demo auth bypass when not Supabase mode | DEMO | `requireOsShellAccess` returns `{enforced:false}` if `!isSupabaseMode()` | Production must keep Supabase fail-closed (health contract suggests OK) |
| Lead → invoice end-to-end | BLOCKED | Requires tenant credentials + commerce data | — |

---

## R GLOW (`glow.rinads.com`)

| Claim | Label | Evidence | Limitation |
|-------|-------|----------|------------|
| DNS + HTTPS login | DEPLOYED | DNS resolves via Vercel; `/login` shows R GLOW + `rglow-logo`; health OK | Cutover notes from 2026-09-21 (DNS missing) are **stale** |
| Console routes in code | BUILT | `/dashboard`, `/calendar`, `/pos`, `/clients`, `/growth`, `/loyalty`, `/campaigns`, `/communications`, `/staff`, `/settings`, `/feedback/[token]` | Authed operator smoke = BLOCKED |
| Brand align (#76) | MERGED / DEPLOYED | Assets in `apps/rinaglow/public/assets/` | — |
| Salon → glow SSO after website login | PARTIAL | Code in `post-auth-destination` / tenancy vertical salon | Cross-host cookie E2E = BLOCKED (needs credentials + `.rinads.com` cookie proof) |
| Twilio WhatsApp live send | BLOCKED | Code returns `not_configured` without secrets | Sandbox credentials + consent required |
| Communications worker enabled | BLOCKED | Off by default (`RINADS_COMMUNICATIONS_WORKER_ENABLED`) | Founder enablement only |
| Digital Store / Staff phone app | PLANNED | `docs/rglow/PROTOTYPE-GAP.md` | Do not claim launched |
| Migrations applied through loyalty expiry + site_leads | PARTIAL | `site_leads` path live via API; salon/loyalty list unknown | Supabase MCP unauthenticated |

---

## RINPO / intelligence

| Claim | Label | Evidence | Limitation |
|-------|-------|----------|------------|
| Deterministic NLU default | BUILT | `packages/intelligence` `createRinpoNluAdapter()` | — |
| Optional LLM adapter | BUILT / PARTIAL | `LlmRinpoNluAdapter` if `RINADS_RINPO_LLM_API_KEY` | Whether key set in prod = BLOCKED |
| Salon tool registry incl. `send_appointment_confirmation` | BUILT | `packages/intelligence/src/registry.ts` | Execution observability pilot = PLANNED |
| Public website `/api/chat` | DEMO / PARTIAL | Rule-based; marketing/OS preview replies — not live tenancy data | Must not be sold as live AI ops |
| Voice / Phone product pages | PARTIAL | Marketing/story surfaces; not verified telephony provider integration | Distinguish simulated vs provider |
| Vector / `match_business_data` | PLANNED | STATUS.md pending | — |

---

## Secondary apps / hosts

| Claim | Label | Evidence | Limitation |
|-------|-------|----------|------------|
| `admin.rinads.com` responds | PARTIAL | HTTP 200 + Vercel DNS (2026-09-25 probe) | Not audited for auth or content truth |
| `store` / `shop` / `portal` / `owner` / `app` subdomains | BLOCKED / PLANNED | DNS none / connection fail this probe | Storefront/portals may be Vercel-only aliases |
| Ambady storefront ≠ R Glow store | BUILT | Documented in PROTOTYPE-GAP | — |

---

## Explicit non-claims

- No SOC 2 / ISO / uptime SLA certification claimed.
- No customer logos, case-study metrics, or currency prices treated as commercially binding.
- No “AI can do X in production” beyond tools that exist in code with permission gates.
- No assertion that the full salon migration chain is applied until Supabase dashboard list is confirmed (lead persistence alone is proven).

## Supersedes

Prefer this file over stale go/no-go language in `docs/STATUS.md` (pre-#78 latest-work note), `docs/commercial-readiness/PHASE-0-AUDIT.md`, `docs/architecture/AUDIT_GAP_ANALYSIS.md` (2026-08-13), and the 2026-09-21 DNS note inside `docs/deployment/RGLOW_PRODUCTION_CUTOVER.md`.
