/**
 * Instagram provider adapter.
 * SERVER ONLY — uses the same Meta App as Facebook.
 *
 * Instagram content publishing is two-step:
 *   1. Create a container (POST /{ig-user-id}/media)
 *   2. Publish the container (POST /{ig-user-id}/media_publish?creation_id=...)
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
  "instagram_basic",
  "instagram_content_publish",
  "pages_read_engagement",
  "pages_show_list",
];

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const instagramAdapter: SocialProviderAdapter = {
  id: "instagram",

  oauthStartUrl(params: OAuthStartParams): string {
    const appId =
      process.env["SOCIAL_INSTAGRAM_APP_ID"] ??
      requireEnv("SOCIAL_FACEBOOK_APP_ID");
    const url = new URL(`${AUTH_BASE}/${GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set(
      "scope",
      (params.scopes ?? DEFAULT_SCOPES).join(",")
    );
    url.searchParams.set("state", params.state);
    url.searchParams.set("response_type", "code");
    return url.toString();
  },

  async exchangeCode(
    code: string,
    _state: string,
    redirectUri: string
  ): Promise<OAuthTokenSet> {
    const appId =
      process.env["SOCIAL_INSTAGRAM_APP_ID"] ??
      requireEnv("SOCIAL_FACEBOOK_APP_ID");
    const appSecret =
      process.env["SOCIAL_INSTAGRAM_APP_SECRET"] ??
      requireEnv("SOCIAL_FACEBOOK_APP_SECRET");

    // Instagram uses the same token exchange endpoint as Facebook
    const shortUrl = new URL(`${BASE}/oauth/access_token`);
    shortUrl.searchParams.set("client_id", appId);
    shortUrl.searchParams.set("client_secret", appSecret);
    shortUrl.searchParams.set("redirect_uri", redirectUri);
    shortUrl.searchParams.set("code", code);

    const shortResp = await fetch(shortUrl.toString());
    if (!shortResp.ok) {
      const body = await shortResp.text().catch(() => "");
      throw new Error(
        `Instagram token exchange failed (${shortResp.status}): ${body.slice(0, 200)}`
      );
    }
    const short = (await shortResp.json()) as {
      access_token: string;
      token_type: string;
    };

    // Exchange for long-lived
    const longUrl = new URL(`${BASE}/oauth/access_token`);
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", appId);
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("fb_exchange_token", short.access_token);

    const longResp = await fetch(longUrl.toString());
    if (!longResp.ok) {
      const body = await longResp.text().catch(() => "");
      throw new Error(
        `Instagram long-lived exchange failed (${longResp.status}): ${body.slice(0, 200)}`
      );
    }
    const longToken = (await longResp.json()) as {
      access_token: string;
      token_type: string;
      expires_in?: number;
    };

    const expiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    return {
      accessToken: longToken.access_token,
      tokenType: longToken.token_type ?? "bearer",
      expiresAt,
      grantedScopes: DEFAULT_SCOPES,
    };
  },

  async refreshToken(_refreshToken: string): Promise<OAuthTokenSet> {
    throw new Error(
      "Instagram tokens cannot be refreshed silently. User must reconnect."
    );
  },

  async revokeToken(accessToken: string): Promise<void> {
    try {
      await fetch(`${BASE}/me/permissions`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Best-effort
    }
  },

  async getConnectedAccounts(accessToken: string): Promise<ConnectedAccount[]> {
    // Step 1: Get Facebook Pages
    const pagesUrl = new URL(`${BASE}/me/accounts`);
    pagesUrl.searchParams.set("fields", "id,instagram_business_account");
    pagesUrl.searchParams.set("access_token", accessToken);

    const pagesResp = await fetch(pagesUrl.toString());
    if (!pagesResp.ok) return [];

    const pagesData = (await pagesResp.json()) as {
      data?: Array<{
        id: string;
        instagram_business_account?: { id: string };
      }>;
    };

    const igAccounts: ConnectedAccount[] = [];

    for (const page of pagesData.data ?? []) {
      const igId = page.instagram_business_account?.id;
      if (!igId) continue;

      const igUrl = new URL(`${BASE}/${igId}`);
      igUrl.searchParams.set(
        "fields",
        "id,username,name,profile_picture_url,followers_count,biography"
      );
      igUrl.searchParams.set("access_token", accessToken);

      const igResp = await fetch(igUrl.toString());
      if (!igResp.ok) continue;

      const ig = (await igResp.json()) as {
        id: string;
        username?: string;
        name?: string;
        profile_picture_url?: string;
        followers_count?: number;
      };

      igAccounts.push({
        externalId: ig.id,
        accountType: "profile",
        displayName: ig.name ?? ig.username ?? ig.id,
        avatarUrl: ig.profile_picture_url,
        username: ig.username,
        followerCount: ig.followers_count,
      });
    }

    return igAccounts;
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
