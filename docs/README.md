# RINADS Documentation

**Mode:** BUILD — platform Phases 9–13 + R GLOW MVP on `main`  
**Repository:** RINADS monorepo (Public Experience in `apps/website`, Salon OS in `apps/rinaglow`)

## Start here

| Document | Purpose |
|----------|---------|
| [STATUS.md](./STATUS.md) | **End-to-end built vs pending** (current truth) |
| [deployment/RGLOW_PRODUCTION_CUTOVER.md](./deployment/RGLOW_PRODUCTION_CUTOVER.md) | R GLOW go-live checklist |
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

1. R GLOW production cutover (deploy, Twilio, workers)
2. Credentialed WhatsApp E2E
3. After launch: CMS Phase C, live billing subscriptions, RINPO LLM depth
