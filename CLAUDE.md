# CLAUDE.md — RINADS Platform

RINADS is a multi-tenant Business Operating System: one kernel, one intelligence runtime (RINADS INTELLIGENCE + RINPO Runtime), many Industry Packs.

**Read `docs/RINADS_MASTER_SPEC.md` before architectural work.** It is the constitution and overrides other docs and prompts. ADRs live in `docs/decisions/`. Current readiness lives in `docs/production/PLATFORM-READINESS.md`.

Launch gate: **14 Nov 2026**. Priority: P0 trial + provisioning + RI SPACE → P1 billing/conversion → P2 Business OS → rest.

## Repository layout

```
rinads-website/
├── apps/
│   ├── website/          # www.rinads.com — Next.js App Router (public + auth + /space)
│   ├── owner-portal/     # Business OS for org owners
│   ├── customer-portal/  # Customer-facing orders/tracking
│   ├── storefront/       # Storefront / marketplace
│   ├── platform-admin/   # Internal ops / Control Plane
│   └── rinaglow/         # R GLOW salon app
├── packages/             # database, tenancy, permissions, auth, billing, commerce(-server),
│                         # runtime (RINPO Runtime), intelligence, platform, salon(-server),
│                         # operations(-server), communication, world-contract, ui, brand, …
├── supabase/
│   ├── functions/        # Deno edge functions
│   └── migrations/       # Ordered SQL migrations (append-only)
├── scripts/              # cron workers (provisioning, runtime, communications), ops, admin
└── tests/                # Playwright E2E
```

## Frozen launch decisions (spec §0)
- Hosting stays Vercel + Supabase until after launch. Do not migrate infra.
- No Temporal before launch. Keep workflows behind a `WorkflowRunner`-style interface; use the existing queue/cron workers, idempotent and retryable.
- n8n is internal-only. Never put customer workflows or customer credentials in n8n.
- RINADS WORLD / RI RINAVERSE are out of launch scope. Do not block on them.
- Tenant boundary is `organization_id` (ADR-005). Workspace is subordinate. No DB per customer.

## Multi-tenancy (ADR-005)
- `organization_id` is the canonical tenant boundary — never bypass it.
- RLS is the enforcement layer; no service-side "org filter" replaces it. Never weaken RLS to make a frontend or edge function work.
- `organization_members` + `roles(name)` govern who can do what inside an org.
- Platform-owned records use `organization_id IS NULL` (e.g. the `services` catalog).
- Reuse existing RLS helper functions; do not create duplicates.

## Supabase conventions
- Server client: `createWebsiteServerClient()` from `@/lib/supabase/server` (async, cookie-based).
- Admin/service-role client: server code, edge functions and workers only — never browser.
- Table `services` = platform service catalog (not `platform_services`).
- Migrations: always append new files; never edit an applied migration. Additive where possible, with a rollback note and RLS tests. Not auto-applied — `supabase db push` only with founder approval.

## RINPO Runtime (`packages/runtime`)
Pipeline: OBSERVE → CONTEXT → MEMORY → POLICY → INTENT → PLAN → RISK → APPROVAL → EXECUTE → VERIFY → AUDIT → LEARN.
- High-risk actions require APPROVAL before EXECUTE. Never default refunds, transfers, deletion, tax config, permission escalation, plan changes or unlicensed publication to L4.
- Every action follows the action contract (spec §10.3) through the tool registry: permission + policy + risk + idempotency + audit.
- Deterministic capabilities must work with no LLM. AI calls go through the model/capability gateway, never a vendor SDK from domain code.

## Availability / Capability Registry
Capabilities are catalogued in `apps/website/lib/availability.ts` (current values: `AVAILABLE | PREVIEW | PRIVATE_PREVIEW | COMING_SOON | ROADMAP`). The spec's target vocabulary is `LIVE | READY | BETA | PREVIEW | BLOCKED | PLANNED`; do not rename in passing — migration is tracked in the readiness docs.
Never show Available/Live for something unbuilt or unverified; unknown health shows UNKNOWN.

## Security rules (non-negotiable)
- Never trust client-supplied `organization_id`, `tenant_id`, `workspace_id`, role, plan, entitlement, trial status or permissions. Resolve server-side.
- Grant entitlement only from verified webhooks and server-issued trial grants — never from a browser "success" or `trialing=true`.
- No secrets in browser JS, URLs, git, logs or n8n. No JWTs in query strings. No service-role keys in client code.
- No hard-coded tenant/org IDs, metrics or synthetic IDs in production paths.
- Payment/messaging/logistics providers only through adapters.
- Do not deploy to production, apply destructive migrations, delete data, rotate secrets or change production billing without founder approval.
- Do not claim integrations are live when they are mocked or configured only.
- Do not remove legitimate demo mode. Do not create a parallel platform or per-vertical repo.

## Navigation IA (`lib/product-ia.ts`)
`/business-os` · `/rinpo-intelligence` · `/cloud` · `/services` · `/world` (PREVIEW) · `/space` (RI SPACE; legacy name RINASPACE) · `/search`. Public UI says **RI SPACE**; internal `RINASPACE` identifiers may remain.

## Commands
Verified by the Release A audit — see `docs/production/PLATFORM-READINESS.md` §Build baseline for results.
```
install:   pnpm install --frozen-lockfile
lint:      pnpm lint          # turbo run lint
typecheck: pnpm typecheck     # turbo run typecheck
test:      pnpm test          # turbo run test
build:     pnpm build         # turbo run build
e2e:       pnpm test:e2e      # playwright
workers:   pnpm provisioning:worker | runtime:worker | communications:worker
```

## Commit conventions
```
<type>(<scope>): <subject>
Types: feat | fix | chore | docs | refactor | test | perf
Scope: website | owner-portal | runtime | database | world | search | space | audit | …
```

## Definition of done
1. Builds without TypeScript errors (`pnpm typecheck`).
2. RLS tested for new tables/queries, including cross-tenant denial.
3. Availability registry reflects real status.
4. Navigation IA updated for new routes.
5. No secrets committed; no service-role key in client code.
6. Readiness docs updated when a component's status changes.

## Branches and production safety
- Work on feature branches (`release-<x>/<topic>`); open draft PRs. Merges to `main` and production deploys require founder review.
- Edge function deploys require an explicit `supabase functions deploy`.

## Ask the founder only when
Continuing risks destructive production impact that cannot be avoided safely. Otherwise choose the safest scalable option, proceed, and record the decision.
