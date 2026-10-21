# RINADS Platform — Architecture Constitution

## Repository Layout

```
rinads-website/
├── apps/
│   ├── website/          # www.rinads.com — Next.js 15 App Router (public + auth)
│   ├── owner-portal/     # Business OS for org owners
│   ├── customer-portal/  # Customer-facing order/tracking
│   ├── storefront/       # RI Marketplace storefront
│   └── platform-admin/   # Internal ops/admin
├── packages/
│   ├── database/         # Supabase client factory + shared types
│   ├── runtime/          # RINPO Runtime (OBSERVE→…→LEARN pipeline)
│   ├── ui/               # Shared component library
│   └── world-contract/   # RI World Bridge v1 — typed contract for Unity↔web
└── supabase/
    ├── functions/        # Deno edge functions
    └── migrations/       # Ordered SQL migrations (append-only)
```

## Multi-Tenancy (ADR-005)

- `organization_id` is the canonical tenant boundary — **never** bypass it
- Row-Level Security (RLS) is the enforcement layer; no service-side "org filter" replaces it
- `organization_members` + `roles(name)` governs who can do what inside an org
- Platform-owned records use `organization_id IS NULL` (e.g. `services` catalog)
- Never weaken RLS to make a frontend or edge function work

## Supabase Conventions

- Server client: `createWebsiteServerClient()` from `@/lib/supabase/server` (async, cookie-based)
- Admin client: `createClient(url, SERVICE_ROLE_KEY)` — edge functions only, never browser
- Table `"services"` = platform service catalog (NOT `platform_services`)
- Columns: `id, slug, name, description, pillar, pricing_model, base_price, currency, estimated_delivery_days, is_active, organization_id`
- Migrations: always append new files; never edit an applied migration

## RINPO Runtime (packages/runtime)

Pipeline stages: OBSERVE → CONTEXT → MEMORY → POLICY → INTENT → PLAN → RISK → APPROVAL → EXECUTE → VERIFY → AUDIT → LEARN

High-risk actions require `APPROVAL` stage before `EXECUTE`. The runtime lives in `packages/runtime/src/`.

## Availability Registry

All platform capabilities are catalogued in `apps/website/lib/availability.ts`.
Status values: `AVAILABLE | PREVIEW | PRIVATE_PREVIEW | COMING_SOON | ROADMAP`.
Never show a Coming Soon badge for a live feature; never show Available for an unbuilt one.

## Security Rules (non-negotiable)

- No secrets in browser JS or URLs
- No JWTs in query strings
- No service-role keys in client code
- Never trust `tenant_id` / `workspace_id` / `role` from browser requests
- Do not deploy to production without explicit founder approval
- Do not apply destructive production migrations without review
- Do not rotate or expose secrets
- Do not claim integrations are live when they are mocked/configured only

## Navigation IA (lib/product-ia.ts)

Canonical product hierarchy:
- `/business-os` — Business OS (run your company)
- `/rinpo-intelligence` — RINPO Intelligence (understand + decide)
- `/cloud` — RINADS Cloud (connected platform)
- `/services` — RINADS Services (build, grow, automate)
- `/world` — RINADS WORLD (immersive gateway) — PREVIEW
- `/space` — RINASPACE (authenticated workspace) — PREVIEW
- `/search` — RI Search (discover services + industry) — AVAILABLE

## Commit Conventions

```
<type>(<scope>): <subject>

Types: feat | fix | chore | docs | refactor | test | perf
Scope: website | owner-portal | runtime | database | world | search | space
```

## Definition of Done

A feature is "done" when:
1. It builds without TypeScript errors (`pnpm typecheck`)
2. RLS is tested for the new tables/queries
3. The availability registry reflects the real status
4. Navigation IA is updated if a new route is added
5. No secrets committed; no service-role key in client code

## Production Safety

- `claude/sharp-bell-S1JdV` is the development branch for this session
- All changes go here first; production merges require founder review
- Edge function deploys require explicit `supabase functions deploy` command
- DB migrations require `supabase db push` — not auto-applied
