/**
 * Exact trusted RINADS portal origins. Parser is exact-match only —
 * no suffix, subdomain, or scheme-relative acceptance.
 */

export const CANONICAL_AUTH_ORIGIN = "https://www.rinads.com";

export const PRODUCTION_PORTAL_ORIGINS = {
  website: "https://www.rinads.com",
  platform: "https://admin.rinads.com",
  owner: "https://app.rinads.com",
  customer: "https://customers.rinads.com",
  glow: "https://glow.rinads.com",
} as const;

export const DEV_PORTAL_ORIGINS = {
  website: "http://localhost:3000",
  platform: "http://localhost:3004",
  owner: "http://localhost:3003",
  customer: "http://localhost:3002",
  glow: "http://localhost:3005",
} as const;

export const TRUSTED_PORTAL_ORIGINS = [
  PRODUCTION_PORTAL_ORIGINS.website,
  PRODUCTION_PORTAL_ORIGINS.platform,
  PRODUCTION_PORTAL_ORIGINS.owner,
  PRODUCTION_PORTAL_ORIGINS.customer,
  PRODUCTION_PORTAL_ORIGINS.glow,
] as const;

export type TrustedPortalOrigin = (typeof TRUSTED_PORTAL_ORIGINS)[number];

export const CANONICAL_AUTH_CALLBACK_URL = `${CANONICAL_AUTH_ORIGIN}/auth/callback`;
export const CANONICAL_FORGOT_PASSWORD_URL = `${CANONICAL_AUTH_ORIGIN}/auth/forgot-password`;
export const CANONICAL_RESET_PASSWORD_URL = `${CANONICAL_AUTH_ORIGIN}/auth/reset-password`;

const TRUSTED_ORIGIN_SET = new Set<string>(TRUSTED_PORTAL_ORIGINS);

export function isTrustedPortalOrigin(origin: string): origin is TrustedPortalOrigin {
  return TRUSTED_ORIGIN_SET.has(origin);
}

/**
 * Parses a candidate URL and returns its origin only when it exactly matches
 * a trusted RINADS portal origin (scheme + host + port).
 */
export function parseTrustedPortalOrigin(value: string | null | undefined): TrustedPortalOrigin | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "https:") return null;
  if (!isTrustedPortalOrigin(url.origin)) return null;
  return url.origin;
}

/**
 * Full allowlisted portal destination: exact trusted origin + path/search.
 * Hash is dropped. Rejects credentials, non-https, and unknown hosts.
 */
export function parseTrustedPortalDestination(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "https:") return null;
  if (!isTrustedPortalOrigin(url.origin)) return null;
  const path = url.pathname || "/";
  return `${url.origin}${path}${url.search}`;
}
