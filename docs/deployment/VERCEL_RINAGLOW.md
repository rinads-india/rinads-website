# Deploy R GLOW on Vercel

For the full production cutover (migrations, Twilio, worker, smoke tests), use
[`RGLOW_PRODUCTION_CUTOVER.md`](./RGLOW_PRODUCTION_CUTOVER.md).

Create a separate Vercel project with repository root `apps/rinaglow`. The checked-in
`vercel.json` installs the filtered monorepo dependencies and runs
`pnpm --filter @rinads/rinaglow build`.

## Environment

Set these for Production:

- `NEXT_PUBLIC_AUTH_PROVIDER=supabase`
- `USE_SUPABASE=1`
- `USE_DEMO_STORE=0`
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_RINAGLOW_URL=https://glow.rinads.com` in both the website and R GLOW projects
- `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.rinads.com` in both projects

Do not set the cookie domain locally. Localhost then uses host-only cookies. In
Production the value is accepted only as a leading-dot parent domain; URL, path,
port, and malformed values are rejected. Salon routing is enabled only when the
R GLOW origin is HTTPS under `rinads.com` and the cookie domain is exactly
`.rinads.com`.

Supabase auth session cookies intentionally are not `HttpOnly`: the Supabase
browser client must read them to refresh a session. They are `Secure`,
`SameSite=Lax`, and scoped to `.rinads.com` in Production. The separate active
organization cookie remains `HttpOnly` with the same Production domain. Existing
host-only auth cookies are not widened in place, so users with an existing
session may need to sign in once after rollout.

## DNS and Supabase

Point `glow.rinads.com` at the Vercel project and verify the domain in Vercel.
Add the following URLs to the Supabase Auth redirect allowlist:

- `https://www.rinads.com/**`
- `https://rinads.com/**`
- `https://glow.rinads.com/**`

Keep preview URLs out of the Production cookie-sharing contract. Add explicit
preview callback URLs only where needed.

## Rollout and checks

1. Apply Supabase migrations through
   `20260916100003_fix_salon_vertical_routing.sql`.
2. Deploy R GLOW, then the website, with matching Supabase and cookie-domain values.
3. Confirm `https://glow.rinads.com/api/health` and the website health endpoint
   report a valid Production environment contract.
4. Sign in at the apex or `www` site as a salon member and verify `/os` redirects
   to `https://glow.rinads.com/calendar` without another login.
5. Verify a non-salon account stays in `/os`, an account with no membership enters
   onboarding, and a multi-organization account without an active selection stays
   in `/os`.
