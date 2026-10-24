import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const RINADS_AGENT_DELEGATION_TOKEN_PREFIX = "rinads_dlg_v1" as const;
export const RINADS_AGENT_DELEGATION_VERSION = 1 as const;
export const RINADS_AGENT_DELEGATION_DEFAULT_TTL_SECONDS = 15 * 60;
export const RINADS_AGENT_DELEGATION_MAX_TTL_SECONDS = 60 * 60;
export const RINADS_AGENT_DELEGATION_CLOCK_SKEW_SECONDS = 60;

export const RINADS_EXTERNAL_AGENT_CLIENTS = [
  "chatgpt",
  "codex",
  "claude",
  "claude_code",
  "gemini",
  "grok",
  "internal",
] as const;

export type RinadsExternalAgentClient =
  (typeof RINADS_EXTERNAL_AGENT_CLIENTS)[number];

export const RINADS_EXTERNAL_AGENT_READ_SCOPES = [
  "intelligence.business_summary.read",
  "commerce.catalog.read",
  "commerce.order.read",
] as const;

export type RinadsExternalAgentReadScope =
  (typeof RINADS_EXTERNAL_AGENT_READ_SCOPES)[number];

export type RinadsAgentDelegationClaims = {
  v: typeof RINADS_AGENT_DELEGATION_VERSION;
  jti: string;
  sub: string;
  org: string;
  client: RinadsExternalAgentClient;
  scopes: RinadsExternalAgentReadScope[];
  iat: number;
  exp: number;
};

export type IssueRinadsAgentDelegationInput = {
  actorId: string;
  organizationId: string;
  client: RinadsExternalAgentClient;
  scopes: readonly RinadsExternalAgentReadScope[];
  secret: string;
  ttlSeconds?: number;
  now?: Date;
  tokenId?: string;
};

export type VerifyRinadsAgentDelegationInput = {
  token: string;
  secret: string;
  now?: Date;
  expectedClient?: RinadsExternalAgentClient;
  isRevoked?: (tokenId: string) => boolean | Promise<boolean>;
};

export type VerifyRinadsAgentDelegationResult =
  | { ok: true; claims: RinadsAgentDelegationClaims }
  | {
      ok: false;
      reason:
        | "invalid_format"
        | "invalid_signature"
        | "invalid_claims"
        | "expired"
        | "issued_in_future"
        | "client_mismatch"
        | "revoked";
    };

function requireSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error("RINADS agent delegation secret must be at least 32 characters.");
  }
}

function base64urlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64urlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isRinadsExternalAgentClient(
  value: unknown
): value is RinadsExternalAgentClient {
  return (
    typeof value === "string" &&
    (RINADS_EXTERNAL_AGENT_CLIENTS as readonly string[]).includes(value)
  );
}

export function isRinadsExternalAgentReadScope(
  value: unknown
): value is RinadsExternalAgentReadScope {
  return (
    typeof value === "string" &&
    (RINADS_EXTERNAL_AGENT_READ_SCOPES as readonly string[]).includes(value)
  );
}

function normalizeScopes(
  scopes: readonly RinadsExternalAgentReadScope[]
): RinadsExternalAgentReadScope[] {
  return Array.from(new Set(scopes)).sort() as RinadsExternalAgentReadScope[];
}

function parseClaims(value: unknown): RinadsAgentDelegationClaims | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const claims = value as Partial<RinadsAgentDelegationClaims>;
  const { jti, sub, org, client, scopes, iat, exp } = claims;

  if (claims.v !== RINADS_AGENT_DELEGATION_VERSION) return null;
  if (!isNonEmptyString(jti)) return null;
  if (!isNonEmptyString(sub)) return null;
  if (!isNonEmptyString(org)) return null;
  if (!isRinadsExternalAgentClient(client)) return null;
  if (
    !Array.isArray(scopes) ||
    scopes.length === 0 ||
    !scopes.every(isRinadsExternalAgentReadScope)
  ) {
    return null;
  }
  if (typeof iat !== "number" || !Number.isInteger(iat)) return null;
  if (typeof exp !== "number" || !Number.isInteger(exp)) return null;
  if (exp <= iat) return null;

  return {
    v: RINADS_AGENT_DELEGATION_VERSION,
    jti,
    sub,
    org,
    client,
    scopes: normalizeScopes(scopes),
    iat,
    exp,
  };
}

