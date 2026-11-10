# Social OS — Provider Capabilities

_Last updated: 2026-11-10_

## Tier-1 providers (Phase 1 — to implement)

### Meta — Facebook Pages

| Capability | Scope required | Notes |
|-----------|---------------|-------|
| Read page info | `pages_read_engagement` | name, category, fan_count |
| Publish posts (image/text/video) | `pages_manage_posts` | requires Business Verification |
| Read post insights | `read_insights` | impressions, reach, engagement |
| Read comments | `pages_read_engagement` | moderation surface |
| Manage replies | `pages_manage_engagement` | Phase 2 |
| Read page DMs | `pages_messaging` | requires extra approval; Phase 3 |

OAuth flow: **Meta OAuth 2.0** (Facebook Login for Business)
- Authorization endpoint: `https://www.facebook.com/v22.0/dialog/oauth`
- Token endpoint: `https://graph.facebook.com/v22.0/oauth/access_token`
- Exchange short-lived for long-lived: Graph `/oauth/access_token?grant_type=fb_exchange_token`
- Long-lived tokens expire in ~60 days; must be rotated
- PKCE: not supported by Facebook Login for Business (state param only)
- Webhook: `page_post`, `page_mention`, `feed` via Meta Webhooks

### Meta — Instagram Business / Creator

| Capability | Scope required | Notes |
|-----------|---------------|-------|
| Read profile | `instagram_basic` | username, followers_count |
| Publish single-image | `instagram_content_publish` | must be a Business/Creator account |
| Publish carousel | `instagram_content_publish` | up to 10 items |
| Publish Reels | `instagram_content_publish` | video must be pre-uploaded to container |
| Read media insights | `instagram_manage_insights` | impressions, reach, saved |
| Read comments | `instagram_manage_comments` | Phase 2 |

OAuth flow: **same Meta OAuth 2.0 app** (Instagram uses Facebook Login)
- Requires the connected Facebook Page to have a linked Instagram Business account
- Container creation → publish two-step API
- Reels require signed container status check before publish_now

---

## Tier-2 providers (Phase 2)

| Provider | Auth type | Key scopes | Notes |
|---------|-----------|-----------|-------|
| LinkedIn | OAuth 2.0 + PKCE | `w_member_social`, `r_organization_social` | Company page requires admin role |
| X (Twitter) | OAuth 2.0 + PKCE | `tweet.write`, `users.read`, `offline.access` | OAuth 2.0 (not 1.1) |
| YouTube | Google OAuth 2.0 + PKCE | `youtube.upload`, `youtube.readonly` | Channel required |
| TikTok | OAuth 2.0 | `video.upload`, `user.info.basic` | TikTok for Developers login |
| Google Business | Google OAuth 2.0 + PKCE | `https://www.googleapis.com/auth/business.manage` | Location-bound |

---

## Tier-3 providers (Roadmap)

Pinterest, Threads, Snapchat, WhatsApp Business.

---

## Provider interface (extensibility contract)

Each provider adapter must implement `SocialProviderAdapter`:

```ts
interface SocialProviderAdapter {
  id: string;                    // "facebook" | "instagram" | ...
  displayName: string;
  logoSlug: string;              // used for asset lookup
  color: string;                 // brand hex
  oauthStartUrl(params: OAuthStartParams): string;
  exchangeCode(code: string, state: string, codeVerifier?: string): Promise<OAuthTokenSet>;
  refreshToken(refreshToken: string): Promise<OAuthTokenSet>;
  revokeToken(accessToken: string): Promise<void>;
  getConnectedAccounts(accessToken: string): Promise<ConnectedAccount[]>;
  capabilities(): ProviderCapability[];
  verifyWebhook(headers: Headers, rawBody: string): boolean;
}
```

Each provider registers itself into `PROVIDER_REGISTRY` — a typed map keyed by `SocialProviderId`.

---

## Scope minimisation policy

- Request **only the scopes needed for capabilities the tenant has licensed**
- Never request DM/messaging scopes unless the tenant has the Inbox add-on
- Display requested scopes to the user in the OAuth consent pre-screen
- Store granted scopes alongside the credential so capability checks are offline
