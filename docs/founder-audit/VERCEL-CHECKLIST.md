# Vercel deployment verification checklist

**Audit date:** 2026-09-25  
**Team:** `rinadss-projects-1ebcffe7` (`team_5JqD1eqjxH1JTNYYAB5c13Z2`)

## Projects (MCP `list_projects` — authorized)

| Project | ID | Role |
|---------|----|------|
| `rinads-website` | `prj_fROCYQ2sYOCKCPrEKT0zaAFyCPa3` | Public Experience (`apps/website`) |
| `rinaglow` | `prj_k77S5CRi1k7zt3JmXLQlc7UKQBTY` | R GLOW (`apps/rinaglow`) |

## MCP gaps

| API | Result | Workaround used |
|-----|--------|-----------------|
| `list_projects` | OK | — |
| `get_project` | 404 Not Found | Treat root-dir/env as **unverified via API** |
| `list_deployments` | 403 Forbidden | GitHub Deployments API for SHA |

## Production deploy SHA (GitHub Deployments)

| Environment | SHA | Created (UTC) |
|-------------|-----|---------------|
| Production – rinads-website | `eb7a95ae6bf851d6003fe0c5d9e4592623f5333e` | 2026-09-25T02:39:15Z |
| Production – rinaglow | `eb7a95ae6bf851d6003fe0c5d9e4592623f5333e` | 2026-09-25T02:38:17Z |

Matches `origin/main` at audit time (**DEPLOYED = main**).

## Domain / health probes

| Check | Expected | Result 2026-09-25 |
|-------|----------|-------------------|
| `https://www.rinads.com/api/health` | productionEnvContract ok | PASS |
| `https://glow.rinads.com/api/health` | productionEnvContract ok | PASS |
| `https://rinads.com/` | redirect to www | PASS (307 → www) |
| `https://glow.rinads.com/login` | R GLOW login | PASS (brand strings present) |
| DNS `glow.rinads.com` | Vercel | PASS (resolves) — **supersedes 2026-09-21 “DNS missing” note** |

## Required project settings (verify in dashboard — agent cannot read)

### rinads-website

- [ ] Root Directory = `apps/website`
- [ ] Production branch = `main`
- [ ] Framework = Next.js
- [ ] Install/build per `apps/website/vercel.json`
- [ ] Domains: `www.rinads.com`, apex redirect
- [ ] Env: Supabase + `NEXT_PUBLIC_AUTH_PROVIDER=supabase` + `USE_DEMO_STORE=0`
- [ ] Env: `NEXT_PUBLIC_RINAGLOW_URL=https://glow.rinads.com`
- [ ] Env: `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.rinads.com`
- [ ] Optional: `LEAD_WEBHOOK_URL`, service role for `site_leads`, `NEXT_PUBLIC_GTM_ID`

### rinaglow

- [ ] Root Directory = `apps/rinaglow`
- [ ] Git connected to `rinads-india/rinads-website`
- [ ] Domain: `glow.rinads.com`
- [ ] Same Supabase + cookie domain contract as website
- [ ] Twilio secrets **not** in `NEXT_PUBLIC_*`
- [ ] Workers **not** enabled until sign-off

## Deploy procedure (founder-only)

1. CI green on `main`.
2. Confirm preview on PR.
3. Merge only with approval.
4. Confirm Production deployment SHA via GitHub Deployments or Vercel UI.
5. Re-hit both `/api/health` endpoints.
6. Smoke auth paths with test accounts.

## Emergency CLI

See `docs/deployment/POLICY.md` — emergency deploy only; not used by this audit.
