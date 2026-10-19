export const MARKETING_PROVIDERS = [
  "meta",
  "google",
  "linkedin",
  "tiktok",
  "youtube",
  "whatsapp",
] as const;

export type MarketingProvider = (typeof MARKETING_PROVIDERS)[number];

export const PUBLICATION_STATUSES = [
  "DRAFT",
  "GENERATING",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PROCESSING",
  "PUBLISHED",
  "PARTIAL_FAILURE",
  "FAILED",
  "ARCHIVED",
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const MARKETING_APPROVAL_LEVELS = [0, 1, 2, 3, 4] as const;
export type MarketingApprovalLevel = (typeof MARKETING_APPROVAL_LEVELS)[number];

export type ChannelConnection = {
  id: string;
  organizationId: string;
  provider: MarketingProvider;
  status: "pending" | "active" | "degraded" | "revoked";
  credentialRef: string | null;
  scopes: readonly string[];
  externalSubject?: string | null;
  tokenExpiresAt?: string | null;
  lastVerifiedAt?: string | null;
  metadata?: Readonly<Record<string, unknown>>;
};

export type ChannelAccount = {
  id: string;
  organizationId: string;
  connectionId: string;
  provider: MarketingProvider;
  accountType: string;
  externalAccountId: string;
  displayName: string;
  username?: string | null;
  status: "active" | "disabled" | "disconnected";
  metadata?: Readonly<Record<string, unknown>>;
};

export type ChannelConnectInput = {
  organizationId: string;
  callbackUrl: string;
  requestedScopes?: readonly string[];
  state: string;
};

export type ChannelConnectResult = {
  authorizationUrl: string;
  expiresAt?: string | null;
};

export type ChannelCredentialRefreshInput = {
  connection: ChannelConnection;
};

export type ChannelCredentialRefreshResult = {
  status: "active" | "degraded" | "revoked";
  credentialRef: string;
  expiresAt?: string | null;
};

export type ChannelAccountDiscoveryInput = {
  organizationId: string;
  connection: ChannelConnection;
};

export type DiscoveredChannelAccount = {
  provider: MarketingProvider;
  accountType: string;
  externalAccountId: string;
  externalParentId?: string | null;
  displayName: string;
  username?: string | null;
  metadata?: Readonly<Record<string, unknown>>;
};

export type ChannelAccountDiscoveryResult = {
  accounts: readonly DiscoveredChannelAccount[];
  observedAt: string;
};

export type PublishRequest = {
  organizationId: string;
  account: ChannelAccount;
  publicationId: string;
  idempotencyKey: string;
  text?: string;
  mediaUrls?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
};

export type ScheduleRequest = PublishRequest & {
  scheduledAt: string;
};

export type PublishResult = {
  externalPostId: string;
  externalUrl?: string | null;
  publishedAt: string;
  raw?: Readonly<Record<string, unknown>>;
};

export type ScheduledResult = {
  externalScheduleId?: string | null;
  scheduledAt: string;
  raw?: Readonly<Record<string, unknown>>;
};

export type ChannelPostLookup = {
  organizationId: string;
  account: ChannelAccount;
  externalPostId: string;
};

export type ChannelPost = {
  externalPostId: string;
  externalUrl?: string | null;
  text?: string | null;
  publishedAt?: string | null;
  raw?: Readonly<Record<string, unknown>>;
};

export type DeletePostResult = {
  deleted: boolean;
};

export type MetricPoint = {
  name: string;
  value: number;
  observedAt: string;
  dimensions?: Readonly<Record<string, string | number | boolean | null>>;
};

export type ChannelMetricsResult = {
  metrics: readonly MetricPoint[];
  raw?: Readonly<Record<string, unknown>>;
};

export type ChannelAccountMetricsInput = {
  organizationId: string;
  connection: ChannelConnection;
  account: ChannelAccount;
};

export type ChannelComment = {
  id: string;
  text: string;
  authorLabel?: string | null;
  createdAt?: string | null;
  raw?: Readonly<Record<string, unknown>>;
};

export type ReplyRequest = {
  organizationId: string;
  account: ChannelAccount;
  commentId: string;
  text: string;
  idempotencyKey: string;
};

export type ReplyResult = {
  externalReplyId: string;
  createdAt: string;
  raw?: Readonly<Record<string, unknown>>;
};

export type ChannelHealthInput = {
  connection: ChannelConnection;
};

export type ChannelHealthResult = {
  provider: MarketingProvider;
  status: "healthy" | "degraded" | "unconfigured" | "revoked";
  message: string;
  checkedAt: string;
};

export type ChannelCapability =
  | "connect"
  | "refresh_credentials"
  | "discover_accounts"
  | "publish"
  | "schedule"
  | "delete_post"
  | "read_post"
  | "read_metrics"
  | "read_account_metrics"
  | "read_comments"
  | "reply"
  | "health_check";
