# Vercel deployment verification checklist

**Audit date:** 2026-09-25 (refresh 2026-09-26)  
**Team:** `rinadss-projects-1ebcffe7` (`team_5JqD1eqjxH1JTNYYAB5c13Z2`)

## Projects (historical IDs — MCP scope reduced 2026-09-26)

| Project | ID | Role |
|---------|----|------|
| `rinads-website` | `prj_fROCYQ2sYOCKCPrEKT0zaAFyCPa3` | Public Experience (`apps/website`) |
| `rinaglow` | `prj_k77S5CRi1k7zt3JmXLQlc7UKQBTY` | R GLOW (`apps/rinaglow`) |

## MCP gaps

| API | Result | Workaround used |
|-----|--------|-----------------|
| `list_projects` (2026-09-26) | Only unrelated project visible; `search=rinads` empty | Treat website/rinaglow as **out of MCP scope** for this token |
| `get_project` / `filter_project_envs` / `list_project_domains` | 404 Not Found for rinads project IDs | Root-dir/env/cookie env **unverified via API** |
| `list_deployments` | 403 Forbidden (prior) | GitHub Deployments API for SHA |

## Production deploy SHA (GitHub Deployments)

| Environment | SHA | Created (UTC) |
|-------------|-----|---------------|
| Production – rinads-website | `67473ae` | 2026-09-26T09:27:49Z |
| Production – rinaglow | `67473ae` | 2026-09-26T09:27:17Z |

Matches `origin/main` at 2026-09-26 verification (**DEPLOYED = main**). Prior audit SHA `eb7a95a` superseded.

## Domain / health probes

| Check | Expected | Result 2026-09-26 |
|-------|----------|-------------------|
| `https://www.rinads.com/api/health` | productionEnvContract ok | PASS |
| `https://glow.rinads.com/api/health` | productionEnvContract ok | PASS |
| `https://rinads.com/` | redirect to www | PASS (prior 2026-09-25) |
| `https://glow.rinads.com/login` | R GLOW login | PASS (HTTP 200) |
| DNS `www` / `glow` | Vercel | PASS (`*.vercel-dns-*.com`) |
| Cookie domain env on both projects | `.rinads.com` | **BLOCKED** via API; code defaults production domain in `@rinads/auth` |

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
