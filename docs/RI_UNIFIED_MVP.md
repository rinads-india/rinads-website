# RI Unified MVP — Architecture Overview

> Last updated: 2026-10-21
> Branch: `claude/sharp-bell-S1JdV`
> Status: Pre-production review

## What was built

This document describes the RI Unified MVP — the first coherent slice of the full RINADS platform, delivered across 9 phases in a single session.

## Platform surfaces

| Surface | Route | Status | Description |
|---------|-------|--------|-------------|
| Business OS | `/business-os` | AVAILABLE | CRM, projects, finance, tasks |
| RINPO Intelligence | `/rinpo-intelligence` | AVAILABLE | Rule-based + Claude Haiku chat |
| RI Search | `/search` | PREVIEW | Supabase-backed unified search |
| RINASPACE | `/space` | PREVIEW | Authenticated role-aware workspace |
| RINADS WORLD | `/world` | PREVIEW | Gateway to world.rinads.com |
| RI Marketplace | `/marketplace` | PREVIEW | Platform services aggregation |
| Entity pages | `/entity/[slug]` | PREVIEW | Unified entity detail pages |

## Key packages

- `packages/world-contract/` — RI World Bridge v1 TypeScript contract (platform↔Unity postMessage)
- `apps/website/lib/availability.ts` — Typed capability status registry
- `apps/website/lib/analytics.ts` — Client-side event taxonomy
- `apps/website/lib/analytics-server.ts` — Server-side event log

## Database migrations (this session)

| File | Description |
|------|-------------|
| `20261021100000_ri_entities.sql` | `ri_entities` projection table with RLS + FTS index |
| `20261021100001_ri_event_log.sql` | `ri_event_log` analytics table (service-role-only insert) |

## Edge functions updated

| Function | Change |
|----------|--------|
| `notify-whatsapp` | Real Twilio API (was stub); graceful fallback when secrets absent |
| `payment-webhook` | Now sends both client confirmation + intern task-assignment WhatsApp |

## RINPO Chat upgrade (Phase 6)

- Set `RINPO_ANTHROPIC_KEY` (server env var) to enable Claude Haiku responses
- Falls back to rule-based engine when key is absent — zero regression
- Model: `claude-haiku-5-5`, max_tokens 400, context-aware system prompt

## Availability registry note

`apps/website/lib/availability.ts` uses `CapabilityKey` typed keys (e.g. `ri_search`, `ri_marketplace`).
`apps/website/components/PlatformGrid.tsx` uses a separate string-keyed lookup (e.g. `"rinads-one"`, `"rinpo-chat"`).
These two should be unified in a follow-up — add the PlatformGrid keys to `CapabilityKey` and point the component at the registry.

## TypeScript status

Pre-existing errors exist in the workspace (unresolved `@rinads/*` packages, missing `@types/node`, missing `lucide-react`). None of the Phase 1–9 files introduce new errors. Resolve by running `pnpm install` in the repo root after the monorepo workspace packages are properly built.

## Production checklist (before merge to main)

- [ ] `pnpm install` at repo root, then `pnpm typecheck` passes
- [ ] `supabase db push` applies both new migrations to staging
- [ ] RLS tested: anonymous cannot read org-scoped `ri_entities`
- [ ] `RINPO_ANTHROPIC_KEY` set in Vercel environment (optional — rules work without it)
- [ ] `RINADS_TWILIO_SID`, `RINADS_TWILIO_TOKEN`, `RINADS_WA_FROM` set in Supabase edge function secrets
- [ ] Founder (Andrino T D) reviews and approves PR before merge to main
