import type {
  ChannelAccount,
  ChannelConnectInput,
  ChannelConnectResult,
  ChannelMetricsResult,
  DiscoveredChannelAccount,
  MetricPoint,
} from "./types";

export type MetaGraphConfig = {
  appId: string;
  appSecret?: string;
  graphVersion: string;
  defaultScopes?: readonly string[];
  graphBaseUrl?: string;
  dialogBaseUrl?: string;
};

export type MetaAccessCredential = {
  accessToken: string;
  scopes: readonly string[];
  expiresAt?: string | null;
};

export type MetaTokenGrant = {
  accessToken: string;
  expiresAt?: string | null;
};

export type MetaTokenInspection = {
  isValid: boolean;
  userId?: string | null;
  scopes: readonly string[];
  expiresAt?: string | null;
};

export type MetaCredentialResolver = {
  resolve(input: {
    organizationId: string;
    connectionId: string;
    credentialRef: string;
  }): Promise<MetaAccessCredential>;
};

export class MetaGraphError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_CONFIGURATION"
      | "PROVIDER_REJECTED"
      | "PROVIDER_UNAVAILABLE"
      | "INVALID_RESPONSE",
    readonly status?: number,
  ) {
    super(message);
    this.name = "MetaGraphError";
  }
}

type JsonRecord = Record<string, unknown>;
type MetaFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;

const DEFAULT_GRAPH_BASE = "https://graph.facebook.com";
const DEFAULT_DIALOG_BASE = "https://www.facebook.com";
const MAX_DISCOVERY_PAGES = 10;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function expiresAtFromSeconds(seconds: unknown): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function unixSecondsToIso(seconds: unknown): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

export class MetaGraphClient {
  readonly graphVersion: string;
  private readonly graphBaseUrl: string;
  private readonly dialogBaseUrl: string;
  private readonly fetcher: MetaFetch;

  constructor(
    private readonly config: MetaGraphConfig,
    fetcher: MetaFetch = fetch,
  ) {
    if (!config.appId) {
      throw new MetaGraphError("Meta app id is required", "INVALID_CONFIGURATION");
    }
    if (!/^v\d+\.\d+$/.test(config.graphVersion)) {
      throw new MetaGraphError(
        "Meta Graph API version must be explicitly pinned, for example vXX.X",
        "INVALID_CONFIGURATION",
      );
    }
    this.graphVersion = config.graphVersion;
    this.graphBaseUrl = (config.graphBaseUrl ?? DEFAULT_GRAPH_BASE).replace(/\/$/, "");
    this.dialogBaseUrl = (config.dialogBaseUrl ?? DEFAULT_DIALOG_BASE).replace(/\/$/, "");
    this.fetcher = fetcher;
  }

  authorization(input: ChannelConnectInput): ChannelConnectResult {
    const scopes = input.requestedScopes ?? this.config.defaultScopes ?? [];
    const url = new URL(`${this.dialogBaseUrl}/${this.graphVersion}/dialog/oauth`);
    url.searchParams.set("client_id", this.config.appId);
    url.searchParams.set("redirect_uri", input.callbackUrl);
    url.searchParams.set("state", input.state);
    url.searchParams.set("response_type", "code");
    if (scopes.length > 0) url.searchParams.set("scope", scopes.join(","));
    return { authorizationUrl: url.toString() };
  }

  async exchangeCode(code: string, callbackUrl: string): Promise<MetaTokenGrant> {
    const appSecret = this.requireAppSecret();
    const payload = await this.request<JsonRecord>("oauth/access_token", {
      query: {
        client_id: this.config.appId,
        client_secret: appSecret,
        redirect_uri: callbackUrl,
        code,
      },
    });
    const accessToken = readString(payload, "access_token");
    if (!accessToken) throw new MetaGraphError("Meta token response was invalid", "INVALID_RESPONSE");
    return { accessToken, expiresAt: expiresAtFromSeconds(payload.expires_in) };
  }

  async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaTokenGrant> {
    const appSecret = this.requireAppSecret();
    const payload = await this.request<JsonRecord>("oauth/access_token", {
      query: {
        grant_type: "fb_exchange_token",
        client_id: this.config.appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      },
    });
    const accessToken = readString(payload, "access_token");
    if (!accessToken) throw new MetaGraphError("Meta long-lived token response was invalid", "INVALID_RESPONSE");
    return { accessToken, expiresAt: expiresAtFromSeconds(payload.expires_in) };
  }

  async inspectToken(accessToken: string): Promise<MetaTokenInspection> {
    const appSecret = this.requireAppSecret();
    const payload = await this.request<JsonRecord>("debug_token", {
      accessToken: `${this.config.appId}|${appSecret}`,
      query: { input_token: accessToken },
    });
    const data = isRecord(payload.data) ? payload.data : {};
    const scopes = Array.isArray(data.scopes)
      ? data.scopes.filter((scope): scope is string => typeof scope === "string")
      : [];
    return {
      isValid: data.is_valid === true,
      userId: readString(data, "user_id") ?? null,
      scopes,
      expiresAt: unixSecondsToIso(data.expires_at),
    };
  }

