# RINADS Documentation

**Mode:** BUILD — platform Phases 9–13 + R GLOW MVP on `main`  
**Repository:** RINADS monorepo (Public Experience in `apps/website`, Salon OS in `apps/rinaglow`)

## Start here

| Document | Purpose |
|----------|---------|
| [STATUS.md](./STATUS.md) | **End-to-end built vs pending** (current truth) |
| [architecture/FOUNDER-INTELLIGENCE.md](./architecture/FOUNDER-INTELLIGENCE.md) | Founder-only control centre, live adapters, runtime map, and scaling boundaries |
| [founder-audit/LIVE-E2E-VERIFICATION-2026-09-30.md](./founder-audit/LIVE-E2E-VERIFICATION-2026-09-30.md) | Latest live production gates |
| [deployment/RGLOW_PRODUCTION_CUTOVER.md](./deployment/RGLOW_PRODUCTION_CUTOVER.md) | R GLOW go-live checklist |
| [creative-os/GATE-A-CHECKLIST.md](./creative-os/GATE-A-CHECKLIST.md) | Creative OS Gate A / PR-C0 |
| [creative-os/CREATIVE-OS-V1-IMPLEMENTATION.md](./creative-os/CREATIVE-OS-V1-IMPLEMENTATION.md) | Creative OS launch blueprint |
| [CMS_PHASE_C.md](./CMS_PHASE_C.md) | CMS Phase C scope (blog, preview, storage, i18n) |
| [CMS_FOLLOWUP_BACKLOG.md](./CMS_FOLLOWUP_BACKLOG.md) | CMS + platform follow-ups |
| [RINADS-UNIFIED-REFACTOR-CHECKLIST.md](./RINADS-UNIFIED-REFACTOR-CHECKLIST.md) | Unified unfinished checklist |
| [architecture/AUDIT_GAP_ANALYSIS.md](./architecture/AUDIT_GAP_ANALYSIS.md) | Full architecture audit (historical baseline) |
| [decisions/README.md](./decisions/README.md) | Accepted ADRs |
| [deployment/POLICY.md](./deployment/POLICY.md) | Deploy workflow |
| [deployment/VERCEL_INTERNAL_PORTALS.md](./deployment/VERCEL_INTERNAL_PORTALS.md) | Internal portal domains, auth, founder bootstrap |
| [deployment/VERCEL_RINAGLOW.md](./deployment/VERCEL_RINAGLOW.md) | R GLOW Vercel project |
| [runbooks/RGLOW-COMMUNICATIONS-WORKER.md](./runbooks/RGLOW-COMMUNICATIONS-WORKER.md) | Communications worker |

## R GLOW implementation docs

| Document | Purpose |
|----------|---------|
| [rglow/PRODUCTION-MVP-GAP-ANALYSIS.md](./rglow/PRODUCTION-MVP-GAP-ANALYSIS.md) | Detailed handoff parity, production MVP boundary, and launch evidence gates |
| [rglow/PROTOTYPE-GAP.md](./rglow/PROTOTYPE-GAP.md) | Prototype-to-repository capability matrix |
| [implementation/RGLOW-MVP-CLOSURE.md](./implementation/RGLOW-MVP-CLOSURE.md) | MVP operator journeys closed |
| [implementation/RGLOW-PHASE-E-SLICE-2-DEFERRED.md](./implementation/RGLOW-PHASE-E-SLICE-2-DEFERRED.md) | E.2 items (loyalty/reviews/comms completed) |
| [implementation/RGLOW-LOYALTY-OPERATIONS.md](./implementation/RGLOW-LOYALTY-OPERATIONS.md) | Loyalty ops |
| [RGLOW-REVIEWS-RECOVERY-OPERATIONS.md](./RGLOW-REVIEWS-RECOVERY-OPERATIONS.md) | Reviews / recovery |

## Architecture boundaries

- `packages/*` — reusable platform **code**
- `supabase/*` — PostgreSQL schema/migrations + Edge Functions
- `apps/website` — Public Experience
- `apps/rinaglow` — R GLOW Salon OS

## Next focus

1. Auth allowlist + authenticated persona smoke (founder)
2. Keep Twilio/workers off until FOUNDER-SIGNOFF
3. Creative OS Gate A → PR-C1 after approval
4. After salon messaging: CMS Phase C, live billing subscriptions, RINPO LLM depth
