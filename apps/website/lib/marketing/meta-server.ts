import { MetaGraphClient } from "@rinads/platform";
import type { TenancyContext } from "@rinads/tenancy";

export const DEFAULT_META_READ_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
] as const;

const FORBIDDEN_PHASE_01_SCOPES = [
  /^ads_/i,
  /^pages_manage_/i,
  /^instagram_content_publish$/i,
  /^business_management$/i,
  /^leads_retrieval$/i,
];

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function metaReadScopes(): readonly string[] {
  const configured = process.env.RINADS_META_READ_SCOPES?.split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
  const scopes = configured?.length ? configured : [...DEFAULT_META_READ_SCOPES];
  for (const scope of scopes) {
    if (FORBIDDEN_PHASE_01_SCOPES.some((pattern) => pattern.test(scope))) {
      throw new Error(`Meta scope ${scope} is outside the Marketing OS Phase 0.1 read-only boundary`);
    }
  }
  return [...new Set(scopes)];
}

export function metaOAuthStateSecret(): string {
  return requiredEnv("RINADS_META_OAUTH_STATE_SECRET");
}

export function metaCallbackUrl(requestUrl: string): string {
  const configured = process.env.RINADS_META_REDIRECT_URI?.trim();
  if (configured) return configured;
  return new URL("/api/marketing/meta/callback", requestUrl).toString();
}

export function createMetaGraphClient(options: { requireAppSecret?: boolean } = {}): MetaGraphClient {
  const appSecret = options.requireAppSecret ? requiredEnv("RINADS_META_APP_SECRET") : process.env.RINADS_META_APP_SECRET;
  return new MetaGraphClient({
    appId: requiredEnv("RINADS_META_APP_ID"),
    appSecret,
    graphVersion: requiredEnv("RINADS_META_GRAPH_VERSION"),
    defaultScopes: metaReadScopes(),
  });
}

export function hasMarketingPermission(
  tenancy: TenancyContext,
  permission: "marketing.read" | "marketing.channels.manage",
): boolean {
  return tenancy.permissions.includes(permission) || tenancy.permissions.includes("org.manage");
}
