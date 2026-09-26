import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed CMS draft-preview tokens (CMS Phase C, slice C1).
 *
 * A preview token lets an editor view an unpublished/draft CMS page via a
 * `?preview=<token>` query parameter without publishing it. Tokens are:
 * - HMAC-SHA256 signed with a server-only secret (never shipped to the client);
 * - scoped to a single path (a token for `/blog/x` cannot preview `/blog/y`);
 * - time-limited (default 30 minutes) so leaked links expire quickly.
 *
 * This module is pure and framework-agnostic. Route handlers should verify the
 * token and then set `robots: { index: false }` on any draft they render.
 */

const DEFAULT_TTL_SECONDS = 30 * 60;

export type PreviewTokenPayload = {
  /** Canonical path the token authorizes, e.g. "/blog/my-post". */
  path: string;
  /** Expiry as a UNIX epoch in seconds. */
  exp: number;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export type CreatePreviewTokenOptions = {
  path: string;
  secret: string;
  ttlSeconds?: number;
  /** Injectable clock for tests; defaults to Date.now(). */
  now?: () => number;
};

/** Create a signed, path-scoped, expiring preview token. */
export function createPreviewToken(options: CreatePreviewTokenOptions): string {
  if (!options.secret) throw new Error("A preview secret is required to sign tokens.");
  if (!options.path.startsWith("/")) throw new Error("Preview token path must be absolute (start with '/').");

  const nowMs = (options.now ?? Date.now)();
  const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const payload: PreviewTokenPayload = {
    path: options.path,
    exp: Math.floor(nowMs / 1000) + ttl,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encoded, options.secret);
  return `${encoded}.${signature}`;
}

export type VerifyPreviewTokenOptions = {
  token: string;
  secret: string;
  /** Path being previewed; the token must be scoped to it. */
  path: string;
  now?: () => number;
};

export type VerifyPreviewTokenResult =
  | { valid: true; payload: PreviewTokenPayload }
  | { valid: false; reason: "malformed" | "bad_signature" | "expired" | "path_mismatch" };

/** Verify a preview token for a given path. Never throws on bad input. */
export function verifyPreviewToken(options: VerifyPreviewTokenOptions): VerifyPreviewTokenResult {
  const { token, secret, path } = options;
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "malformed" };
  }

  const [encoded, signature] = token.split(".", 2);
  if (!encoded || !signature) return { valid: false, reason: "malformed" };

  const expected = sign(encoded, secret);
  const provided = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
    return { valid: false, reason: "bad_signature" };
  }

  let payload: PreviewTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded)) as PreviewTokenPayload;
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (typeof payload?.path !== "string" || typeof payload?.exp !== "number") {
    return { valid: false, reason: "malformed" };
  }

  const nowSeconds = Math.floor((options.now ?? Date.now)() / 1000);
  if (payload.exp <= nowSeconds) return { valid: false, reason: "expired" };
  if (payload.path !== path) return { valid: false, reason: "path_mismatch" };

  return { valid: true, payload };
}

/**
 * Resolve the preview secret from the environment. Returns null when unset so
 * callers can fail closed (treat preview as disabled) rather than signing with
 * an empty secret.
 */
export function resolvePreviewSecret(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const secret = env.CMS_PREVIEW_SECRET ?? env.CMS_REVALIDATE_SECRET;
  return secret && secret.trim().length > 0 ? secret : null;
}
