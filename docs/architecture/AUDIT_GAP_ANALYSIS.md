# RINADS Architecture Gap Analysis

**Date:** 2026-08-13  
**Agent mode:** AUDIT (no product code, migrations, or production connections)  
**Repository audited:** `rinads-india/rinads-website` @ `main` (`8434645`)  
**Operating principle:** CALM → CONTROL → LEVERAGE → SCALE  

---

## Executive verdict

`rinads-website` is a **Next.js public marketing experience** with an early **RINPO UI shell** (2D character, phone overlay, rule-based bilingual chat, voice hooks, demo localStorage auth).

It is **not** RINADS CORE, **not** multi-tenant SaaS, **not** production auth, and **not** an AI intelligence platform.

Treat this repository as **RINADS PUBLIC EXPERIENCE**. Evolve the ecosystem around it. Do not grow it into an ERP monolith.

---

## 1. Repository audit

### 1.1 Directory structure (verified)

```
rinads-website/
├── app/                    # App Router (4 pages + 1 API)
├── components/
│   ├── layout/             # Header, GameBackground
│   └── rinpo/              # RINPO UI + phone screens
├── contexts/               # AuthContext (localStorage)
├── hooks/                  # voice, speech, guide
├── public/assets/          # RINPO + unnamed brand PNGs
├── scripts/                # push-to-github.sh
├── package.json            # single app, no workspaces
├── DNS-SETUP.md
└── README.md               # stock create-next-app (stale)
```

**Absent:** `docs/` (added by this audit only), `supabase/`, `apps/`, `packages/`, `tests/`, `middleware.ts`, `vercel.json`, `.env.example`, shadcn/ui, monorepo tooling.

### 1.2 Technology stack (package.json)

| Layer | Actual | Constitution target | Gap |
|-------|--------|---------------------|-----|
| Framework | Next.js 16.1.6 App Router | Next.js App Router | Aligned |
| Language | TypeScript 5, `strict: true` | TypeScript strict | Aligned |
| UI | React 19.2.3, Tailwind CSS v4 | Tailwind + shadcn/ui | **Missing shadcn/ui** |
| Motion | Framer Motion 12 | Framer Motion OK | Present |
| 3D | three + R3F + drei | Optional | **Present but mostly unused** |
| Backend | None (1 route handler) | Supabase | **Missing** |
| Auth | localStorage demo | Supabase Auth | **Critical gap** |
| State | React Context | Zustand only if needed | Context only (OK for now) |
| Charts | None | Recharts | N/A until analytics |
| Automation | None | n8n | Not started |
| Deploy | Vercel CLI script | Vercel + GHA | Partial (no CI) |

### 1.3 Routes

| Route | File | Type | Notes |
|-------|------|------|-------|
| `/` | `app/page.tsx` | Client | Marketing home |
| `/services` | `app/services/page.tsx` | Client | Services |
| `/rinads-cloud` | `app/rinads-cloud/page.tsx` | Client | Placeholder ERP/cloud |
| `/contact` | `app/contact/page.tsx` | Client | Static contact (no form submit) |
| `POST /api/chat` | `app/api/chat/route.ts` | Route handler | Rule-based EN/ML |

**Missing:** `error.tsx`, `not-found.tsx`, `loading.tsx`, `robots.ts`, `sitemap.ts`, nested layouts, middleware, server actions.

### 1.4 Component architecture

- **22** files use `"use client"`.
- All marketing pages are client components — RSC underused for SEO content.
- No server actions (`"use server"` absent).
- No shared design-system package; UI is page-local Tailwind.
- RINPO is globally mounted via `RinpoProvider` in root layout — appropriate for Public Experience, but must not become the home of CORE business logic.

### 1.5 Auth / state / storage

| Concern | Implementation |
|---------|----------------|
| Auth | `contexts/AuthContext.tsx` — client only |
| Users | `localStorage["rinads_users"]` with **plaintext passwords** |
| Session | `localStorage["rinads_auth"]` `{ username, role }` |
| Reminders | `localStorage["rinpo-reminders"]` |
| Voice/lang prefs | `rinpo-voice-output`, `rinpo-language` |

