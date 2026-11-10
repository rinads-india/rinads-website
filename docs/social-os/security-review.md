# Social OS — Security Review

_Last updated: 2026-11-10_

## Threat model summary

| Actor | Attack vector | Mitigation |
|-------|--------------|-----------|
| Unauthenticated user | Direct API call to `/api/social/connections/start` | `requireOsShellAccess` gate returns 401 |
| Authenticated user (wrong org) | Access another tenant's connections | `organization_id` RLS; server validates before every query |
| CSRF on OAuth callback | Craft a malicious callback URL | `state` param tied to `oauth_sessions.id` + `organization_id`; one-time use |
| Token theft from DB | Read `social_credentials` table | Tokens encrypted AES-256-GCM at application layer; DB sees only ciphertext |
| Token leak in logs | Error handler logs token | No token values logged; only token IDs and expiry timestamps |
| Provider webhook spoofing | POST fake webhook | HMAC-SHA256 signature verification using `SOCIAL_{PROVIDER}_WEBHOOK_SECRET` |
| Duplicate publish | Replay POST to publish | `idempotency_key` checked; duplicate → 200 with existing job |
| Accidental bulk post | Bug sends same post to all connections | Each `social_publish_jobs` row is per-connection; human approval required before publish |
| Privilege escalation | Viewer approves a publish job | Approval gate checks `roleKey` ≥ `staff`; RLS blocks direct table update |
| Mass credential revocation | Attacker disconnects all integrations | Disconnect requires `admin` tier; writes audit log; irreversible within session |
| Secret rotation gap | Old ciphertext unreadable after key rotation | `SOCIAL_TOKENS_SECRET_PREV` decrypts old ciphertexts during migration window |
| State parameter brute-force | Enumerate `oauth_sessions` state values | `state` is 32-byte CSPRNG hex; `oauth_sessions` expire in 10 minutes |

## OAuth implementation checklist

- [x] `state` parameter: cryptographically random 32 bytes (hex-encoded)
- [x] PKCE (`code_verifier` / `code_challenge`) where provider supports it (LinkedIn, X, YouTube, Google, TikTok)
- [x] Facebook/Instagram: PKCE not supported by Meta; `state` only
- [x] `oauth_sessions.used_at` prevents callback replay
- [x] `oauth_sessions` auto-expire via Postgres `expires_at < now()` check
- [x] Redirect URI exact-match validation on callback
- [x] `origin` header validation on API routes (same-origin)
- [x] Short-lived tokens exchanged for long-lived before storage
- [x] Token expiry tracked; refresh attempted before expiry

## Token encryption specification

```
plaintext  = JSON.stringify({ access_token, refresh_token, ... })
iv         = crypto.getRandomValues(16 bytes)
key        = AES-256-GCM key derived from SOCIAL_TOKENS_SECRET via HKDF-SHA-256
ciphertext = AES-256-GCM.encrypt(plaintext, key, iv)
stored     = base64url(iv) + "." + base64url(ciphertext) + "." + base64url(tag)
```

`SOCIAL_TOKENS_SECRET` is a 64-hex-character (256-bit) random value.
It is **never** sent to the browser, never logged, never stored in Supabase.

## Webhook security

```
// Meta (Facebook/Instagram)
X-Hub-Signature-256: sha256=<hmac>
verifyWebhook(headers, body, SOCIAL_FACEBOOK_WEBHOOK_SECRET)

// X (Twitter)
x-twitter-webhooks-signature: sha256Base64=<hmac>

// LinkedIn (future)
x-li-signature: <sha256-rsa>
```

Unknown providers: respond 200 (to avoid error enumeration) but discard payload.

## Scope minimisation

The OAuth consent screen (pre-flight in the browser) lists exactly the scopes being requested.
Scopes are determined by the capabilities the tenant has licensed, not by what the provider allows.

Minimum viable scopes for Phase 1:
- Facebook: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`
- Instagram: `instagram_basic`, `instagram_content_publish`

No messaging, no advertising, no audience data scopes unless explicitly unlocked.

## Audit log coverage

Every action writes an `audit_logs` row with:
- `actor_type` = `user` | `ai` | `system`
- `action` = `social.connection.created` | `social.connection.disconnected` | `social.publish.approved` | `social.publish.rejected` | `social.webhook.received` | `social.credential.rotated`
- `entity` = `social_connections` | `social_publish_jobs`
- `entity_id` = UUID of the affected row
- `before` / `after` = sanitised (no token values)

## Rate limiting

| Endpoint | Limit |
|---------|-------|
| `/api/social/connections/start` | 10 OAuth starts per org per hour |
| `/api/social/publish` | 50 publish submissions per org per 24h |
| `/api/social/webhooks/*` | 1000 events per provider per 5 min (sliding window) |

Limits implemented via in-memory Map (single-instance) with Supabase counter fallback for multi-region.

## Compliance notes

- Provider tokens are third-party personal data under GDPR if associated with a natural person's account
- Must appear on `/legal/subprocessors` for each connected provider
- DPA update required before any workspace can connect a live Meta account
- Data residency: tokens stored in Supabase region (verify against Meta DPA requirements)
- Right to erasure: `social_credentials` and `social_connections` are cascade-deleted when `organizations` row is deleted (ON DELETE CASCADE)

## Items requiring counsel review before GA

1. Meta DPA addendum for token storage
2. Instagram content rights policy acknowledgement
3. User data deletion callback implementation (Meta requirement for apps using Graph API)
4. Privacy Policy update to name social platform data processing
