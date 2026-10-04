import { resolvePreviewSecret, verifyPreviewToken } from "@rinads/cms/preview-tokens";

/**
 * Server-only helpers for CMS draft preview on the marketing site.
 *
 * A valid, path-scoped `?preview=<token>` lets an editor view an unpublished
 * draft. Behavior is fail-closed: with no secret configured or no/invalid
 * token, `previewing` is false and only published content is ever served.
 * Preview responses must be marked `robots: { index: false }` by the caller.
 */

export type PreviewReason =
  | "no_token"
  | "no_secret"
  | "valid"
  | "malformed"
  | "bad_signature"
  | "expired"
  | "path_mismatch";

export type PreviewDecision = {
  previewing: boolean;
  reason: PreviewReason;
};

export type EvaluatePreviewOptions = {
  token?: string | null;
  path: string;
  secret: string | null;
  now?: () => number;
};

/**
 * Pure preview decision. No I/O: callers pass the resolved secret so this can
 * be unit-tested deterministically.
 */
export function evaluatePreview(options: EvaluatePreviewOptions): PreviewDecision {
  const { token, path, secret, now } = options;
  if (!token) return { previewing: false, reason: "no_token" };
  if (!secret) return { previewing: false, reason: "no_secret" };

  const result = verifyPreviewToken({ token, secret, path, now });
  if (result.valid) return { previewing: true, reason: "valid" };
  return { previewing: false, reason: result.reason };
}

export type ResolvePreviewOptions = {
  token?: string | null;
  path: string;
  env?: Record<string, string | undefined>;
  now?: () => number;
};

/** Resolve the preview secret from the environment, then evaluate the token. */
export function resolvePreview(options: ResolvePreviewOptions): PreviewDecision {
  const secret = resolvePreviewSecret(options.env);
  return evaluatePreview({ token: options.token, path: options.path, secret, now: options.now });
}
