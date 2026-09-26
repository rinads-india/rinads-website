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

**Release name / SHA:** ______________________

### Safe code merged

- [ ] PR list: ______________________
- [ ] CI green on merged commits
- [ ] No secrets in git diff

### Production-changing (tick only if approved)

- [ ] Founder approves merge/deploy of SHA ________
- [ ] Founder approves migration apply: ________ (list versions)
- [ ] Founder approves secret changes: ________ (names only, not values)
- [ ] Founder approves Twilio sandbox test send
- [ ] Founder approves worker enablement for org allowlist: ________
- [ ] Founder confirms communications remain disabled for production blast

### Verification after change

- [ ] `www` + `glow` `/api/health` PASS
- [ ] Auth smoke (personas) PASS or explicitly deferred
- [ ] No fabricated metrics shipped in copy

**Founder name:** ______________________  
**Date (UTC):** ______________________  
**Signature / ack:** ______________________

## D. Current recommendation (2026-09-26)

| Slice | Recommendation |
|-------|----------------|
| Public marketing site at `67473ae` | Accept as **PARTIAL** commercial surface; continue claim hygiene |
| Lead capture persistence | **API-proven** (`stored: true`); optional Table Editor confirm |
| Business OS authenticated | **Do not** declare production-ready until SECURITY-TENANCY SKIP tests PASS |
| Auth allowlist + cookie env | Founder dashboard confirm still required |
| R GLOW messaging | **Keep workers/Twilio off** until this checklist is signed |
| Digital Store / staff apps | **PLANNED only** — not launched |

Companion: [LIVE-E2E-VERIFICATION-2026-09-26.md](./LIVE-E2E-VERIFICATION-2026-09-26.md), [PRODUCTION-TRUTH.md](./PRODUCTION-TRUTH.md), [RELEASE-ACCEPTANCE.md](./RELEASE-ACCEPTANCE.md), [PR-EXECUTION-PLAN.md](./PR-EXECUTION-PLAN.md).
