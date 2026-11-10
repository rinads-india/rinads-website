/**
 * Provider registry — maps SocialProviderId to metadata and adapter factories.
 * SERVER ONLY for adapter access; metadata is safe for client.
 */
import type {
  SocialProviderId,
  SocialProviderMeta,
  OAuthStartParams,
  OAuthTokenSet,
  ConnectedAccount,
} from "../types";

export interface SocialProviderAdapter {
  id: SocialProviderId;
  /** Build the authorization URL to redirect the user to. */
  oauthStartUrl(params: OAuthStartParams): string;
  /** Exchange authorization code for token set. */
  exchangeCode(
    code: string,
    state: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokenSet>;
  /** Refresh an expired access token. */
  refreshToken(refreshToken: string): Promise<OAuthTokenSet>;
  /** Revoke access token at the provider. Best-effort; must not throw. */
  revokeToken(accessToken: string): Promise<void>;
  /** Fetch accounts/pages/channels accessible with this token. */
  getConnectedAccounts(accessToken: string): Promise<ConnectedAccount[]>;
  /** Verify a webhook HMAC-SHA256 signature. Returns true if valid. */
  verifyWebhook(body: Buffer, signature: string, appSecret: string): Promise<boolean>;
}

/** Static provider metadata (safe for client components). */
export const PROVIDER_META: Record<SocialProviderId, SocialProviderMeta> = {
  facebook: {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    description: "Connect Facebook Pages to publish posts and read engagement metrics.",
    color: "#1877F2",
    phase: 1,
    capabilities: ["publish_text", "publish_image", "publish_video", "read_insights"],
    oauthNote: "Connects your Facebook Pages via Meta Business.",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    description: "Connect Instagram Business accounts to publish media and reels.",
    color: "#E1306C",
    phase: 1,
    capabilities: ["publish_image", "publish_carousel", "publish_video", "publish_reel", "read_insights"],
    oauthNote: "Requires a Business or Creator Instagram account linked to a Facebook Page.",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    description: "Publish company updates and articles to LinkedIn Pages.",
    color: "#0A66C2",
    phase: 2,
    capabilities: ["publish_text", "publish_image", "read_insights"],
  },
  x: {
    id: "x",
    name: "X",
    icon: "𝕏",
    description: "Post tweets and threads to X (formerly Twitter).",
    color: "#000000",
    phase: 2,
    capabilities: ["publish_text", "publish_image"],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    icon: "▶️",
    description: "Upload videos and manage your YouTube channel.",
    color: "#FF0000",
    phase: 2,
    capabilities: ["publish_video", "read_insights"],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    description: "Publish short-form videos and reels to TikTok.",
    color: "#000000",
    phase: 2,
    capabilities: ["publish_video", "publish_reel"],
  },
  google_business: {
    id: "google_business",
    name: "Google Business",
    icon: "🔍",
    description: "Post updates and offers to your Google Business Profile.",
    color: "#4285F4",
    phase: 2,
    capabilities: ["publish_text", "read_insights"],
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    icon: "📌",
    description: "Create pins and manage Pinterest boards.",
    color: "#E60023",
    phase: 3,
    capabilities: ["publish_image", "read_insights"],
  },
  threads: {
    id: "threads",
    name: "Threads",
    icon: "🧵",
    description: "Post text and images to Threads (Meta).",
    color: "#000000",
    phase: 3,
    capabilities: ["publish_text", "publish_image"],
  },
};

/** Returns metadata for all providers sorted by phase then name. */
export function getAllProviderMeta(): SocialProviderMeta[] {
  return Object.values(PROVIDER_META).sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase;
    return a.name.localeCompare(b.name);
  });
}

/** Phase-1 provider IDs for adapter loading. */
export const PHASE_1_PROVIDERS: SocialProviderId[] = ["facebook", "instagram"];
