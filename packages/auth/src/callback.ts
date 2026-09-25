import { parseTrustedPortalDestination } from "./origins";
import { sanitizeRelativeNext } from "./next-path";

export const DEFAULT_AUTH_CALLBACK_PATH = "/";

/**
 * Auth callback `next` resolver: local relative path or exact allowlisted
 * portal destination. Anything else falls back to `/`.
 */
export function resolveAuthCallbackDestination(
  next: string | null | undefined
): string {
  const relative = sanitizeRelativeNext(next);
  if (relative) return relative;
  const trusted = parseTrustedPortalDestination(next);
  if (trusted) return trusted;
  return DEFAULT_AUTH_CALLBACK_PATH;
}

export type AuthCallbackParams = {
  code?: string | null;
  tokenHash?: string | null;
  type?: string | null;
  next?: string | null;
};

export const RECOVERY_OTP_TYPES = ["invite", "recovery", "email", "magiclink", "signup"] as const;
export type RecoveryOtpType = (typeof RECOVERY_OTP_TYPES)[number];

export function parseRecoveryOtpType(type: string | null | undefined): RecoveryOtpType | null {
  if (!type) return null;
  return (RECOVERY_OTP_TYPES as readonly string[]).includes(type)
    ? (type as RecoveryOtpType)
    : null;
}

export function hasAuthCallbackGrant(params: AuthCallbackParams): boolean {
  if (params.code && params.code.length > 0) return true;
  const otpType = parseRecoveryOtpType(params.type ?? null);
  return Boolean(params.tokenHash && otpType);
}