### 1.6 Assets

Under `public/assets/`:

- **Referenced:** `rinpo-chatbot.png`, `rinpo-intro-bg.png`
- **Dead reference path:** `rinpo-floating.png` only via unused `Rinpo3D.tsx`
- **Unreferenced / poorly named:** `rinpo-character.png`, `rinpo-eyes-open.png`, `rinpo-intro.svg`, multiple `Untitled_design*.png` and UUID-named PNGs

No versioned `assets/rinpo/master/` library as required by constitution §47.

### 1.7 SEO / a11y / performance / tests / deploy

| Area | Status |
|------|--------|
| SEO | Root title/description only; no OG/Twitter/robots/sitemap/canonicals/JSON-LD |
| A11y | Some `aria-label`s; missing dialog semantics, skip link, expanded menus |
| Performance | Client-heavy pages; Three.js deps shipped though 3D unused in live path |
| Error UX | Ad-hoc try/catch; no Next error boundaries |
| Tests | **Zero** unit/integration/E2E |
| Env | No `.env.example`; no `process.env` usage in app |
| Deploy | `npm run deploy` → Vercel prod CLI; DNS doc present; no GitHub Actions |

---

## 2. Security audit summary

Full detail: [../security/FINDINGS.md](../security/FINDINGS.md)

**Headline:** Authentication is **simulated** and **unsafe if mistaken for production**. Roles are spoofable. Chat API is open and unthrottled. No secrets found in repo (good). Contact has no data pipeline.

Immediate classification:

- **P0:** Plaintext password storage in localStorage; spoofable privilege roles including `founder` / `super-admin`
- **P1:** Unauthenticated/unthrottled `/api/chat`; no real route protection; demo auth UX may set false security expectations
- **P2:** Missing security headers/config documentation; no audit logging; no rate limits anywhere
- **P3:** Hardcoded public phone number (acceptable for marketing; centralize later)

**Do not connect production Supabase until demo auth is retired or clearly isolated.**

---

## 3. Multi-tenancy gap analysis

| Capability | Present? | Evidence |
|------------|----------|----------|
| Organizations | No | — |
| Tenants | No | — |
| Users (real) | No | localStorage only |
| Memberships | No | — |
| Roles (real RBAC) | Partial label only | UI role enum; no permissions table |
| Permissions | No | — |
| Tenant isolation | No | — |
| Org switching | No | — |
| RLS | No | No database |
| Backend authorization | No | No middleware / server checks |

**Conclusion:** Production-grade multi-tenancy is **entirely missing**. Required before any CRM/ERP/client portal data.

---

## 4. Supabase gap analysis

| Capability | Current | Required for CORE |
|------------|---------|-------------------|
| Supabase project | None | Dedicated project + envs |
| Auth | localStorage | Supabase Auth (email/OAuth as decided) |
| PostgreSQL | None | Schema domains (see database doc) |
| RLS | None | Mandatory on all tenant tables |
| Storage | Public folder only | Tenant-scoped buckets/paths |
| Edge Functions | None | Webhooks, privileged ops |
| Migrations | None | `supabase/migrations` deterministic |
| Audit logging | None | `audit_logs` + triggers/app writes |
| Client keys | None | `NEXT_PUBLIC_SUPABASE_URL` + anon key only |
| Service role | None | Server-only; never in browser |

**Do not create the database in this phase.** Design only: [../database/TARGET_ARCHITECTURE.md](../database/TARGET_ARCHITECTURE.md)

---

## 5. RINADS CORE gap matrix

