# Migration Strategy: rinads-website → RINADS Ecosystem

**Date:** 2026-08-13  
**Principle:** Additive, non-destructive. Preserve Public Experience.

---

## Current state

- Single repo: `rinads-website`
- Next.js marketing + RINPO UI
- Demo localStorage auth
- Vercel deploy

## Target state

Monorepo with `apps/website` (this product) + `packages/*` + `supabase/` + `docs/`.

---

## Non-negotiables to preserve

- Current website routes and content intent
- Brand colors / Figtree / purple-black aesthetic
- RINPO UI work (provider, phone, chat UX, voice hooks)
- Existing usable assets (curate, don’t delete blindly)
- SEO equity (rinads.com) — avoid URL breakage
- Ability to deploy Public Experience independently

---

## Phased migration (recommended)

### Phase A — Document & decide (THIS PHASE)

- Audit package in `docs/`
- Founder approves ADRs
- **No code restructure yet**

### Phase B — Monorepo skeleton (first BUILD)

1. Create monorepo root (Turborepo or pnpm workspaces — finalize in ADR-002).
2. Move current app to `apps/website` with minimal path fixes.
3. Keep Vercel project pointed at `apps/website`.
4. Add empty `packages/brand`, `packages/ui`, `packages/shared`.
5. Add `supabase/` placeholder (no prod link).
6. Ensure `apps/website` build/lint unchanged in behavior.

**Rollback:** Keep previous single-app tag/release; Vercel rollback.

### Phase C — Extract brand/UI

1. Move CSS tokens → `packages/brand`.
2. Introduce shadcn in `packages/ui`; migrate buttons/inputs gradually.
3. Add official logo assets; stop text-only logo debt.
4. Curate RINPO assets into versioned paths; leave redirects/copies for old URLs if needed.

### Phase D — Replace demo auth

1. Add Supabase Auth in dev/staging only.
2. Feature-flag real auth behind `auth_supabase_enabled`.
3. Remove plaintext `rinads_users` path.
4. Public Experience login becomes real client/staff auth **without** self-serve founder role.

### Phase E — New apps

1. `apps/intelligence` (Founder OS) — new app, not stuffed into marketing routes.
2. `apps/client` — real Client Portal.
3. Verticals (`rinaglow`, etc.) as separate apps sharing packages.

### Phase F — RINPO intelligence upgrade

1. Keep website RINPO shell.
2. Move orchestration to `packages/ai`.
3. Tools call CORE APIs with RBAC; never arbitrary SQL.
4. Enforce READ → ANALYZE → RECOMMEND → APPROVAL → EXECUTE.

---

## What to migrate

| Item | Action |
|------|--------|
| `app/*` pages | → `apps/website/app` |
| `components/rinpo/*` | → website initially; extract shared pieces to `packages/ui` later |
| `hooks/*` | → website / shared package when second app needs them |
| `public/assets` | → curated brand + rinpo asset libraries |
| DNS / Vercel knowledge | Keep; document in `docs/deployment` |
| Chat API | Stay on website until AI gateway exists; then swap implementation behind same route or BFF |

## What NOT to migrate

| Item | Action |
|------|--------|
| Plaintext password auth | **Delete**, do not port |
| Self-serve `super-admin` signup | **Delete** |
| Dead `Untitled_design*` without review | Quarantine / archive |
| Unused Three.js path | Remove when approved (reduce bundle) |
| Treating keyword chat as Intelligence | Replace later; don’t elevate |

---

## Risk controls

- Feature flags for auth cutover
- Staging Supabase before prod
- No big-bang rewrite of marketing pages
- Separate Vercel projects per app when apps multiply
- Branch protection + CI before prod deploy script remains

---

## Success criteria for migration completeness

1. Website URLs and brand intact
2. RINPO still usable on Public Experience
3. CORE packages exist and are the only place for auth/org/RBAC
4. No tenant data in localStorage
5. Intelligence is not hosted inside marketing page components
