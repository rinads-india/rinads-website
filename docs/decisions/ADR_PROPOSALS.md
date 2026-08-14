# ADR Proposals (ADR-001 … ADR-012)

**Date:** 2026-08-13  
**Status:** PROPOSED — awaiting Founder approval  
**Note:** Files are proposals for review. Formal acceptance should set each ADR to Accepted/Rejected with date.

---

## ADR-001 — RINADS platform architecture

**Decision:** Build RINADS as a layered platform (CORE → shared services → Intelligence → RINPO → verticals → client experiences), with Public Experience as a separate entry app.

**Context:** Constitution requires reusable multi-tenant platform; current repo is a website.

**Options:** (A) Grow website into monolith ERP (B) Layered platform with separate apps (C) Many disconnected repos without shared packages

**Chosen:** B

**Why:** Maximizes reuse, preserves marketing independence, matches CALM→SCALE.

**Trade-offs:** More upfront structure; slower first feature vs dumping into website.

**Consequences:** New capabilities evaluated for CORE vs app; no ERP tables behind `/services`.

---

## ADR-002 — Monorepo vs single repository

**Decision:** Adopt a monorepo (`apps/*` + `packages/*` + `supabase/` + `docs/`).

**Context:** Multiple products (website, intelligence, client, RINAGLOW) will share auth/UI/DB.

**Options:** (A) Keep single website repo forever (B) Monorepo (C) Polyrepo with published packages

**Chosen:** B (pnpm workspaces + Turborepo recommended default)

**Why:** Shared migrations/types/UI with atomic PRs; lower publish overhead than polyrepo for a small team.

**Trade-offs:** Tooling complexity; need clear app deploy boundaries.

**Consequences:** First BUILD step is skeleton migration; website becomes `apps/website`.

---

## ADR-003 — RINADS CORE boundaries

**Decision:** CORE = identity, organizations, memberships, RBAC, feature flags, audit, files metadata, notifications primitives, shared types/UI/brand — not vertical business modules.

**Context:** Risk of stuffing CRM/ERP into CORE or into website.

**Chosen:** Thin CORE platform packages + Supabase schema domains listed in database target doc.

**Why:** Verticals can evolve independently; CORE stays stable.

**Trade-offs:** Some features need explicit “promote to CORE” decisions.

**Consequences:** RINAGLOW/CRM live in apps/modules that depend on CORE.

---

## ADR-004 — Supabase architecture

**Decision:** Supabase is the primary backend (Auth, Postgres, Storage, Edge Functions where justified). One project per environment. Migrations in-repo under `supabase/`.

**Context:** Constitution technology stack.

**Chosen:** Supabase over custom Node API or Firebase.

**Why:** Aligns with Auth+RLS+Storage; speed with control.

**Trade-offs:** Vendor coupling mitigated by SQL-first design and migration ownership.

**Consequences:** No production project link until auth quarantine + ADRs accepted.

---

## ADR-005 — Multi-tenancy

**Decision:** Organization-centric tenancy. Every tenant-sensitive row carries `organization_id`. RLS enforces membership. Users may belong to multiple orgs; org switcher is a first-class UX in authenticated apps.

**Context:** SaaS requirement; currently absent.

**Chosen:** Shared-database, shared-schema, row-level isolation (not database-per-tenant initially).

**Why:** Operational simplicity at early scale; RLS is mandatory.

**Trade-offs:** Must be rigorous about policies; noisy-neighbor risk later may force pooling strategy.

**Consequences:** No feature with tenant data ships without org_id + RLS.

---

## ADR-006 — Authentication

**Decision:** Supabase Auth is the only production auth. Demo localStorage auth is retired or feature-flagged as non-production demo and must not store plaintext passwords.

**Context:** SEC-P0 findings.

**Chosen:** Email/password and/or magic link initially; OAuth later as needed. Privileged roles never self-serve from public signup.

**Why:** Security baseline.

**Trade-offs:** Migration work for any demo users (prefer discard).

