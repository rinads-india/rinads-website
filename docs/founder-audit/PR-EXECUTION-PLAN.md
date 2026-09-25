# GitHub PR-by-PR execution plan

**Audit date:** 2026-09-25  
**Rule:** Small PRs; CI green; **no merge/deploy by agent**. Founder approves merges and production actions.

## Already merged (do not reopen)

| PR | Title | Notes |
|----|-------|-------|
| #73 | Phase 4 commercial engineering pendings | Leads, JSON-LD, a11y, site_leads migration |
| #74 | BOS shell + navigation cleanup | PR 1 |
| #75 | BOS tenancy / roles / More a11y | Security release gate — merged |
| #76 | R Glow brand assets + UI align | — |
| #77 | RINADS logo chrome, dark islands, mega-menu scrim | Merged; introduced NavDropdown lint issue addressed by #79 |
| #78 | BOS Home Command Centre | Merged; on production `eb7a95a` |

## Open PRs — disposition

| PR | State | Conflict / risk | Action |
|----|-------|-----------------|--------|
| #79 | OPEN, CI green | Single-file lint fix `NavDropdown.tsx` | **Founder merge** when ready (unblocks redundant mount effect) |
| #70 | OPEN, stale | Conflicts with commercial rebuild (`ProjectsLanding` removed) | **Close or full rebase** after product decision — do not merge as-is |
| #36 | OPEN, old | Vercel Web Analytics vs #73 optional GTM | **Narrow or close**; prefer one analytics path |

## Recommended sequence (forward)

| Order | Branch / PR | Scope | Acceptance | Merge? |
|-------|-------------|-------|------------|--------|
| 1 | `cursor/founder-audit-phase0-ea81` | `docs/founder-audit/*` + STATUS pointer | Docs only; no code behaviour change | Founder |
| 2 | #79 (existing) | Lint unblock | CI already green | Founder |
| 3 | `cursor/bos-bridge-empty-states-ea81` | Honest empty states / bridge labels for OS modules | Unit tests; no schema | Founder |
| 4 | `cursor/commercial-page-matrix-fixes-ea81` | Measured commercial/a11y fixes only | commercial-readiness tests pass | Founder |
| 5 | `cursor/rglow-cutover-truth-ea81` | Update RGLOW_PRODUCTION_CUTOVER evidence | Docs | Founder |
| 6 | `cursor/rinpo-appt-confirm-pilot-ea81` | Appointment → draft confirmation + audit/budget | Tenant checks; no auto-send | Founder |
| 7 | `cursor/enterprise-ia-copy-ea81` | Outcome-journey copy polish | No brand asset changes | Founder |
| 8 | Ops (no code) | Migrations, Twilio sandbox, worker flags | FOUNDER-SIGNOFF checklist | Founder only |

## Conflict map

- **#77 vs #78:** No file overlap historically; both already merged.
- **#79 vs main:** Likely clean (post-#77 lint cleanup).
- **#70 vs main:** Conflicts — rebase required or supersede with LeadForm/`site_leads` path.
- **Analytics #36 vs GTM:** Mutually review before both land.

## CI gate (required on every code PR)

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

No CI bypass. Playwright remains optional until a dedicated workflow PR.
