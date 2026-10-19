import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type MetaOAuthStatePayload = {
  version: 1;
  organizationId: string;
  userId: string;
  nonce: string;
  expiresAt: number;
  returnTo: string;
};

function requireSigningSecret(secret: string): string {
  if (secret.trim().length < 32) {
    throw new Error("Meta OAuth state signing secret must be at least 32 characters");
  }
  return secret;
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", requireSigningSecret(secret))
    .update(encodedPayload)
    .digest("base64url");
}

export function sanitizeMarketingReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/os";
  if (!value.startsWith("/os")) return "/os";
  return value;
}

export function createMetaOAuthState(
  input: {
    organizationId: string;
    userId: string;
    returnTo?: string | null;
    ttlSeconds?: number;
  },
  secret: string,
): string {
  const ttlSeconds = Math.min(Math.max(input.ttlSeconds ?? 600, 60), 900);
  const payload: MetaOAuthStatePayload = {
    version: 1,
    organizationId: input.organizationId,
    userId: input.userId,
    nonce: randomBytes(18).toString("base64url"),
    expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
    returnTo: sanitizeMarketingReturnTo(input.returnTo),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyMetaOAuthState(
  state: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): MetaOAuthStatePayload {
  const [encodedPayload, encodedSignature, extra] = state.split(".");
  if (!encodedPayload || !encodedSignature || extra) throw new Error("Invalid Meta OAuth state");

  const expected = Buffer.from(sign(encodedPayload, secret), "base64url");
  const supplied = Buffer.from(encodedSignature, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new Error("Invalid Meta OAuth state signature");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid Meta OAuth state payload");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid Meta OAuth state payload");
  }
  const record = parsed as Record<string, unknown>;
  if (
    record.version !== 1 ||
    typeof record.organizationId !== "string" ||
    typeof record.userId !== "string" ||
    typeof record.nonce !== "string" ||
    typeof record.expiresAt !== "number" ||
    typeof record.returnTo !== "string"
  ) {
    throw new Error("Invalid Meta OAuth state payload");
  }
  if (record.expiresAt < nowSeconds) throw new Error("Meta OAuth state expired");

  return {
    version: 1,
    organizationId: record.organizationId,
    userId: record.userId,
    nonce: record.nonce,
    expiresAt: record.expiresAt,
    returnTo: sanitizeMarketingReturnTo(record.returnTo),
  };
}
