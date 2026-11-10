# Social OS — Implementation Plan

_Last updated: 2026-11-10_

## Phases

### Phase 1 — Connections dashboard + Facebook/Instagram (this PR)

**Scope**: Read-only connection management. Publish pipeline scaffolded but gated.

| Deliverable | Status |
|-------------|--------|
| Supabase migration (7 tables) | ✅ Done |
| Provider interface + registry | ✅ Done |
| Facebook adapter (OAuth + token exchange) | ✅ Done |
| Instagram adapter (via Meta OAuth) | ✅ Done |
| Token vault (AES-256-GCM) | ✅ Done |
| OAuth session management | ✅ Done |
| `/api/social/connections/*` route handlers | ✅ Done |
| `/api/social/webhooks/[providerId]` | ✅ Done |
| `/api/social/publish` + approval gate | ✅ Done (gated) |
| Connections dashboard UI | ✅ Done |
| Provider cards (available + connected) | ✅ Done |
| Growth module bridge updated | ✅ Done |
| RBAC guards (admin/staff/client) | ✅ Done |
| Audit log integration | ✅ Done |
| Unit tests | ✅ Done |
| E2E tests (Playwright) | ✅ Done |
| Docs | ✅ Done |

### Phase 2 — LinkedIn, X, YouTube + publish workflow UI (next sprint)

- LinkedIn OAuth + adapter
- X OAuth 2.0 + PKCE + adapter
- YouTube adapter
- Full publish compose UI in `/os/growth/connections/publish`
- Approval inbox widget in `/os/approvals` for social items
- `social_metrics_daily` ingest job
- Comment management surface

### Phase 3 — Automation + analytics

- Scheduled publishing
- Cross-platform campaign bundles
- Analytics dashboard (reach, engagement per platform)
- RINPO AI copy suggestions via RINADS Intelligence
- Automatic reconnect notifications (email + OS notification)
- Webhook-driven real-time comment routing to `/os/communication`

## Migration rollback procedure

```sql
-- Rollback migration 20261110130000_social_connections.sql
-- Run in Supabase SQL editor or via psql

DROP TABLE IF EXISTS public.social_audit_logs CASCADE;
DROP TABLE IF EXISTS public.social_webhook_events CASCADE;
DROP TABLE IF EXISTS public.social_metrics_daily CASCADE;
DROP TABLE IF EXISTS public.social_publish_jobs CASCADE;
DROP TABLE IF EXISTS public.social_posts CASCADE;
DROP TABLE IF EXISTS public.social_credentials CASCADE;
DROP TABLE IF EXISTS public.social_connections CASCADE;
DROP TABLE IF EXISTS public.oauth_sessions CASCADE;
DROP TYPE  IF EXISTS public.social_provider_id CASCADE;
DROP TYPE  IF EXISTS public.connection_health_state CASCADE;
DROP TYPE  IF EXISTS public.publish_job_status CASCADE;
```

No existing tables are altered. Rollback is safe at any point before data is written.

## Environment variables required

| Variable | Required | Purpose |
|---------|---------|---------|
| `SOCIAL_TOKENS_SECRET` | Yes (server) | AES-256-GCM key for token encryption (64 hex chars) |
| `SOCIAL_TOKENS_SECRET_PREV` | No (rotation) | Previous key for decryption during rotation |
| `SOCIAL_FACEBOOK_APP_ID` | For Facebook | Meta App ID |
| `SOCIAL_FACEBOOK_APP_SECRET` | For Facebook | Meta App Secret (server-only) |
| `SOCIAL_FACEBOOK_WEBHOOK_SECRET` | For Facebook | Meta webhook verify token |
| `SOCIAL_INSTAGRAM_APP_ID` | For Instagram | Same Meta App, may share with Facebook |
| `NEXT_PUBLIC_SOCIAL_REDIRECT_BASE` | Yes | Base URL for OAuth callbacks (e.g. `https://www.rinads.com`) |

**None of the secret variables should be in `.env.example` with real values.**
Add placeholder comments only.

## Testing checklist before merging to `main`

- [ ] OAuth happy path: Facebook connect, check DB row, disconnect
- [ ] OAuth denial: user clicks "Cancel" on Facebook consent → graceful error state
- [ ] State mismatch: tampered `state` param → 400
- [ ] Token expiry: mock expired credential → reconnect prompt
- [ ] Duplicate callback: replay callback URL → 409 idempotent
- [ ] Cross-tenant: org A cannot see org B's connections (RLS test)
- [ ] Role gate: `client` tier cannot initiate disconnect
- [ ] Webhook HMAC: invalid signature → 401
- [ ] Publish approval: submit post → pending, approve → enqueued
- [ ] Publish duplicate: same `idempotency_key` → 200 with existing job
- [ ] Mobile responsiveness: 375px viewport, provider grid, action buttons ≥ 44px

## PR checklist

- [ ] Migration file added with timestamp prefix
- [ ] `.env.example` updated (placeholders only)
- [ ] No `console.log` with token values
- [ ] No client components import server-only lib modules
- [ ] `"use server"` / `"use client"` directives correct
- [ ] All new API routes set `export const dynamic = "force-dynamic"`
- [ ] Provider secrets never appear in error responses
