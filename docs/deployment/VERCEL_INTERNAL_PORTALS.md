# Vercel — Internal RINADS portals

This is the source of truth for production domains, environment, Supabase Auth allowlists, DNS, founder bootstrap, health checks, and the current demo-data limitation.

Do **not** point these Vercel projects at `apps/website` or the monorepo root. Each portal has its own `vercel.json` under its app directory.

## Production domains

| Host | App | Role |
|------|-----|------|
| `https://admin.rinads.com` | `apps/platform-admin` | Platform control plane |
| `https://app.rinads.com` | `apps/owner-portal` | Owner / staff workspace |
| `https://customers.rinads.com` | `apps/customer-portal` | Customer workspace |
| `https://glow.rinads.com` | `apps/rinaglow` | R GLOW / Salon OS |
| `https://www.rinads.com` | `apps/website` | Canonical login / reset origin |

Canonical password reset and invite callback origin: **`https://www.rinads.com`**.

Initial founder email: **`rinads.india@gmail.com`**.

Localhost (`http://localhost:3002`, `:3003`, `:3004`, `:3000`) is **development only**. Production portal URL helpers ignore localhost and require the exact hosts above.

## Vercel project settings

Create one Vercel project per app. Production branch: `main`.

| Project | Root Directory | Install | Build |
|---------|----------------|---------|-------|
| platform-admin | `apps/platform-admin` | from [`apps/platform-admin/vercel.json`](../../apps/platform-admin/vercel.json) (`pnpm install --filter @rinads/platform-admin...`) | `pnpm --filter @rinads/platform-admin build` |
| owner-portal | `apps/owner-portal` | [`apps/owner-portal/vercel.json`](../../apps/owner-portal/vercel.json) | `pnpm --filter @rinads/owner-portal build` |
| customer-portal | `apps/customer-portal` | [`apps/customer-portal/vercel.json`](../../apps/customer-portal/vercel.json) | `pnpm --filter @rinads/customer-portal build` |
| rinaglow | `apps/rinaglow` | [`apps/rinaglow/vercel.json`](../../apps/rinaglow/vercel.json) | `pnpm --filter @rinads/rinaglow build` |

`VERCEL_ENV=production` is what enables shared `.rinads.com` auth cookies. Preview deployments stay host-only even if `NODE_ENV=production`. `NODE_ENV` is used only when `VERCEL_ENV` is absent.

Platform demo bypass is **explicit development only** (`USE_DEMO_STORE=1` or `NEXT_PUBLIC_PLATFORM_DEMO=1` and development runtime). Preview and production fail closed.

## Required environment variables

Set the same Auth/Supabase contract on website, rinaglow (`apps/rinaglow`), and all three portals.

Browser-safe:

```text
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
NEXT_PUBLIC_SITE_URL=https://www.rinads.com
NEXT_PUBLIC_PLATFORM_ADMIN_URL=https://admin.rinads.com
NEXT_PUBLIC_OWNER_PORTAL_URL=https://app.rinads.com
NEXT_PUBLIC_CUSTOMER_PORTAL_URL=https://customers.rinads.com
NEXT_PUBLIC_RINAGLOW_URL=https://glow.rinads.com
```

Server-only (never `NEXT_PUBLIC_`):

```text
SUPABASE_SERVICE_ROLE_KEY=<service role>
CMS_REVALIDATE_SECRET=
WEBSITE_REVALIDATE_URL=https://www.rinads.com/api/revalidate
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Do not set `USE_DEMO_STORE=1` on preview or production.

## Supabase Auth URL allowlist

Authentication → URL configuration:

- **Site URL:** `https://www.rinads.com`
- **Redirect URLs** (exact):
  - `https://www.rinads.com/auth/callback`
  - `https://www.rinads.com/auth/callback?next=/auth/reset-password`
  - `https://www.rinads.com/auth/reset-password`
  - `https://admin.rinads.com/**`
  - `https://app.rinads.com/**`
  - `https://customers.rinads.com/**`
  - `https://glow.rinads.com/**`
  - Development only: `http://localhost:3000/auth/callback`, `http://localhost:3002/**`, `http://localhost:3003/**`, `http://localhost:3004/**`

Invite and recovery emails must use the canonical callback on `https://www.rinads.com`. Production cookies are scoped to `.rinads.com` so the session can continue on portal hosts after callback.

## DNS

Create CNAME records at the DNS provider (see also [`apps/website/DNS-SETUP.md`](../../apps/website/DNS-SETUP.md)):

| Host | Target |
|------|--------|
| `admin.rinads.com` | Vercel platform-admin project |
| `app.rinads.com` | Vercel owner-portal project |
| `customers.rinads.com` | Vercel customer-portal project |
| `glow.rinads.com` | Vercel rinaglow project |
| `www.rinads.com` | Vercel website project (already) |

Add the domains in each Vercel project → Settings → Domains. Use Vercel TXT verification if required.

## Founder bootstrap

After CORE identity migrations are applied:

```bash
pnpm admin:bootstrap-founder
# optional override
pnpm admin:bootstrap-founder -- --email other@example.com
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The script:

1. Finds or invites `rinads.india@gmail.com` (override allowed)
2. Uses canonical callback/reset redirect `https://www.rinads.com/auth/callback?next=/auth/reset-password`
3. Creates or finds organization slug `rinads-platform`
4. Assigns the `founder` role via the service role
5. Writes an audit row
6. **Never generates or logs a password or secret**

The founder sets their password from the invite/recovery email through `https://www.rinads.com/auth/reset-password`.

## Health and public webhook

Unauthenticated health:

- `https://admin.rinads.com/api/health`
- `https://app.rinads.com/api/health`
- `https://customers.rinads.com/api/health`
- `https://glow.rinads.com/api/health`

Platform Razorpay webhook remains public (signature-verified):

- `https://admin.rinads.com/api/webhooks/razorpay`

All other portal UI routes fail closed to `/login?next=...`. Authenticated visits to `/login` go to the default workspace path. Unauthorized roles see `/forbidden` without the nav/shell (URLs for authorized pages are unchanged via route groups).

## Auth gates (server is authoritative)

| App | Middleware | Server authorization |
|-----|------------|----------------------|
| platform-admin | session required | `founder` or `super_admin` |
| owner-portal | session required | active org + `founder` / `super_admin` / `admin` / `manager` / `staff` |
| customer-portal | session required | authenticated (minimum) |

Website login surfaces (`/signup?mode=login`, RINPO login modal, navbar Log in) link to `/auth/forgot-password` on the canonical origin.

Business OS module destinations (`apps/website/lib/os-module-destinations.ts`) already expose owner/customer/platform URLs through `getPortalUrls()`, which now wraps the shared production-safe portal map. Capability tiers remain the visibility filter inside `/os`. Those links are not authorization.

## Truthful demo-data limitation

Owner and customer portals still render sample/demo commerce and operations adapters in this monorepo. **Do not treat displayed catalog, orders, or tickets as live production owner/customer data** until a dedicated live data path is confirmed. Layouts show this limitation. Platform demo mode is development-only and labeled as demo.

R GLOW lives in this monorepo at `apps/rinaglow` (production host `glow.rinads.com`). It uses the shared `@rinads/auth` cookie helper and `sanitizeRelativeNext` sanitizer. Public `/feedback/*` stays unauthenticated; production env-contract failures return a graceful 503. Do not rewrite owner/customer business data adapters as part of this access layer.

## Related

- Public Experience: [`VERCEL_PUBLIC_EXPERIENCE.md`](./VERCEL_PUBLIC_EXPERIENCE.md)
- Deploy policy: [`POLICY.md`](./POLICY.md)