| Capability | Status | Notes | Recommended implementation |
|------------|--------|-------|----------------------------|
| Authentication | **PARTIAL** (demo) | Replace, do not extend localStorage | Supabase Auth + server session helpers in `packages/auth` |
| Organizations | **MISSING** | — | `organizations` + memberships |
| Tenants | **MISSING** | Same as org or 1:1 mapping TBD | ADR-005 |
| Users | **PARTIAL** | Username string only | Auth users + `profiles` |
| Memberships | **MISSING** | — | `organization_members` |
| Roles | **PARTIAL** | Client enum only | DB roles + RBAC |
| Permissions | **MISSING** | — | Permission catalog + role grants |
| Feature flags | **MISSING** | — | `feature_flags` + evaluation helper |
| Subscription | **MISSING** | Plans UI is local reminders stub | Stripe/Supabase later; not day 1 |
| Billing | **MISSING** | — | After identity + orgs |
| Audit logs | **MISSING** | — | Append-only `audit_logs` |
| Notifications | **MISSING** | — | Table + provider adapters |
| Files | **PARTIAL** | Static public assets | Storage with tenant paths |
| Activity | **MISSING** | — | `activities` feed |
| API layer | **PARTIAL** | One chat route | Route handlers / services in CORE packages |
| Shared types | **MISSING** | Types scattered | `packages/shared` |
| Shared UI | **MISSING** | No design system package | `packages/ui` + shadcn |
| Shared design tokens | **PARTIAL** | CSS vars in website only | `packages/brand` |

---

## 6. RINADS INTELLIGENCE gap analysis

Intelligence = Founder/operations command center. **Nothing in this repo implements it** beyond a phone shell titled “RINADS Intelligence” and a stub `/rinads-cloud` page.

### Dependency map (conceptual)

```
Identity + Orgs + RBAC + RLS
        ↓
Operational data domains (CRM, tasks, finance, staff)
        ↓
Analytics aggregations (SQL views / materialized metrics)
        ↓
AI context layer (scoped retrieval, never source of truth)
        ↓
AI tools (narrow, permission-checked)
        ↓
Approvals + audit
        ↓
Founder Dashboard / Intelligence UI
        ↓
RINPO as interface over tools (not over raw SQL)
```

| Intelligence module | Status | Blocker |
|---------------------|--------|---------|
| Founder Dashboard | Missing | CORE identity + data |
| BI / analytics | Missing | Metrics schema + Recharts app |
| CRM intelligence | Missing | CRM domain |
| ERP intelligence | Missing | ERP domain |
| Financial intelligence | Missing | Ledger/billing domain |
| Operational / staff / task intelligence | Missing | Ops schemas |
| AI context / tools | Missing | Orchestration + permissions |
| Automation | Missing | n8n + app webhooks |
| Approvals | Missing | Approval workflow tables |
| Auditability | Missing | audit_logs |

**Do not build Intelligence UI on top of localStorage.**

---

## 7. RINPO audit

### Canonical identity (source of truth: uploaded character sheets)

- Height ~4.5 ft / 137 cm; weight ~30 kg; ageless Humanized Digital Intelligence
- Bald; large eyes; warm South Indian skin tone; compact athletic build
- Black hoodie + purple circuit; cargo/joggers; black/purple sneakers; R branding
- Traits: calm, curious, strategic, intelligent, playful, loyal

### Current implementation

| Area | Current | Gap vs constitution |
|------|---------|---------------------|
| Character | 2D PNGs (`rinpo-chatbot.png`) | Not full-body canonical sheet; asset library unversioned |
| 3D | `Rinpo3D.tsx` unused textured plane | Not a character mesh; dead code + heavy deps |
| Avatar/UI | Floating widget + phone shell | Good Public Experience pattern |
| Expressions | Limited lip-sync via speech word index | No expression state machine (happy/curious/etc.) |
| Animation | Framer Motion + CSS glow | Acceptable; avoid over-animation in ops UIs later |
| Chat | Rule-based keyword API | Not LLM; not tool-using; not permissioned |
| Voice | Web Speech TTS/STT | Browser-only; no server voice pipeline |
| States | `idle \| listening \| speaking \| phone-out \| floating` | Missing success/warning/error/focused/curious set |
| Personality | Marketing guide; bilingual EN/ML | Align with Voice Personality Blueprint when wiring real AI |
| Context | None from business systems | Requires CORE |
| Tools | None | Requires AI tool layer |
| Permissions | Demo roles | Must use READ→ANALYZE→RECOMMEND→APPROVAL→EXECUTE |
| Assets | Flat `public/assets/` | Need `assets/rinpo/master/` versioning |
| Intro | `introComplete` defaults **true** | Intro sequence effectively disabled |

