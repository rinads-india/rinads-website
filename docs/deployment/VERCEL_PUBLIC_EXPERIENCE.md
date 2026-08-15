# Vercel — Public Experience (`apps/website`)

**Project:** `rinads-website`  
**Team:** `rinadss-projects-1ebcffe7`  
**Production branch:** `main`

## Required project settings

| Setting | Value |
|--------|--------|
| Root Directory | `apps/website` |
| Framework | Next.js |
| Install Command | Prefer config in [`apps/website/vercel.json`](../../apps/website/vercel.json) (`pnpm install --filter @rinads/website...` from monorepo root) |
| Build Command | Prefer config in `vercel.json` (`pnpm --filter @rinads/website build`) |
| Output | Next.js (default) |

Dashboard: [Build & Deployment](https://vercel.com/rinadss-projects-1ebcffe7/rinads-website/settings/build-and-deployment)

`vercel.json` under `apps/website` is the source of truth when Root Directory is set to that folder. Do not point this project at the monorepo root or at another app (`apps/storefront`, portals, etc.).

## Canonical hosts

| Host | Role |
|------|------|
| `https://www.rinads.com` | Canonical production site |
| `https://rinads.com` | Should redirect to `www` |
| `https://rinads-website.vercel.app` | Public Vercel production alias |

Team-scoped hosts such as `https://rinads-website-*-rinadss-projects-1ebcffe7.vercel.app` and `https://rinads-website-rinadss-projects-1ebcffe7.vercel.app` often require Vercel SSO and may point at a **specific deployment** (including old previews). Prefer `www.rinads.com` when judging what production looks like.

DNS notes: [`apps/website/DNS-SETUP.md`](../../apps/website/DNS-SETUP.md).

## Current Public Experience UI (verify after deploy)

Production should show the redesigned homepage from `apps/website/app/page.tsx`:

- Floating / redesigned **Navbar** + immersive **Hero** (`components/rinads/*`)
- Cut-button styling (`btn-cut`), RINPO head / video hero assets
- Headline direction: **Business simplified.**

It should **not** look like the early marketing shell:

- Top nav: Home / Services / Rinads Cloud / Contact / Account
- Hero CTAs: “Get a Free Consultation” / “View Our Work”
- Emoji “What we offer” service cards from the old layout

(`components/layout/Header.tsx` may still exist in the tree; it is not the homepage entry.)

## If an old UI still appears

1. Confirm the hostname (canonical `www` vs SSO team URL vs old deployment alias).
2. Confirm Production Deployment is the latest `main` commit (redesign + later merges).
3. Confirm Root Directory is still `apps/website` (wrong root leaves an old artifact or breaks monorepo builds).
4. Redeploy Production from `main` (Deployments → … → Redeploy, or push an empty commit only if necessary).
5. Optionally archive or unassign confusing old preview URLs so reviewers are not sent to stale aliases.

## Emergency CLI

See [`POLICY.md`](./POLICY.md). `pnpm deploy:emergency` is EMERGENCY MODE only and uses scope `rinadss-projects-1ebcffe7`.
