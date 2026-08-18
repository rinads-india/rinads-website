# rinads-platform — Supabase staging setup

Project created for **rinads-india/rinads-website**.

| Field | Value |
|-------|--------|
| Name | `rinads-platform` |
| URL | `https://zznigagovlhfyzcrjl.supabase.co` |
| Project ref | `zznigagovlhfyzcrjl` |
| GitHub | Connected to `rinads-india/rinads-website` |

## 1. Push migrations (required)

From repo root, with a [Supabase access token](https://supabase.com/dashboard/account/tokens):

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
export SUPABASE_DB_PASSWORD=...   # optional; avoids interactive prompt
bash scripts/supabase/link-and-push.sh
```

Or manually:

```bash
pnpm dlx supabase link --project-ref zznigagovlhfyzcrjl
pnpm dlx supabase db push
```

This applies **12 migrations** in order (core identity → commerce → operations → SaaS → CMS → onboarding V2).

### Verify in Table Editor

After push, confirm these exist:

- **Auth / tenancy:** `profiles`, `organizations`, `organization_members`, `roles`, `permissions`
- **SaaS:** `organization_settings`, `tenant_provisioning_jobs`, `plans`
- **CMS (PR #38):** `site_pages`, `site_page_sections`, `site_seo`, `site_redirects`, `site_media`
- **Onboarding V2 (PR #39):** `organization_settings.enabled_modules`, `organization_settings.business_type`

Dashboard **Database → Migrations** should list applied versions (no longer “No migrations”).

## 2. Website environment variables

Set in **Vercel** (Preview + Production when ready) and local `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://www.rinads.com

NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://zznigagovlhfyzcrjl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# CMS cache revalidation (after platform-admin CMS is used)
CMS_REVALIDATE_SECRET=<random-string>
WEBSITE_REVALIDATE_URL=https://<your-domain>/api/revalidate
```

Keys: **Project Settings → API** in Supabase dashboard.

Keep `NEXT_PUBLIC_AUTH_PROVIDER=demo` until migrations succeed and signup is tested.

## 3. Smoke test

1. Website signup → profile row in `profiles`
2. Onboarding → org created → `tenant_provisioning_jobs` row
3. `/os?welcome=1` loads Business OS
4. platform-admin (port 3004) → Website CMS pages load (uses same Supabase project)

## 4. Optional: regenerate TypeScript types

```bash
pnpm dlx supabase gen types typescript --linked > packages/database/src/generated.ts
```

## 5. GitHub integration note

Supabase ↔ GitHub connection helps branch previews later. **Migrations still must be applied** via `supabase db push` or the Supabase CLI in CI — linking the repo alone does not run SQL from `supabase/migrations/`.

## Related

- [SUPABASE_MIGRATIONS.md](./SUPABASE_MIGRATIONS.md) — phase-by-phase migration notes
- [CMS_FOLLOWUP_BACKLOG.md](../CMS_FOLLOWUP_BACKLOG.md) — CMS env + admin follow-ups