**RINPO today = branded UX companion for the website.**  
**RINPO target = human-facing intelligence interface over RINADS CORE tools.**

Do not redesign the character. Organize and version canonical assets; wire intelligence later.

---

## 8. Brand audit

| Spec | Canonical | Current | Assessment |
|------|-----------|---------|------------|
| Name | RINADS | Used | OK |
| Tagline | Business simplified | Used in copy/meta | OK |
| Primary | `#9F4BC7` | `--rinads-primary: #9f4bc7` | Aligned |
| White/Black | `#FFFFFF` / `#000000` | Present | Aligned |
| Font | Figtree | `next/font/google` Figtree | Aligned |
| Logo | Ribbon R + wordmark | **Text-only “Rinads”** — no official logo asset in app | Gap |
| Extra tokens | — | `#0a0a0a` bg, cyan `--rinads-circuit` | Acceptable atmosphere; document as extended tokens |
| Orphan | — | `--font-geist-mono` referenced, undefined | Fix later |
| Components | Design system | Ad-hoc Tailwind; no Button/Input package | Gap |
| Marketing UI | Premium dark | Present | Directionally on-brand |
| Cards | Prefer restraint | Service cards used for navigation | Review vs constitution on marketing pages |

**Inconsistencies:** missing logo assets; README still mentions Geist; unnamed asset files; no shared brand package.

---

## 9. Architecture decision — monorepo vs single app

### Recommendation (definitive)

**Adopt a monorepo** for the RINADS ecosystem. Keep **Public Experience** as an independently maintainable app (`apps/website`).

**Do not** migrate in this phase. Strategy: [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)

### Target structure

```
RINADS/
├── apps/
│   ├── website/          # current rinads-website (Public Experience)
│   ├── intelligence/     # Founder OS (later)
│   ├── founder/          # optional merge with intelligence
│   ├── client/           # Client Portal app (later)
│   ├── rinpo/            # optional dedicated RINPO surface / creative studio
│   └── rinaglow/         # vertical product (later)
├── packages/
│   ├── ui/               # shadcn-based design system
│   ├── brand/            # tokens, logo, Figtree config
│   ├── database/         # typed DB client helpers
│   ├── auth/             # auth helpers
│   ├── permissions/      # RBAC evaluation
│   ├── ai/               # orchestration + tools
│   └── shared/           # types, validators
├── supabase/             # migrations, policies, seed
├── docs/
└── tests/
```

### Why monorepo

1. Shared auth/permissions/UI without duplication (constitution §2–3, Rule 12).
2. Single migration history for Supabase.
3. Website remains deployable independently on Vercel.
4. Prevents website → accidental ERP monolith (explicit Founder constraint).

### Why not “grow this single repo into everything”

- Couples marketing SEO deploy cadence to enterprise schema risk.
- Encourages putting CRM tables behind marketing routes.
- Harder boundary enforcement for RINPO permissions.

---

## 10. Architectural principle (confirmed)

```
RINADS CORE
    ↓
Shared Platform Services
    ↓
RINADS INTELLIGENCE
    ↓
RINPO (interface)
    ↓
Vertical Products (RINAGLOW, CRM, Agency, …)
    ↓
Client Experiences

Public website = RINADS PUBLIC EXPERIENCE (entry + brand + RINPO surface)
```

The website must stay independently maintainable.

---

## 11. Dependency graph

