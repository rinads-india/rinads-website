/**
 * Social OS — shared types.
 * No runtime imports here — safe to import from both server and client boundaries.
 */

export type SocialProviderId =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "x"
  | "youtube"
  | "tiktok"
  | "google_business"
  | "pinterest"
  | "threads";

export type ConnectionHealthState =
  | "healthy"
  | "degraded"
  | "token_expired"
  | "revoked"
  | "error";

export type PublishJobStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "cancelled"
  | "enqueued"
  | "publishing"
  | "published"
  | "failed";

export type ProviderCapability =
  | "publish_text"
  | "publish_image"
  | "publish_carousel"
  | "publish_video"
  | "publish_reel"
  | "publish_story"
  | "read_insights"
  | "read_comments"
  | "reply_comments"
  | "read_messages"
  | "send_messages";

export type OAuthTokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  refreshExpiresAt?: Date;
  grantedScopes: string[];
  tokenType: string;
};

export type OAuthStartParams = {
  organizationId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  codeChallenge?: string;
};

export type ConnectedAccount = {
  externalId: string;
  accountType: string;
  displayName: string;
  avatarUrl?: string;
  username?: string;
  followerCount?: number;
};

/** Safe client-facing connection shape (no tokens). */
export type SocialConnectionView = {
  id: string;
  organizationId: string;
  providerId: SocialProviderId;
  credentialId: string;
  providerName: string;
  providerIcon: string;
  accountType: string;
  externalId: string;
  displayName: string;
  profileImageUrl: string | null;
  username: string | null;
  followerCount: number | null;
  healthState: ConnectionHealthState;
  lastCheckedAt: string | null;
  connectedAt: string;
  connectedBy: string;
};

export type SocialProviderMeta = {
  id: SocialProviderId;
  name: string;
  icon: string;
  description: string;
  color: string;
  phase: 1 | 2 | 3;
  capabilities: ProviderCapability[];
  oauthNote?: string;
};

export type StartConnectionResult =
  | { ok: true; authorizationUrl: string }
  | { ok: false; error: string };

export type DisconnectResult =
  | { ok: true }
  | { ok: false; error: string };

export type PublishSubmitResult =
  | { ok: true; jobId: string; status: PublishJobStatus }
  | { ok: false; error: string };
