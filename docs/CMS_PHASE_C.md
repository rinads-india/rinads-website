# CMS Phase C — scope

Follow-up after CMS + SEO admin foundation (Phase A/B). Tracked originally in [CMS_FOLLOWUP_BACKLOG.md](./CMS_FOLLOWUP_BACKLOG.md).

**Status:** not started in product code. This document freezes acceptance criteria so Phase C can ship as focused PRs.

## Goals

1. **Blog / posts** — `site_posts` (or equivalent) + public `/blog` and `/blog/[slug]` on `apps/website`, managed from `apps/platform-admin`
2. **Draft preview tokens** — signed `?preview=` tokens that render draft CMS pages without publishing
3. **Media uploads** — Supabase Storage upload from media admin (replace URL-only register)
4. **i18n variants** — en/ml content rows with locale-aware public routes
5. **Migrate `/story-concept`** — static HTML → CMS-managed Next route

## Non-goals (this phase)

- Full design-system rewrite
- Multi-region CDN invalidation beyond existing `CMS_REVALIDATE_SECRET` path
- Replacing the storefront product catalog CMS

## Suggested PR slices

| Slice | Deliverable | Done when |
|-------|-------------|-----------|
| C1 | Preview tokens | Draft page loads with valid token; invalid/expired token 404s; no index |
| C2 | Storage media upload | Admin uploads file → Storage → media row; public URL works |
| C3 | Blog schema + admin CRUD | Create/edit/publish post; RLS tenant-safe |
| C4 | Public blog routes | `/blog`, `/blog/[slug]` with SEO meta + revalidation |
| C5 | i18n content rows | Locale switch or path prefix; fallback to en |
| C6 | story-concept migration | Route served from CMS; static HTML removed or redirected |

## Dependencies

- Staging Supabase with CMS migration applied
- `WEBSITE_REVALIDATE_URL` + `CMS_REVALIDATE_SECRET` configured
- Production auth cutover for platform-admin editors

## Out of scope until after C1–C4

- LLM-assisted draft generation
- Editorial workflow approvals beyond publish flag