  async verifyCredential(accessToken: string): Promise<{ userId?: string; name?: string }> {
    const payload = await this.request<JsonRecord>("me", {
      accessToken,
      query: { fields: "id,name" },
    });
    return { userId: readString(payload, "id"), name: readString(payload, "name") };
  }

  async discoverAccounts(accessToken: string): Promise<readonly DiscoveredChannelAccount[]> {
    const accounts: DiscoveredChannelAccount[] = [];
    let after: string | undefined;

    for (let pageNo = 0; pageNo < MAX_DISCOVERY_PAGES; pageNo += 1) {
      const payload = await this.request<JsonRecord>("me/accounts", {
        accessToken,
        query: {
          fields:
            "id,name,category,fan_count,followers_count,instagram_business_account{id,username,name,followers_count,media_count}",
          limit: "100",
          ...(after ? { after } : {}),
        },
      });
      const rows = Array.isArray(payload.data) ? payload.data.filter(isRecord) : [];
      for (const row of rows) {
        const pageId = readString(row, "id");
        const pageName = readString(row, "name");
        if (!pageId || !pageName) continue;

        accounts.push({
          provider: "meta",
          accountType: "facebook_page",
          externalAccountId: pageId,
          displayName: pageName,
          metadata: {
            channel: "facebook",
            category: readString(row, "category") ?? null,
            fanCount: readNumber(row, "fan_count") ?? null,
            followersCount: readNumber(row, "followers_count") ?? null,
          },
        });

        if (isRecord(row.instagram_business_account)) {
          const ig = row.instagram_business_account;
          const igId = readString(ig, "id");
          if (igId) {
            accounts.push({
              provider: "meta",
              accountType: "instagram_business",
              externalAccountId: igId,
              externalParentId: pageId,
              displayName: readString(ig, "name") ?? readString(ig, "username") ?? pageName,
              username: readString(ig, "username") ?? null,
              metadata: {
                channel: "instagram",
                parentPageId: pageId,
                followersCount: readNumber(ig, "followers_count") ?? null,
                mediaCount: readNumber(ig, "media_count") ?? null,
              },
            });
          }
        }
      }

      const paging = isRecord(payload.paging) ? payload.paging : undefined;
      const cursors = paging && isRecord(paging.cursors) ? paging.cursors : undefined;
      after = cursors ? readString(cursors, "after") : undefined;
      if (!after) break;
    }

    return accounts;
  }

  async getAccountMetrics(
    accessToken: string,
    account: ChannelAccount,
  ): Promise<ChannelMetricsResult> {
    const isInstagram = account.accountType === "instagram_business";
    const fields = isInstagram
      ? "id,username,followers_count,media_count"
      : "id,name,fan_count,followers_count";
    const payload = await this.request<JsonRecord>(account.externalAccountId, {
      accessToken,
      query: { fields },
    });
    const observedAt = new Date().toISOString();
    const candidates = isInstagram
      ? (["followers_count", "media_count"] as const)
      : (["fan_count", "followers_count"] as const);
    const metrics: MetricPoint[] = [];
    for (const key of candidates) {
      const value = readNumber(payload, key);
      if (value === undefined) continue;
      metrics.push({
        name: key,
        value,
        observedAt,
        dimensions: {
          provider: "meta",
          accountType: account.accountType,
        },
      });
    }
    return { metrics, raw: payload };
  }

  private requireAppSecret(): string {
    if (!this.config.appSecret) {
      throw new MetaGraphError("Meta app secret is required for server-side token exchange", "INVALID_CONFIGURATION");
    }
    return this.config.appSecret;
  }

  private async request<T>(
    path: string,
    options: {
      accessToken?: string;
      query?: Readonly<Record<string, string>>;
    } = {},
  ): Promise<T> {
    const url = new URL(`${this.graphBaseUrl}/${this.graphVersion}/${path.replace(/^\//, "")}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await this.fetcher(url, {
        method: "GET",
        headers: options.accessToken
          ? { authorization: `Bearer ${options.accessToken}` }
          : undefined,
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new MetaGraphError("Meta Graph API request failed", "PROVIDER_UNAVAILABLE");
    }

    const payload: unknown = await response.json().catch(() => ({}));
    const record = isRecord(payload) ? payload : {};
    if (!response.ok || isRecord(record.error)) {
      const providerError = isRecord(record.error) ? record.error : {};
      const message = readString(providerError, "message") ?? "Meta Graph API rejected the request";
      throw new MetaGraphError(message, "PROVIDER_REJECTED", response.status);
    }
    return record as T;
  }
}
