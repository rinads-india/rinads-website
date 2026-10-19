# RINADS Marketing OS — Phase 0.1 Meta read-only connection

## Objective

Phase 0.1 turns the Phase 0 channel boundary into a production-oriented, read-only Meta connection path. It is intentionally **not** a publishing or advertising-spend release.

## Enabled boundary

```text
Authenticated RINADS user
  -> active organization + marketing.channels.manage
  -> signed short-lived OAuth state
  -> Meta OAuth (read-only scopes)
  -> server-side code exchange
  -> AES-256-GCM encrypted credential row (service role only)
  -> channel_connections.credential_ref
  -> pinned Meta Graph transport
  -> Facebook Page / Instagram Professional account discovery
  -> channel_accounts
  -> read-only account metrics
  -> marketing_metric_snapshots
  -> RINADS Intelligence / RINPO read models
```

## Explicitly disabled

- Publishing, scheduling, deleting posts, replies, comments mutations.
- Ads creation, campaign-budget changes, billing changes, or any `ads_*` permission by default.
- Browser access to OAuth credential material.
- Plaintext access/refresh token storage in normal tenant tables.

## Required server configuration

Set these only in the deployment secret store/server environment:

```text
RINADS_META_APP_ID=<Meta app id>
RINADS_META_APP_SECRET=<Meta app secret>
RINADS_META_GRAPH_VERSION=<explicit reviewed version, e.g. vXX.X>
RINADS_META_OAUTH_STATE_SECRET=<high-entropy signing secret>
RINADS_MARKETING_CREDENTIAL_ENCRYPTION_KEY=<32-byte key, base64 or 64-char hex>
RINADS_META_READ_SCOPES=pages_show_list,pages_read_engagement,instagram_basic
SUPABASE_SERVICE_ROLE_KEY=<existing server-only key>
```

Do not set an unversioned Graph endpoint. The runtime rejects versions that do not match `v<major>.<minor>`.

The default code path intentionally rejects advertising scopes in Phase 0.1. Add richer insight scopes only after Meta app review and a separate security review.

## Credential model

`channel_connections.credential_ref` contains only `marketing-credential://<uuid>`.

The referenced `marketing_channel_credentials` row stores AES-256-GCM ciphertext, IV, authentication tag, scopes, and expiry metadata. RLS is enabled and there are no `anon` or `authenticated` policies. Application access is service-role only. The encryption key never lives in Postgres.

This design is an interim application-level vault. It allows rotation via `key_version`; a managed KMS/Vault-backed implementation can replace the storage adapter without changing tenant/channel contracts.

## Meta transport

`MetaGraphClient` requires an explicit Graph version and never puts normal Graph access tokens in request URLs. Tokens are supplied with the `Authorization: Bearer` header for Graph reads. OAuth exchange parameters remain server-only and provider errors are surfaced without application logging of request URLs or credentials.

Account discovery requests Facebook Pages and their linked Instagram Business accounts. The implementation does not request page access tokens, so page tokens are neither returned to the browser nor persisted.

## Analytics scope

Phase 0.1 persists low-risk account profile metrics such as follower/fan/media counts as normalized snapshots. Rich post/insight analytics remain a follow-on once required Meta review scopes are approved.

## Next gate: Phase 0.2

1. Runtime approval bridge for publish actions.
2. Publication worker + idempotent provider attempts.
3. Media upload/publish transport behind Level 2+ approvals.
4. Retry/dead-letter policy and provider reconciliation.
5. Only after those controls: separately review paid-media read access. Ad-spend mutation remains disabled until a later founder-approved gate.
