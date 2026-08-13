# Priority Matrix

**Date:** 2026-08-13  
**P0** = security / architectural blockers  
**P1** = core foundation  
**P2** = important product capabilities  
**P3** = optimization / polish  

---

## P0 — Security / architectural blockers

| ID | Item | Notes |
|----|------|-------|
| P0-1 | Retire plaintext localStorage passwords | SEC-P0-01 |
| P0-2 | Stop spoofable founder/super-admin self-signup | SEC-P0-02 |
| P0-3 | Decide & lock platform vs website-monolith boundary | ADR-001 |
| P0-4 | Decide monorepo adoption | ADR-002 |
| P0-5 | Do not store real tenant/business data until RLS exists | Blocker for portals |

**Rule:** No CRM/ERP/client invoice data before P0 cleared.

---

## P1 — Core foundation

| ID | Item |
|----|------|
| P1-1 | Monorepo skeleton + `apps/website` |
| P1-2 | Supabase Auth + profiles |
| P1-3 | Organizations + memberships |
| P1-4 | RBAC + RLS + tests |
| P1-5 | Audit logs |
| P1-6 | Feature flags |
| P1-7 | `packages/brand` + `packages/ui` (shadcn) |
| P1-8 | CI (lint/typecheck/test) + staging deploy |
| P1-9 | Rate limit + validate `/api/chat` |
| P1-10 | Env strategy + `.env.example` |
| P1-11 | Official logo assets in brand package |
| P1-12 | Documentation set maintained under `docs/` |

---

## P2 — Important product capabilities

| ID | Item |
|----|------|
| P2-1 | Intelligence app shell |
| P2-2 | RINPO tool registry (read/recommend) |
| P2-3 | AI orchestration package |
| P2-4 | Approval workflow (for future writes) |
| P2-5 | Client portal app (real), separate from marketing |
| P2-6 | SEO suite (OG, sitemap, per-route metadata, RSC content) |
| P2-7 | Versioned RINPO asset library |
| P2-8 | Notifications primitive |
| P2-9 | Files metadata + Storage isolation |
| P2-10 | Remove or justify Three.js dependency |
| P2-11 | Error/not-found/loading routes |
| P2-12 | n8n for non-core operational workflows only |

---

## P3 — Optimization / polish

| ID | Item |
|----|------|
| P3-1 | Expand RINPO expression state machine |
| P3-2 | Performance budgets / bundle analysis |
| P3-3 | A11y pass (dialogs, skip links, expanded menus) |
| P3-4 | Deduplicate contact constants |
| P3-5 | Fix orphan Geist mono token |
| P3-6 | Marketing motion refinement |
| P3-7 | Asset filename hygiene |
| P3-8 | Advanced model routing / cost controls |
| P3-9 | Recharts analytics widgets (after data exists) |

---

## Mapping to roadmap

| Phase | Priority focus |
|-------|----------------|
| 0–30 days | All P0 + selected P1 |
| 31–60 days | Remaining P1 |
| 61–90 days | Selected P2 (Intelligence + RINPO tools) |
| Post-90 | Remaining P2/P3 + verticals |
