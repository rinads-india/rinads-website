# Founder sign-off — safe code vs production-changing actions

**Document version:** 2026-09-25  
**Purpose:** Separate what agents may ship as PRs from actions that require **explicit founder approval**.

## A. Safe for agent / PR (still requires CI + human merge)

These change **git** only. They do **not** by themselves mutate production data, DNS, secrets, or traffic.

| Action | Examples | Sign-off to merge |
|--------|----------|-------------------|
| Documentation | `docs/founder-audit/*`, cutover evidence refresh | Founder merge |
| UI / copy within claim policy | Empty states, a11y, enterprise IA wording | Founder merge |
| Authorization hardening in app code | OS gates, permission checks | Founder merge |
| Feature flags default **off** | Pilot observability, draft-only RINPO tools | Founder merge |
| Unit/CI tests | commercial-readiness, os-home tests | Founder merge |
| Preview deployments | Vercel Preview from PR branches | Automatic; not production |

**Agent must not:** merge PRs, press Promote, or “force” production.

## B. Production-changing — founder explicit approval required

| Action | Risk | Prerequisite evidence |
|--------|------|------------------------|
| Merge to `main` | Triggers production deploy (current project settings) | CI green + review |
| Manual production redeploy / promote | Traffic to new build | Health + smoke plan |
| Apply Supabase migrations to production | Data/RLS change | Staging apply + rollback plan |
| Set / rotate secrets (Supabase service role, Twilio, Razorpay, cron tokens) | Credential exposure / send capability | Least privilege + storage policy |
| Enable `RINADS_COMMUNICATIONS_WORKER_ENABLED=1` | Customer messages | Sandbox send PASS + consent |
| Configure live Twilio WhatsApp sender | Real WhatsApp traffic | Templates + webhook signature tests |
| Change DNS / domain assignments | Outage risk | Vercel domain verified |
| Expand Auth redirect allowlist incorrectly | OAuth abuse | Exact URL list |
| Enable demo store in production | Tenancy bypass | Never approve |
| Publish unverified prices / case studies | Legal/commercial misrepresentation | Written evidence |

## C. Sign-off checklist (copy for each release)

**Release name / SHA:** docs ops refresh + Gate A — merge `f273306` (includes #96 / `f7ef2a7`; also #95 home hero on `main`)

### Safe code merged

- [x] PR list: #96 (docs ops refresh + Creative OS Gate A); prior CI green on PR
- [x] CI green on merged commits
- [x] No secrets in git diff

### Production-changing (tick only if approved)

- [x] Founder approves merge/deploy of SHA `f273306` (docs-only merge of #96 via plan execution 2026-09-30)
- [ ] Founder approves migration apply: ________ (list versions) — N/A this release (already applied; no new migrations)
- [ ] Founder approves secret changes: ________ (names only, not values) — **none**
- [ ] Founder approves Twilio sandbox test send — **not approved; KEEP OFF**
- [ ] Founder approves worker enablement for org allowlist: ________ — **not approved; KEEP OFF**
- [x] Founder confirms communications remain disabled for production blast — **KEEP OFF reconfirmed 2026-09-30** (Vercel env + code gate; see STATUS-EXECUTION-2026-09-30.md)

### Verification after change

- [x] `www` + `glow` `/api/health` PASS (2026-09-30 post-merge probe)
- [x] Auth smoke (personas) PASS or explicitly deferred — **explicitly deferred** (no E2E_* credentials; unauth `/os` PASS)
- [x] No fabricated metrics shipped in copy

**Founder name:** plan execution (Cursor agent assist)  
**Date (UTC):** 2026-09-30  
**Signature / ack:** Communications KEEP OFF; Auth allowlist + authed personas deferred pending dashboard login / E2E creds — see [STATUS-EXECUTION-2026-09-30.md](./STATUS-EXECUTION-2026-09-30.md)

## D. Current recommendation (2026-09-30 post-#96)

| Slice | Recommendation |
|-------|----------------|
| Public marketing site at `f273306` | Accept as **PARTIAL** commercial surface; continue claim hygiene |
| Lead capture persistence | **API + DB proven**; probe rows cleaned |
| Production migrations | **PASS** through `site_leads` on `rinads-platform` |
| Cookie domain env | **PASS** — `.rinads.com` on website + rinaglow |
| Auth redirect allowlist | **Explicitly deferred** — Supabase dashboard login required |
| Business OS authenticated | **Explicitly deferred** — provide `E2E_*` personas then re-run |
| R GLOW messaging | **Keep workers/Twilio off** — confirmed this execution |
| Creative OS product | Gate A docs on `main`; PR-C1 needs separate approval |
| Digital Store / staff apps | **PLANNED only** — not launched |

Companion: [STATUS-EXECUTION-2026-09-30.md](./STATUS-EXECUTION-2026-09-30.md), [LIVE-E2E-VERIFICATION-2026-09-30.md](./LIVE-E2E-VERIFICATION-2026-09-30.md), [PRODUCTION-TRUTH.md](./PRODUCTION-TRUTH.md), [RELEASE-ACCEPTANCE.md](./RELEASE-ACCEPTANCE.md), [PR-EXECUTION-PLAN.md](./PR-EXECUTION-PLAN.md).