/**
 * Issues a short-lived, organization-bound delegation token for an authenticated
 * RINADS actor. This helper does not decide whether the actor may delegate a
 * capability; callers must verify active membership, permission and entitlement
 * before issuing the token.
 *
 * The token is intentionally restricted to the small external-agent READ
 * allowlist. No provider secret, role, permission set or caller-selectable tenant
 * state is embedded in the token.
 */
export function issueRinadsAgentDelegation(
  input: IssueRinadsAgentDelegationInput
): { token: string; claims: RinadsAgentDelegationClaims } {
  requireSecret(input.secret);
  if (!isNonEmptyString(input.actorId)) throw new Error("actorId is required.");
  if (!isNonEmptyString(input.organizationId)) {
    throw new Error("organizationId is required.");
  }
  if (!isRinadsExternalAgentClient(input.client)) {
    throw new Error("Unsupported external agent client.");
  }

  const scopes = normalizeScopes(input.scopes);
  if (scopes.length === 0 || !scopes.every(isRinadsExternalAgentReadScope)) {
    throw new Error("At least one allowed external-agent READ scope is required.");
  }

  const ttlSeconds =
    input.ttlSeconds ?? RINADS_AGENT_DELEGATION_DEFAULT_TTL_SECONDS;
  if (
    !Number.isInteger(ttlSeconds) ||
    ttlSeconds < 60 ||
    ttlSeconds > RINADS_AGENT_DELEGATION_MAX_TTL_SECONDS
  ) {
    throw new Error(
      `Delegation TTL must be an integer between 60 and ${RINADS_AGENT_DELEGATION_MAX_TTL_SECONDS} seconds.`
    );
  }

  const issuedAt = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const claims: RinadsAgentDelegationClaims = {
    v: RINADS_AGENT_DELEGATION_VERSION,
    jti: input.tokenId ?? randomUUID(),
    sub: input.actorId,
    org: input.organizationId,
    client: input.client,
    scopes,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };

  const encodedClaims = base64urlEncode(JSON.stringify(claims));
  const signedPayload = `${RINADS_AGENT_DELEGATION_TOKEN_PREFIX}.${encodedClaims}`;
  const signature = sign(signedPayload, input.secret);
  return {
    token: `${signedPayload}.${signature}`,
    claims,
  };
}

/**
 * Verifies token integrity and temporal/client constraints. Membership,
 * entitlement and current permission checks must still be performed against
 * authoritative RINADS state after this succeeds; claims never replace RLS.
 */
export async function verifyRinadsAgentDelegation(
  input: VerifyRinadsAgentDelegationInput
): Promise<VerifyRinadsAgentDelegationResult> {
  requireSecret(input.secret);
  const parts = input.token.split(".");
  if (parts.length !== 3 || parts[0] !== RINADS_AGENT_DELEGATION_TOKEN_PREFIX) {
    return { ok: false, reason: "invalid_format" };
  }

  const signedPayload = `${parts[0]}.${parts[1]}`;
  const expectedSignature = sign(signedPayload, input.secret);
  if (!secureEqual(expectedSignature, parts[2])) {
    return { ok: false, reason: "invalid_signature" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64urlDecode(parts[1]));
  } catch {
    return { ok: false, reason: "invalid_claims" };
  }

  const claims = parseClaims(parsed);
  if (!claims) return { ok: false, reason: "invalid_claims" };

  const now = Math.floor((input.now ?? new Date()).getTime() / 1000);
  if (claims.exp <= now) return { ok: false, reason: "expired" };
  if (claims.iat > now + RINADS_AGENT_DELEGATION_CLOCK_SKEW_SECONDS) {
    return { ok: false, reason: "issued_in_future" };
  }
  if (input.expectedClient && claims.client !== input.expectedClient) {
    return { ok: false, reason: "client_mismatch" };
  }
  if (input.isRevoked && (await input.isRevoked(claims.jti))) {
    return { ok: false, reason: "revoked" };
  }

  return { ok: true, claims };
}

export function delegationAllowsScope(
  claims: RinadsAgentDelegationClaims,
  scope: RinadsExternalAgentReadScope
): boolean {
  return claims.scopes.includes(scope);
}
