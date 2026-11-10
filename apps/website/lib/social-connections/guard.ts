/**
 * Access + rate-limit guards for social connections API routes.
 * SERVER ONLY.
 */
import type { OsCapabilityTier } from "@/lib/os-org-role";

type RateLimitBucket = { count: number; resetAt: number };
const buckets = new Map<string, RateLimitBucket>();

function checkRate(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

/** Allow at most `limit` OAuth starts per org per hour. */
export function checkOAuthStartRateLimit(organizationId: string): boolean {
  return checkRate(
    `oauth_start:${organizationId}`,
    10,
    60 * 60 * 1000
  );
}

/** Allow at most 50 publish submissions per org per 24h. */
export function checkPublishRateLimit(organizationId: string): boolean {
  return checkRate(`publish:${organizationId}`, 50, 24 * 60 * 60 * 1000);
}

/** Require at least `staff` tier for connection management. */
export function requireConnectionManagementTier(
  tier: OsCapabilityTier | null
): { ok: true } | { ok: false; reason: string } {
  if (!tier || tier === "client") {
    return {
      ok: false,
      reason: "You need staff or admin access to manage social connections.",
    };
  }
  return { ok: true };
}

/** Require at least `admin` tier for disconnect. */
export function requireDisconnectTier(
  tier: OsCapabilityTier | null
): { ok: true } | { ok: false; reason: string } {
  if (tier !== "admin") {
    return {
      ok: false,
      reason: "Only admins can disconnect social accounts.",
    };
  }
  return { ok: true };
}

/** Require at least `staff` tier for publish approval. */
export function requireApprovalTier(
  tier: OsCapabilityTier | null
): { ok: true } | { ok: false; reason: string } {
  if (!tier || tier === "client") {
    return {
      ok: false,
      reason: "You need staff or admin access to approve social posts.",
    };
  }
  return { ok: true };
}
