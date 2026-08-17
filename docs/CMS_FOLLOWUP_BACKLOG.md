# CMS + Platform Follow-up Backlog

Tracked follow-up PRs after the CMS + SEO admin foundation (Phase A/B).

## P0 — Production blockers

| Item | Owner surface | Notes |
|------|---------------|-------|
| Live Supabase auth cutover | `apps/website` | Replace demo `AuthContext` with Supabase sessions |
| Apply CMS migration to staging | `supabase/migrations/20260820100000_site_cms.sql` | Founder-linked Supabase project |
| Configure CMS cache revalidation | `WEBSITE_REVALIDATE_URL`, `CMS_REVALIDATE_SECRET` | Platform-admin POSTs to `apps/website/app/api/revalidate/route.ts` after saves |
| Real notification delivery | `packages/runtime/src/adapters/email.ts` | Replace `{ ok: true }` stubs |

## P1 — Website product gaps

| Item | Path | Notes |
|------|------|-------|
| Project/contact form backend | `apps/website/components/projects/ProjectsLanding.tsx` | Replace fake 1s submit |
| Grow checkout → storefront | `apps/website/components/grow/GrowSectionTwo.tsx` | Wire SKUs to commerce checkout |
| OAuth signup | `apps/website/components/auth/RinadsSignUpApp.tsx` | Google / LinkedIn providers |

## P1 — Platform / runtime

| Item | Path | Notes |
|------|------|-------|
| Stripe billing adapter | `packages/billing/src/providers/stripe.ts` | Currently throws `NOT_IMPLEMENTED` |
| Live Razorpay subscription API | `packages/billing/src/providers/razorpay.ts` | Stub subscription IDs |
| DLQ replay UI | Phase 13+ | See `docs/PHASE_13_WORKER_PERSISTENCE.md` |

## P2 — CMS maturity (Phase C)

| Item | Notes |
|------|-------|
| Blog/posts + `/blog/[slug]` | New tables + routes |
| Draft preview tokens | `?preview=` on website |
| Migrate `/story-concept` static HTML | Into CMS-managed Next route |
| Supabase Storage upload in media admin | Replace URL-only register flow |
| i18n CMS variants | en/ml content rows |

## P2 — Intelligence

| Item | Notes |
|------|-------|
| `apps/intelligence` shell | Roadmap days 61–90 |
| LLM-backed RINPO chat | Replace rule-based `/api/chat` |
