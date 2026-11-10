/**
 * Facebook provider adapter.
 * SERVER ONLY — uses SOCIAL_FACEBOOK_APP_ID and SOCIAL_FACEBOOK_APP_SECRET.
 *
 * Uses Graph API v22.0. No PKCE (Meta does not support it for pages auth).
 */
import type { SocialProviderAdapter } from "./registry";
import type {
  OAuthStartParams,
  OAuthTokenSet,
  ConnectedAccount,
} from "../types";

const GRAPH_VERSION = "v22.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const AUTH_BASE = "https://www.facebook.com";
const DEFAULT_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
];

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const facebookAdapter: SocialProviderAdapter = {
  id: "facebook",

  oauthStartUrl(params: OAuthStartParams): string {
    const appId = requireEnv("SOCIAL_FACEBOOK_APP_ID");
    const url = new URL(`${AUTH_BASE}/${GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("scope", (params.scopes ?? DEFAULT_SCOPES).join(","));
    url.searchParams.set("state", params.state);
    url.searchParams.set("response_type", "code");
    return url.toString();
  },

  async exchangeCode(
    code: string,
    _state: string,
    redirectUri: string
  ): Promise<OAuthTokenSet> {
    const appId = requireEnv("SOCIAL_FACEBOOK_APP_ID");
    const appSecret = requireEnv("SOCIAL_FACEBOOK_APP_SECRET");

    // 1. Exchange code for short-lived token
    const shortUrl = new URL(`${BASE}/oauth/access_token`);
    shortUrl.searchParams.set("client_id", appId);
    shortUrl.searchParams.set("client_secret", appSecret);
    shortUrl.searchParams.set("redirect_uri", redirectUri);
    shortUrl.searchParams.set("code", code);

    const shortResp = await fetch(shortUrl.toString());
    if (!shortResp.ok) {
      const body = await shortResp.text().catch(() => "");
      throw new Error(`Facebook token exchange failed (${shortResp.status}): ${body.slice(0, 200)}`);
    }
    const short = (await shortResp.json()) as {
      access_token: string;
      token_type: string;
    };

    // 2. Exchange short-lived for long-lived (60-day)
    const longUrl = new URL(`${BASE}/oauth/access_token`);
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", appId);
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("fb_exchange_token", short.access_token);

    const longResp = await fetch(longUrl.toString());
    if (!longResp.ok) {
      const body = await longResp.text().catch(() => "");
      throw new Error(`Facebook long-lived exchange failed (${longResp.status}): ${body.slice(0, 200)}`);
    }
    const longToken = (await longResp.json()) as {
      access_token: string;
      token_type: string;
      expires_in?: number;
    };

    const expiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // default 60 days

    return {
      accessToken: longToken.access_token,
      tokenType: longToken.token_type ?? "bearer",
      expiresAt,
      grantedScopes: DEFAULT_SCOPES,
    };
  },

  async refreshToken(_refreshToken: string): Promise<OAuthTokenSet> {
    // Facebook long-lived tokens are refreshed by re-exchanging with app credentials.
    // For pages tokens, the page access token derived from a user token auto-extends.
    // This path triggers a re-auth flow; treat as expired.
    throw new Error(
      "Facebook tokens cannot be refreshed silently. User must reconnect."
    );
  },

  async revokeToken(accessToken: string): Promise<void> {
    const appId = requireEnv("SOCIAL_FACEBOOK_APP_ID");
    const appSecret = requireEnv("SOCIAL_FACEBOOK_APP_SECRET");
    try {
      await fetch(`${BASE}/me/permissions`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      void appId;
      void appSecret;
    } catch {
      // Best-effort; do not throw
    }
  },

  async getConnectedAccounts(accessToken: string): Promise<ConnectedAccount[]> {
    const url = new URL(`${BASE}/me/accounts`);
    url.searchParams.set(
      "fields",
      "id,name,category,fan_count,picture{url},access_token"
    );
    url.searchParams.set("access_token", accessToken);

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      throw new Error(
        `Facebook /me/accounts failed (${resp.status})`
      );
    }
    const data = (await resp.json()) as {
      data?: Array<{
        id: string;
        name: string;
        category?: string;
        fan_count?: number;
        picture?: { data?: { url?: string } };
      }>;
    };

    return (data.data ?? []).map((page) => ({
      externalId: page.id,
      accountType: "page",
      displayName: page.name,
      avatarUrl: page.picture?.data?.url,
      followerCount: page.fan_count,
    }));
  },

  async verifyWebhook(body: Buffer, signature: string, appSecret: string): Promise<boolean> {
    if (!appSecret) return false;
    if (!signature || !signature.startsWith("sha256=")) return false;

    const { createHmac } = await import("node:crypto");
    const expected = "sha256=" + createHmac("sha256", appSecret).update(body).digest("hex");

    if (signature.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < signature.length; i++) {
      diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return diff === 0;
  },
};
