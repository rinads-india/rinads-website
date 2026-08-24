# RINADS — 50-File Refactor & Canonicalization Map

Version 5.1 — Source-backed consolidation plan

## Executive decision

The uploaded set contains **50 files** (including two byte-identical copies of `RINADS-ONE-COMPLETE-BUILD-GUIDE`).

**Do not** run string-level Watermelon→RINADS replacement. The set spans MelonIQ, RINADS ONE, Watermelon marketplace, RINPO, n8n, Supabase Edge Functions, and multiple visual systems.

## Target architecture

```text
RINADS
├── Business OS (Customers · Work · Finance · Growth · Automation)
├── RINPO Intelligence
├── RINADS Services (Build · Grow · Automate · Transform)
├── RINADS Delivery Network
├── Vertical OS
└── RINADS Cloud
```

## Canonical source hierarchy

1. `rinads-one-design-system.jsx` — tokens/components
2. `RINADS-ONE-CURSOR-MASTER-PROMPT-V4.md` — historical baseline (superseded by [RINADS-CURSOR-MASTER-PROMPT.md](./RINADS-CURSOR-MASTER-PROMPT.md))
3. `rinads-one-platform.jsx` — RINPO/marketing reference (remove legacy footer)
4. `watermelon-schema(3).sql` — delivery schema reference → merge into Supabase migrations
5. `watermelon-n8n-workflow(4).json` — automation behavior reference only
6. `rinads-one-order-journey.jsx` — service order UX reference
7. `rinads-one-financial-engine.jsx` — unit economics (configurable, not hard-coded)
8. `watermelon-ai-engine(3).jsx` → **Service assignment**, not RINPO

## Critical merges

| Merge | Sources | Target |
|-------|---------|--------|
| Dashboard | r1-dashboard, meloniq-dashboard (patterns only) | `apps/` Business OS dashboard |
| Creative Studio | r1-creative-studio + watermelon-creative-studio | Services creative module |
| Workflow Visualizer | r1 + watermelon workflow visualizer | Automation internal tool |
| Schema Visualizer | r1 + watermelon schema visualizer | Platform internal tool |
| Services | r1-marketplace + watermelon-marketplace + client portal + order-journey | `service_*` domain + website `/services` |
| Operations | rinads-one-sop + watermelon-ops-dashboard + master-hub | platform-admin ops |
| Strategy | r1-kerala-strategy + watermelon-kerala-domination | internal growth docs |
| Onboarding | r1-onboarding + meloniq-starter-kit | existing onboarding wizard |

## Database convergence

Legacy marketplace concepts → RINADS tenant model with **`organization_id`** (monorepo; legacy docs say `business_id`).

Target tables: `services`, `service_orders`, `service_pods`, `service_partners`, `service_tasks`, `service_earnings`, `service_commissions`, `service_deliverables`, `whatsapp_log`, RINPO tables.

Principle: domain-aware merge — not blind `wm_*` rename.

## Automation

n8n JSON → [SERVICES-MIGRATION.md](./architecture/SERVICES-MIGRATION.md) → Edge Functions + Cron.

## Archive (reference only)

- MelonIQ / Watermelon / crimson RINADS ONE HTML landings
- Older prompts (v3, duplicate build guide)
- Raw n8n workflow → `docs/archive/`

## Monorepo status

| Item | Status |
|------|--------|
| Production source Watermelon/`wm_` | Clean |
| Phase 1–13 Supabase migrations | Applied on staging |
| Services schema | Foundation migration in this branch |
| Uploaded JSX prototypes | Not merged — reference for P2 UI |

See [RINADS-UNIFIED-REFACTOR-CHECKLIST.md](./RINADS-UNIFIED-REFACTOR-CHECKLIST.md) for execution tracking.
