# rinads-platform — Supabase staging setup

Project created for **rinads-india/rinads-website**.

| Field | Value |
|-------|--------|
| Name | `rinads-platform` |
| URL | `https://zznigagovilnffyzcrlj.supabase.co` |
| Project ref | `zznigagovilnffyzcrlj` |
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
pnpm dlx supabase link --project-ref zznigagovilnffyzcrlj
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

## 2. Cursor Supabase MCP (inspect & debug)

Repo config: [`.cursor/mcp.json`](../../.cursor/mcp.json) — hosted MCP scoped to this project (no secrets in git):

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=zznigagovilnffyzcrlj&features=docs,account,database,debugging,development,functions,branching"
    }
  }
}
```

**Before trusting the config**, confirm **Project Settings → General → Reference ID** matches `zznigagovilnffyzcrlj` (URL: `https://zznigagovilnffyzcrlj.supabase.co`). A typo in `project_ref` connects to the wrong project or fails auth.

### Authenticate (manual)

1. **Cursor → Settings → Tools & MCP** (or Features → MCP Servers)
2. Confirm **supabase** appears from `.cursor/mcp.json`
3. Click **Connect / Sign in** and complete Supabase OAuth in the browser
4. Status should show **connected**

For **Cloud Agents**: ensure team/environment egress allows `mcp.supabase.com`. If MCP shows `needsAuth` in agent runs, complete OAuth on the machine where the agent runs, or add Supabase to the environment MCP allowlist in Cursor Portal.

### Verify MCP

In Cursor chat, ask the agent to:

- List tables in the `public` schema
- Confirm migrations ran (`profiles`, `site_pages`, `site_seo`, `organization_settings`)

Expected: Supabase MCP tools respond; no `needsAuth` errors.

### MCP vs CLI

| Tool | Purpose |
|------|---------|
| **Supabase MCP** | Inspect schema, run ad-hoc queries, debug — read-only unless you add `&read_only=false` to the URL |
| **`supabase db push`** | Apply canonical schema from [`supabase/migrations/`](../../supabase/migrations/) |

MCP does **not** replace migration push. Use [`scripts/supabase/link-and-push.sh`](../../scripts/supabase/link-and-push.sh) for schema changes committed in the repo.

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `needsAuth` / tools unavailable | Re-run OAuth in Cursor Settings → Tools & MCP |
| Wrong tables or empty project | Verify `project_ref` in `.cursor/mcp.json` matches dashboard Reference ID |
| Expected tables missing | Run section 1 (`db push`); MCP only reflects what is already applied |
| Cloud agent blocked | Allow `mcp.supabase.com` in environment egress / MCP settings |

### Optional: Supabase agent skills

Install locally (user-level; do not commit skill binaries):

```bash
npx skills add supabase/agent-skills
```

Adds Supabase-specific agent instructions for database and API work. Optional; does not block MCP.

## 3. Website environment variables

Set in **Vercel** (Preview + Production when ready) and local `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://www.rinads.com

NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://zznigagovilnffyzcrlj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Services checkout (Vercel — server secret never NEXT_PUBLIC_)
NEXT_PUBLIC_RAZORPAY_KEY_ID=<rzp_test_...>
RAZORPAY_KEY_SECRET=<secret>
# Supabase Edge Function secret (payment-webhook):
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>

# CMS cache revalidation (after platform-admin CMS is used)
CMS_REVALIDATE_SECRET=<random-string>
WEBSITE_REVALIDATE_URL=https://<your-domain>/api/revalidate
```

Keys: **Project Settings → API** in Supabase dashboard.

Keep `NEXT_PUBLIC_AUTH_PROVIDER=demo` until migrations succeed and signup is tested.

## 4. Smoke test

1. Website signup → profile row in `profiles`
2. Onboarding → org created → `tenant_provisioning_jobs` row → `rinads_active_org` cookie set on completion
3. `/os?welcome=1` loads Business OS
4. platform-admin (port 3004) → Website CMS pages load (uses same Supabase project)

### Services checkout E2E (staging)

1. Sign in → complete onboarding if no org
2. Open `/services` → pick a catalog service → **Continue to checkout**
3. Razorpay test mode payment completes → redirect to `/track/[orderId]`
4. Razorpay dashboard webhook: `https://zznigagovilnffyzcrlj.supabase.co/functions/v1/payment-webhook` (event: `payment.captured`)
5. Verify in Supabase:
   - `service_orders.status` → `paid` or `assigned`
   - `service_tasks` row when partner available
   - `payment_webhook_events` idempotency row
6. Track page shows progress beyond `pending` (polls while webhook processes)

## 5. Optional: regenerate TypeScript types

```bash
pnpm dlx supabase gen types typescript --linked > packages/database/src/generated.ts
```

## 6. GitHub integration note

Supabase ↔ GitHub connection helps branch previews later. **Migrations still must be applied** via `supabase db push` or the Supabase CLI in CI — linking the repo alone does not run SQL from `supabase/migrations/`.

## Related

- [`.cursor/mcp.json`](../../.cursor/mcp.json) — Cursor Supabase MCP (OAuth, no tokens)
- [SUPABASE_MIGRATIONS.md](./SUPABASE_MIGRATIONS.md) — phase-by-phase migration notes
- [CMS_FOLLOWUP_BACKLOG.md](../CMS_FOLLOWUP_BACKLOG.md) — CMS env + admin follow-ups