**Consequences:** Website login UX redesigned to real auth when flag enabled.

---

## ADR-007 — Authorization / RBAC

**Decision:** Permission-based RBAC evaluated in database (RLS helpers) and application services. UI hiding is never sufficient. AI tools require permission keys and danger levels.

**Context:** Constitution §32–33, §28.

**Chosen:** roles → permissions → member assignment; optional overrides later.

**Why:** Scales across Intelligence and verticals.

**Trade-offs:** More schema than role-enum-only.

**Consequences:** Tool `execute_arbitrary_sql` is forbidden.

---

## ADR-008 — RINPO architecture

**Decision:** RINPO is the human-facing intelligence interface, not a mascot-only widget. Canonical character bible is authoritative; no casual redesign. Public Experience hosts a RINPO shell; intelligence capabilities come from `packages/ai` + permissioned tools.

**Context:** Early RINPO UI exists; AI/tools do not.

**Chosen:** Shell in apps; brain in platform packages.

**Why:** Prevents website-bound AI spaghetti; preserves brand consistency.

**Trade-offs:** Two-layer evolution (UI then brain).

**Consequences:** Asset versioning under `assets/rinpo/`; states expanded carefully.

---

## ADR-009 — AI tool architecture

**Decision:** AI is advisory by default. Structured narrow tools only. Pipeline: READ → ANALYZE → RECOMMEND → APPROVAL → EXECUTE. PostgreSQL remains source of truth. Tool invocations and approvals are audited. Actor may be `ai` with `approved_by` user.

**Context:** Constitution §29–31.

**Chosen:** Tool registry + permission checks + approval for destructive/financial actions.

**Why:** Safety and commercial reliability.

**Trade-offs:** Slower autonomy; more engineering than chat-only.

**Consequences:** Keyword `/api/chat` is not the Intelligence architecture; replace behind gateway later.

---

## ADR-010 — RINADS design system

**Decision:** Shared `packages/brand` (tokens, logo, Figtree) + `packages/ui` (shadcn/ui-based). Canonical colors `#9F4BC7` / `#FFFFFF` / `#000000`. Extended dark atmosphere tokens documented. No arbitrary brand redesign without Founder approval.

**Context:** Tokens exist only in website CSS; logo asset missing in app.

**Chosen:** Extract and standardize; gradual component migration.

**Why:** Multi-app consistency; constitution §18–19.

**Trade-offs:** Migration churn on class names.

**Consequences:** New apps must consume packages; no fork of Button per app.

---

## ADR-011 — Deployment architecture

**Decision:** Vercel for Next apps; GitHub as source of truth; GitHub Actions for lint/typecheck/test before production; staging + production environments; Supabase per env. Avoid unguarded CLI prod deploy as sole path.

**Context:** Current `vercel deploy --prod` script without CI.

**Chosen:** CI-gated deployments; optional CLI for emergencies (EMERGENCY mode).

**Why:** Reliability and security.

**Trade-offs:** Slightly slower ship loop.

**Consequences:** Protect `main`; required checks.

---

## ADR-012 — Environment strategy

**Decision:** Explicit `development` / `staging` / `production` with separate env vars. Document `.env.example` without secrets. Never expose service role to client. Feature flags control risky cutovers (auth, rinpo AI, billing).

**Context:** No env contract today.

**Chosen:** Three-env minimum; preview deployments use staging or ephemeral Supabase as policy dictates.

**Why:** Prevents accidental prod data use from marketing previews.

**Trade-offs:** Cost of extra Supabase project.

**Consequences:** BUILD phase adds env docs before CORE wiring.

---

## Approval checklist

| ADR | Founder decision | Date |
|-----|------------------|------|
| ADR-001 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-002 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-003 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-004 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-005 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-006 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-007 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-008 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-009 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-010 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-011 | ☐ Accept ☐ Reject ☐ Amend | |
| ADR-012 | ☐ Accept ☐ Reject ☐ Amend | |
