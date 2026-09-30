# Prioritized implementation backlog

**Audit date:** 2026-09-25  
**Dependencies:** Later items must not start production-changing work without [FOUNDER-SIGNOFF.md](./FOUNDER-SIGNOFF.md).

## P0 — release integrity (this week)

| ID | Item | Depends on | Owner | Status (2026-09-30) |
|----|------|------------|-------|---------------------|
| P0-1 | Publish founder-audit docs (this package) | — | Agent (docs PR) | Done on `main`; refresh in progress |
| P0-2 | Disposition open #79 (lint unblock) | P0-1 optional | Founder | Closed / absent from open PR list |
| P0-3 | Authenticated `/os` + salon→glow smoke with real accounts | Test credentials | Founder + agent assist | **EXPLICITLY DEFERRED** 2026-09-30 — no `E2E_*` creds; unauth PASS |
| P0-4 | Confirm `site_leads` + salon migrations applied on production Supabase | Supabase access | Agent (MCP) | **DONE** — `rinads-platform` through `site_leads` |
| P0-5 | Do **not** enable Twilio/workers until sandbox checklist signed | P0-4 | Founder | **KEEP OFF** reconfirmed 2026-09-30 |
| P0-6 | Confirm Auth redirect allowlist (www / apex / glow) | Supabase dashboard | Founder | **EXPLICITLY DEFERRED** — dashboard sign-in wall |
| P0-7 | Cookie domain `.rinads.com` on website + rinaglow | Vercel | Agent (MCP) | **DONE** |
| P0-8 | Merge docs ops refresh + Gate A | CI green | Founder/agent | **DONE** — #96 → `f273306` |

## P1 — commercial + OS honesty

| ID | Item | Depends on | Notes |
|----|------|------------|-------|
| P1-1 | PAGE-MATRIX measured defects only (forms, a11y, confirmation copy) | Preview URL | No redesign |
| P1-2 | Lighthouse + mobile + a11y audit on preview; record scores | Preview | Never invent scores |
| P1-3 | OS module empty states / bridge honesty (Customers, Money, Rooms, …) | #78 on main | Small PR |
| P1-4 | Close or full-rebase #70 (conflicts with commercial `/projects`) | Product decision | Do not merge as-is |
| P1-5 | Disposition #36 vs optional GTM (`NEXT_PUBLIC_GTM_ID`) | Analytics choice | Avoid duplicate analytics |

## P2 — R GLOW ops + intelligence pilot

| ID | Item | Depends on | Notes |
|----|------|------------|-------|
| P2-1 | Refresh cutover doc evidence (DNS/health now green) | — | Docs |
| P2-2 | Twilio sandbox send + webhook status transitions | Secrets + consent | Founder ops |
| P2-3 | Communications worker allowlist for one staging org | P2-2 | Flag off by default |
| P2-4 | RINPO pilot: appointment context → draft WhatsApp confirmation + audit/budget | Intelligence package | Code PR; send still gated |
| P2-5 | Digital Store / staff phone — separate epic | Explicit approval | PLANNED only |

## P3 — enterprise presentation

| ID | Item | Depends on | Notes |
|----|------|------------|-------|
| P3-1 | Outcome-based journey copy on existing routes | Verified capabilities only | No brand redesign |
| P3-2 | Counsel legal copy | Counsel | Replace AwaitingCounsel when ready |
| P3-3 | Verified customer proof when available | Sales evidence | Never invent |

## Explicitly out of backlog inventing

- Fake case-study metrics, prices, uptime SLAs, security certifications.
- Duplicate Supabase projects or parallel product codebases.
- Claiming Digital Store / staff apps launched.
