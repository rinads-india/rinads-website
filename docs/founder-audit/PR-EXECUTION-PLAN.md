# GitHub PR-by-PR execution plan

**Audit date:** 2026-09-25 (refresh 2026-09-26)  
**Rule:** Small PRs; CI green; **no merge/deploy by agent**. Founder approves merges and production actions.

## Already merged (do not reopen)

| PR | Title | Notes |
|----|-------|-------|
| #73 | Phase 4 commercial engineering pendings | Leads, JSON-LD, a11y, site_leads migration |
| #74 | BOS shell + navigation cleanup | PR 1 |
| #75 | BOS tenancy / roles / More a11y | Security release gate — merged |
| #76 | R Glow brand assets + UI align | — |
| #77 | RINADS logo chrome, dark islands, mega-menu scrim | Merged; NavDropdown lint cleared on later `#80`–`#85` branches |
| #78 | BOS Home Command Centre | Merged |
| #80–#86 | Founder audit, BOS empty states, cutover, RINPO, commercial, IA, portals | On production `67473ae` |

## Open PRs — disposition (2026-09-26 live E2E)

| PR | State | Conflict / risk | Action |
|----|-------|-----------------|--------|
| #79 | OPEN, CONFLICTING | Fix already on `main` (no `setMounted`) | **Close** — superseded |
| #70 | OPEN, CONFLICTING | Stale vs commercial `/projects` + LeadForm | **Close** — do not merge as-is |
| #36 | OPEN, CONFLICTING | Vercel Analytics vs #73 optional GTM | **Close** — prefer one analytics path |
| #87 | OPEN, MERGEABLE | Unity Web 3D scaffold | Review-only; out of live-E2E scope |

## Recommended sequence (forward)

| Order | Work | Scope | Acceptance | Merge? |
|-------|------|-------|------------|--------|
| 1 | `cursor/live-e2e-verification-ea81` | Live E2E verification docs + housekeeping | Docs only | Founder |
| 2 | Close #79 / #70 / #36 | Hygiene (superseded / stale / analytics disposition) | No code merge | Agent/founder close |
| 3 | Ops (no code) | Migration list, Auth allowlist, cookie env, persona smoke | FOUNDER-SIGNOFF | Founder only |
| 4 | Messaging (after sign-off) | Twilio sandbox → allowlisted worker | Signed checklist | Founder only |
| 5 | #87 (optional) | Unity Web 3D scaffold | Review-only; not live-E2E | Founder |

## Conflict map

- **#79 vs main:** CONFLICTING and **superseded** — close without merge.
- **#70 vs main:** Conflicts — close; reopen only with full rebase against commercial `/projects`.
- **Analytics #36 vs GTM:** Close #36 unless founder chooses Analytics over GTM path.

## CI gate (required on every code PR)

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

No CI bypass. Playwright remains optional until a dedicated workflow PR.
