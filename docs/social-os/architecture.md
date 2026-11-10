# Social OS — Architecture

_Last updated: 2026-11-10_

## Route tree

```
/os/growth/connections          ← new dashboard (this feature)
/os/growth/connections/[providerId]/connect   ← OAuth start (server redirect)
/api/social/connections/status               ← GET — list connections for tenant
/api/social/connections/start               ← POST — begin OAuth, returns redirect URL
/api/social/connections/callback            ← GET — OAuth callback (state + code)
/api/social/connections/disconnect          ← POST — revoke + delete credential
/api/social/connections/reconnect           ← POST — refresh expired credential
/api/social/publish                         ← POST — enqueue publish job (approval gate)
/api/social/publish/[jobId]/approve         ← POST — human approval (staff+)
/api/social/publish/[jobId]/cancel          ← POST — cancel pending job
/api/social/webhooks/[providerId]           ← POST — provider webhook receiver
```

## Data flow — OAuth connection

```
Browser → POST /api/social/connections/start
           (body: { providerId, tenantId })
                ↓
         server: generate PKCE pair (where supported)
                 store oauth_sessions row (org-scoped, TTL 10 min)
                 return { authorizationUrl }
                ↓
Browser → redirect to provider authorization URL
                ↓
Provider → GET /api/social/connections/callback?code=...&state=...
                ↓
         server: verify state against oauth_sessions
                 exchange code for tokens
                 encrypt tokens with AES-256-GCM (server-only key)
                 upsert social_credentials row
                 fetch connected accounts from provider
                 upsert social_connections rows
                 write audit_log entry
                 delete oauth_sessions row
                ↓
Browser ← redirect to /os/growth/connections?connected=facebook
```

## Data flow — Social publish

```
Browser → POST /api/social/publish
           (body: { connectionId, postBody, scheduledAt? })
                ↓
         server: validate tenant owns connectionId
                 create social_posts row (draft)
                 create social_publish_jobs row (status: pending_approval)
                 emit RuntimeApprovalRequest via @rinads/runtime
                ↓
Approver → POST /api/social/publish/{jobId}/approve
                ↓
         server: verify approver role ≥ staff
                 update job status → approved
                 resolve RuntimeApproval
                 enqueue publish via Supabase Edge Function / cron
                ↓
Edge Function → call provider API to publish
                update job status (published | failed)
                update social_metrics_daily baseline
                write audit_log entry
```

## Token security

| Concern | Solution |
|---------|---------|
| Token at rest | AES-256-GCM encryption via `SOCIAL_TOKENS_SECRET` (server env only) |
| Token in transit | HTTPS only; never sent to browser |
| Token scope log | `granted_scopes text[]` stored in `social_credentials` |
| Expiry | `expires_at` checked before every API call; auto-refresh if `refresh_token` exists |
| Revocation | On disconnect: provider revoke API + credential row deleted (soft-delete option) |
| Key rotation | `SOCIAL_TOKENS_SECRET_PREV` environment variable allows decrypting old ciphertexts during rotation |

## Tenant isolation

- Every table carries `organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- Supabase RLS policy: `organization_id = private.active_organization_id()` (uses same pattern as existing migrations)
- API routes call `requireOsShellAccess()` / `requireSocialConnectionAccess()` before any DB mutation
- Service-role client is used only server-side for token write operations

## Approval gate (RINPO Runtime integration)

```ts
// Publish request triggers runtime approval
const approval = await createApprovalRequest(store, {
  organizationId,
  actionKey: "social.publish",
  payloadHash: sha256(JSON.stringify(post)),
  riskLevel: "medium",
  requestedBy: userId,
  reason: `Publish to ${connectionName}: "${post.text.slice(0, 60)}…"`,
  ttlHours: 72,
});
```

Approvers (role ≥ `staff`) see the pending job in `/os/approvals` and in the Connections dashboard.

## Package boundaries

```
apps/website/
  app/os/growth/connections/     ← page + sub-routes (RSC + client boundary)
  app/api/social/                ← API routes (server-only)
  components/os/social/          ← UI components (client)
  lib/social-connections/        ← business logic (server-safe, no React)
    crypto.ts                    ← AES-256-GCM token vault helpers
    guard.ts                     ← access + rate-limit guards
    providers/
      registry.ts
      facebook.ts
      instagram.ts
    types.ts
    session.ts                   ← oauth_sessions helpers
    credential.ts                ← social_credentials CRUD
    connection.ts                ← social_connections CRUD
    publish.ts                   ← publish job pipeline
    audit.ts                     ← social audit log writer
    webhook.ts                   ← webhook signature verification
```

## Idempotency + retries

- `social_publish_jobs` carries `idempotency_key` (UUID); duplicate POST returns existing job
- Publish edge function retries 3× with exponential back-off; sets `failed` after final failure
- OAuth callback deduplication: `oauth_sessions.used_at` set on first use; replayed callbacks → 409

## Connection monitoring

- `connection_status` column updated via nightly Supabase Edge Function that calls a lightweight
  "check account" endpoint on each provider (e.g. `GET /me` for Facebook)
- `social_connections.last_checked_at` and `health_state` (`healthy | degraded | expired | error`)
  drive the status chip in the dashboard
