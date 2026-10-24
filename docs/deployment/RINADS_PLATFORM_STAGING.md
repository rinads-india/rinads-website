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

Do not push migrations merely because the MCP connection succeeds. First inspect the remote migration history and schema, compare it with the canonical repo migration ledger, and only then apply reviewed pending migrations.

### Verify in Table Editor

After the canonical migrations are confirmed/applied, verify the expected platform tables, including:

- **Auth / tenancy:** `profiles`, `organizations`, `organization_members`, `roles`, `permissions`
- **SaaS:** `organization_settings`, `tenant_provisioning_jobs`, `plans`
- **CMS:** `site_pages`, `site_page_sections`, `site_seo`, `site_redirects`, `site_media`
- **Onboarding:** `organization_settings.enabled_modules`, `organization_settings.business_type`

Dashboard **Database → Migrations** must agree with the repository migration ledger before any production activation.

## 2. Supabase MCP — canonical project inspection

The repository carries two MCP configs pointing to the same project:

- [`.mcp.json`](../../.mcp.json) — shared project config for compatible coding agents
- [`.cursor/mcp.json`](../../.cursor/mcp.json) — Cursor-specific config

Both are intentionally **project-scoped and read-only** for the initial production audit:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=zznigagovilnffyzcrlj&read_only=true&features=database,docs,debugging"
    }
  }
}
```

This is the required default for production/staging inspection. Do not remove `read_only=true` until the project identity, migration ledger, RLS posture, advisors and activation plan have been reviewed.

**Before trusting the config**, confirm **Project Settings → General → Reference ID** equals `zznigagovilnffyzcrlj` and the project URL is exactly `https://zznigagovilnffyzcrlj.supabase.co`.

### Authenticate MCP

The hosted Supabase MCP server uses OAuth. Authentication is per client/device.

For ChatGPT:

1. Add the Supabase MCP/connector from the Supabase project Connect flow.
2. Complete Supabase OAuth using the account that owns or has access to `zznigagovilnffyzcrlj`.
3. Verify the connected project reference before allowing any action.
4. Keep the first audit read-only.

For Cursor:

1. **Cursor → Settings → Tools & MCP**
2. Confirm **supabase** appears from `.cursor/mcp.json`
3. Click **Connect / Sign in** and complete Supabase OAuth in the browser
4. Status should show **connected**

For Cloud Agents: ensure team/environment egress allows `mcp.supabase.com`. If MCP shows `needsAuth`, complete OAuth on the machine where the agent runs or add Supabase to the environment MCP allowlist.

### First verification queries

Before changing schema, use MCP to verify:

- project URL / project ref
- tables in `public`
- migration history
- RLS enabled on exposed tables
- policies for `organizations`, `organization_members`, commerce and runtime tables
- installed extensions relevant to the platform
- Auth/JWT signing-key posture
- Security Advisor findings
- Performance Advisor findings

Expected result: the remote project matches the canonical RINADS platform schema. If it does not, stop and reconcile instead of pushing migrations blindly.

### MCP vs CLI

| Tool | Purpose |
|------|---------|
| **Supabase MCP (`read_only=true`)** | Inspect schema, migration history, logs/advisors and debug safely |
| **Supabase CLI / reviewed SQL** | Apply canonical schema only after the audit and migration review |

MCP does **not** replace migration governance. Schema changes must originate from the canonical repository migration chain and pass review/advisors before production application.

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `needsAuth` / tools unavailable | Re-run OAuth in the MCP client |
| Project not visible after OAuth | Reconnect using the Supabase account/org that owns `zznigagovilnffyzcrlj` |
| Wrong tables or empty project | Verify the exact project ref and stop before writes |
| Expected tables missing | Compare migration history first; do not blindly `db push` |
| Cloud agent blocked | Allow `mcp.supabase.com` in environment egress / MCP settings |

### Supabase Agent Skills

Install in the repository/workspace used by the coding agent:

```bash
npx skills add supabase/agent-skills
```

To install for every detected supported agent:

```bash
npx skills add supabase/agent-skills --all
```

These skills improve Supabase-specific implementation guidance but do not grant project access. OAuth/MCP authentication is still required.

## 3. Website environment variables

Set in **Vercel** (Preview + Production only after the project audit passes) and local `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://www.rinads.com

NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://zznigagovilnffyzcrlj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-compatible-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>

# Services checkout (Vercel — server secret never NEXT_PUBLIC_)
NEXT_PUBLIC_RAZORPAY_KEY_ID=<rzp_test_...>
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>

# CMS cache revalidation
CMS_REVALIDATE_SECRET=<random-string>
WEBSITE_REVALIDATE_URL=https://<your-domain>/api/revalidate
```

Prefer Supabase publishable keys for new frontend configuration where supported. Never expose service-role/secret keys in browser variables.

Keep any production auth/provider switch fail-closed until migrations, signup, tenant provisioning and RLS are verified against this exact project.

## 4. Smoke test

After the audit and approved activation:

1. Website signup → profile row in `profiles`
2. Onboarding → org created → `tenant_provisioning_jobs` row → active-org context set
3. `/os?welcome=1` loads Business OS only for the authorised tenant
4. platform-admin → Website CMS pages load from the same verified Supabase project
5. Cross-tenant negative test proves another organisation cannot read the first tenant's records

### Services checkout E2E

Run only after the database and payment environment are explicitly approved:

1. Sign in → complete onboarding if no org
2. Open `/services` → pick a catalog service → **Continue to checkout**
3. Razorpay test-mode payment completes → redirect to `/track/[orderId]`
4. Razorpay webhook target: `https://zznigagovilnffyzcrlj.supabase.co/functions/v1/payment-webhook`
5. Verify `service_orders`, `service_tasks` and `payment_webhook_events`
6. Confirm duplicate webhook delivery is idempotent

## 5. Optional: regenerate TypeScript types

After schema verification:

```bash
pnpm dlx supabase gen types typescript --linked > packages/database/src/generated.ts
```

## 6. GitHub integration note

Supabase ↔ GitHub connection helps branch previews. It does not make repository migrations automatically safe to apply. Production schema changes still require migration-ledger reconciliation, RLS review, advisors and an explicit activation gate.

## Related

- [`.mcp.json`](../../.mcp.json) — shared Supabase MCP config
- [`.cursor/mcp.json`](../../.cursor/mcp.json) — Cursor Supabase MCP config
- [SUPABASE_MIGRATIONS.md](./SUPABASE_MIGRATIONS.md) — migration notes
- [CMS_FOLLOWUP_BACKLOG.md](../CMS_FOLLOWUP_BACKLOG.md) — CMS env + admin follow-ups
