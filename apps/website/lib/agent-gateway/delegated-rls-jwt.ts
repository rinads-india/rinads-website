import { createPrivateKey, randomUUID, sign } from "node:crypto";
import type {
  RinadsExternalAgentClient,
  RinadsExternalAgentReadScope,
} from "./delegation";

export const RINADS_DELEGATED_RLS_JWT_DEFAULT_TTL_SECONDS = 60;
export const RINADS_DELEGATED_RLS_JWT_MAX_TTL_SECONDS = 120;
export const RINADS_DELEGATED_RLS_JWT_ROLE = "authenticated" as const;
export const RINADS_DELEGATED_RLS_JWT_AUDIENCE = "authenticated" as const;

type EcPrivateJwk = {
  kty: "EC";
  crv: "P-256";
  x: string;
  y: string;
  d: string;
  kid?: string;
  alg?: string;
  use?: string;
  key_ops?: string[];
};

export type RinadsDelegatedRlsJwtClaims = {
  iss: string;
  aud: typeof RINADS_DELEGATED_RLS_JWT_AUDIENCE;
  sub: string;
  role: typeof RINADS_DELEGATED_RLS_JWT_ROLE;
  iat: number;
  exp: number;
  jti: string;
  rinads_delegation_id: string;
  rinads_client: RinadsExternalAgentClient;
  rinads_scopes: RinadsExternalAgentReadScope[];
};

export type MintRinadsDelegatedRlsJwtInput = {
  actorId: string;
  delegationTokenId: string;
  delegationClient: RinadsExternalAgentClient;
  delegatedScopes: readonly RinadsExternalAgentReadScope[];
  delegationExpiresAt: number;
  supabaseUrl: string;
  privateJwk: string;
  keyId: string;
  ttlSeconds?: number;
  now?: Date;
  jwtId?: string;
};

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function parsePrivateJwk(raw: string, keyId: string): EcPrivateJwk {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("RINADS delegated RLS JWT private JWK must be valid JSON.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("RINADS delegated RLS JWT private JWK must be an object.");
  }

  const jwk = value as Partial<EcPrivateJwk>;
  if (
    jwk.kty !== "EC" ||
    jwk.crv !== "P-256" ||
    !nonEmpty(jwk.x) ||
    !nonEmpty(jwk.y) ||
    !nonEmpty(jwk.d)
  ) {
    throw new Error("RINADS delegated RLS JWT key must be an EC P-256 private JWK.");
  }
  if (jwk.alg && jwk.alg !== "ES256") {
    throw new Error("RINADS delegated RLS JWT key must use ES256 when alg is present.");
  }
  if (jwk.use && jwk.use !== "sig") {
    throw new Error("RINADS delegated RLS JWT key must be a signing key when use is present.");
  }
  if (jwk.key_ops && !jwk.key_ops.includes("sign")) {
    throw new Error("RINADS delegated RLS JWT key_ops must allow signing.");
  }
  if (jwk.kid && jwk.kid !== keyId) {
    throw new Error("RINADS delegated RLS JWT key ID does not match the private JWK kid.");
  }

  return {
    kty: "EC",
    crv: "P-256",
    x: jwk.x,
    y: jwk.y,
    d: jwk.d,
    ...(jwk.kid ? { kid: jwk.kid } : {}),
    ...(jwk.alg ? { alg: jwk.alg } : {}),
    ...(jwk.use ? { use: jwk.use } : {}),
    ...(jwk.key_ops ? { key_ops: jwk.key_ops } : {}),
  };
}

/**
 * Mint an internal, very short-lived Supabase-compatible user JWT after the
 * outer rinads_dlg_v1 credential has already passed delegation validation.
 *
 * This token is never returned to an external agent. It exists only to let the
 * Data API evaluate the same auth.uid()/authenticated-role RLS policies as the
 * delegated RI ID user. Organization selection is intentionally NOT encoded as
 * an RLS authority claim; capability queries remain explicitly tenant-scoped.
 */
export function mintRinadsDelegatedRlsJwt(
  input: MintRinadsDelegatedRlsJwtInput
): { token: string; claims: RinadsDelegatedRlsJwtClaims } {
  if (!nonEmpty(input.actorId)) throw new Error("actorId is required.");
  if (!nonEmpty(input.delegationTokenId)) {
    throw new Error("delegationTokenId is required.");
  }
  if (!nonEmpty(input.keyId) || input.keyId.length > 128) {
    throw new Error("A valid delegated RLS JWT keyId is required.");
  }
  if (!nonEmpty(input.supabaseUrl)) throw new Error("supabaseUrl is required.");
  if (!Number.isInteger(input.delegationExpiresAt)) {
    throw new Error("delegationExpiresAt must be an integer timestamp.");
  }

  const ttlSeconds = input.ttlSeconds ?? RINADS_DELEGATED_RLS_JWT_DEFAULT_TTL_SECONDS;
  if (
    !Number.isInteger(ttlSeconds) ||
    ttlSeconds < 15 ||
    ttlSeconds > RINADS_DELEGATED_RLS_JWT_MAX_TTL_SECONDS
  ) {
    throw new Error(
      `Delegated RLS JWT TTL must be between 15 and ${RINADS_DELEGATED_RLS_JWT_MAX_TTL_SECONDS} seconds.`
    );
  }

  const now = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const exp = Math.min(now + ttlSeconds, input.delegationExpiresAt);
  if (exp <= now + 5) {
    throw new Error("Delegation expires too soon to mint an RLS JWT safely.");
  }

  const privateJwk = parsePrivateJwk(input.privateJwk, input.keyId);
  const privateKey = createPrivateKey({ key: privateJwk, format: "jwk" });
  if (privateKey.asymmetricKeyType !== "ec") {
    throw new Error("Delegated RLS JWT key is not an EC private key.");
  }

  const issuer = `${input.supabaseUrl.replace(/\/+$/, "")}/auth/v1`;
  const claims: RinadsDelegatedRlsJwtClaims = {
    iss: issuer,
    aud: RINADS_DELEGATED_RLS_JWT_AUDIENCE,
    sub: input.actorId,
    role: RINADS_DELEGATED_RLS_JWT_ROLE,
    iat: now,
    exp,
    jti: input.jwtId ?? randomUUID(),
    rinads_delegation_id: input.delegationTokenId,
    rinads_client: input.delegationClient,
    rinads_scopes: Array.from(new Set(input.delegatedScopes)).sort() as RinadsExternalAgentReadScope[],
  };

  const header = {
    alg: "ES256",
    kid: input.keyId,
    typ: "JWT",
  } as const;
  const signingInput = `${base64urlJson(header)}.${base64urlJson(claims)}`;
  const signature = sign("sha256", Buffer.from(signingInput, "utf8"), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");

  return {
    token: `${signingInput}.${signature}`,
    claims,
  };
}