See [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md).

**Critical path blockers:** Identity → Organizations → RBAC/RLS → Design system → then Intelligence/RINPO tools → verticals.

---

## 12. Database target

See [../database/TARGET_ARCHITECTURE.md](../database/TARGET_ARCHITECTURE.md). Design only; no migrations created.

---

## 13. Migration strategy

See [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md). Preserve website, brand, RINPO UI, SEO, assets. Additive, non-destructive.

---

## 14. Technical debt (prioritized)

| ID | Finding | Priority |
|----|---------|----------|
| TD-01 | Plaintext localStorage auth | P0 |
| TD-02 | Spoofable roles / no server authz | P0 |
| TD-03 | No tests | P1 |
| TD-04 | No docs (pre-audit) / stale README | P1 |
| TD-05 | All pages client-only (SEO/RSC) | P1 |
| TD-06 | Unused Three.js stack + dead `Rinpo3D` | P2 |
| TD-07 | Unversioned / Untitled asset files | P2 |
| TD-08 | Intro disabled by default | P2 |
| TD-09 | Chat filters out user messages in UI | P2 |
| TD-10 | No error/not-found routes | P2 |
| TD-11 | Orphan `--font-geist-mono` | P3 |
| TD-12 | Hardcoded contact strings duplicated | P3 |
| TD-13 | No CI (lint/typecheck/test on PR) | P1 |
| TD-14 | `deploy` script pushes prod without gates | P1 |
| TD-15 | No env contract | P1 |

---

## 15–17. ADRs / Roadmap / Priorities

- [../decisions/ADR_PROPOSALS.md](../decisions/ADR_PROPOSALS.md)
- [../roadmap/30_60_90.md](../roadmap/30_60_90.md)
- [../roadmap/PRIORITY_MATRIX.md](../roadmap/PRIORITY_MATRIX.md)

---

## 18. Final recommendations (definitive answers)

| # | Question | Answer |
|---|----------|--------|
| 1 | Should `rinads-website` remain the public experience app? | **Yes.** Rename conceptually to Public Experience; keep as `apps/website` after monorepo adoption. |
| 2 | Should RINADS become a monorepo? | **Yes.** Phased, non-destructive. |
| 3 | Where should RINADS CORE live? | **`packages/*` + `supabase/`** shared platform, consumed by apps — not inside marketing pages. |
| 4 | Where should RINPO live? | **UI shell** stays in website initially; **platform packages** (`packages/ai`, shared Rinpo components in `packages/ui`) for intelligence; assets under versioned `assets/rinpo/`. |
| 5 | Where should Supabase live? | **Top-level `supabase/`** in monorepo; single project per environment. |
| 6 | What should be migrated? | Website app, RINPO components/hooks, brand tokens/assets, DNS/deploy knowledge, content routes. |
| 7 | What should NOT be migrated? | localStorage auth as “real” auth; plaintext password model; treating `/api/chat` keywords as Intelligence; dead Untitled assets without curation; Three.js until a real 3D need exists. |
| 8 | What must be fixed immediately (after approval)? | Retire or quarantine demo auth (P0); add security notice; rate-limit chat; stop shipping founder/super-admin self-signup. |
| 9 | What should be built first? | Monorepo skeleton + docs/ADRs → identity/orgs/RLS design → brand/ui packages → replace demo auth → then Intelligence foundations. |
| 10 | What should NOT be built yet? | Full ERP/CRM, billing, RINAGLOW product, autonomous AI execute tools, production Supabase with real customer data, redesign of RINPO character. |

---

## 19. Phase constraint confirmation

This audit package:

- Did **not** modify application product code
- Did **not** create database migrations
- Did **not** connect production Supabase
- Did **not** replace the website
- Did **not** rewrite the repository
- Did **not** install new runtime dependencies

**Next step:** Founder review → approve ADRs → authorize BUILD phase for Phase 0 (monorepo skeleton + P0 auth quarantine) only.
