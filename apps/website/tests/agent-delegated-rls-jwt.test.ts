import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import { describe, it } from "node:test";
import {
  mintRinadsDelegatedRlsJwt,
  RINADS_DELEGATED_RLS_JWT_DEFAULT_TTL_SECONDS,
} from "../lib/agent-gateway/delegated-rls-jwt";

function decodeJson(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as Record<
    string,
    unknown
  >;
}

function keyFixture() {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const jwk = privateKey.export({ format: "jwk" });
  return {
    privateJwk: JSON.stringify(jwk),
    publicKey,
    keyId: "rinads-test-es256-1",
  };
}

function mint(overrides: Partial<Parameters<typeof mintRinadsDelegatedRlsJwt>[0]> = {}) {
  const key = keyFixture();
  const now = new Date("2026-10-24T00:00:00.000Z");
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const issued = mintRinadsDelegatedRlsJwt({
    actorId: "11111111-1111-4111-8111-111111111111",
    delegationTokenId: "delegation-token-1",
    delegationClient: "chatgpt",
    delegatedScopes: ["commerce.catalog.read", "commerce.order.read"],
    delegationExpiresAt: nowSeconds + 900,
    supabaseUrl: "https://project-ref.supabase.co",
    privateJwk: key.privateJwk,
    keyId: key.keyId,
    now,
    jwtId: "22222222-2222-4222-8222-222222222222",
    ...overrides,
  });
  return { ...issued, ...key, nowSeconds };
}

describe("delegated RLS JWT bridge", () => {
  it("mints a standards-shaped ES256 user JWT that verifies with the matching public key", () => {
    const { token, publicKey, keyId } = mint();
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    assert.ok(encodedHeader);
    assert.ok(encodedPayload);
    assert.ok(encodedSignature);

    const header = decodeJson(encodedHeader);
    const payload = decodeJson(encodedPayload);

    assert.deepEqual(header, { alg: "ES256", kid: keyId, typ: "JWT" });
    assert.equal(payload.role, "authenticated");
    assert.equal(payload.aud, "authenticated");
    assert.equal(payload.sub, "11111111-1111-4111-8111-111111111111");
    assert.equal(payload.iss, "https://project-ref.supabase.co/auth/v1");
    assert.equal(payload.rinads_delegation_id, "delegation-token-1");
    assert.equal(payload.rinads_client, "chatgpt");

    const signatureValid = verify(
      "sha256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`, "utf8"),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(encodedSignature, "base64url")
    );
    assert.equal(signatureValid, true);
  });

  it("keeps the internal JWT short lived and never outlives the outer delegation", () => {
    const first = mint();
    assert.equal(
      first.claims.exp,
      first.nowSeconds + RINADS_DELEGATED_RLS_JWT_DEFAULT_TTL_SECONDS
    );

    const capped = mint({ delegationExpiresAt: first.nowSeconds + 30 });
    assert.equal(capped.claims.exp, first.nowSeconds + 30);
  });

  it("does not encode organization authority or service-role authority into the JWT", () => {
    const { claims } = mint();
    const record = claims as unknown as Record<string, unknown>;

    assert.equal(record.organization_id, undefined);
    assert.equal(record.organizationId, undefined);
    assert.equal(record.org, undefined);
    assert.notEqual(claims.role, "service_role");
  });

  it("rejects a key-id mismatch instead of signing with ambiguous provenance", () => {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const jwk = privateKey.export({ format: "jwk" }) as Record<string, unknown>;
    jwk.kid = "different-kid";

    assert.throws(
      () =>
        mintRinadsDelegatedRlsJwt({
          actorId: "11111111-1111-4111-8111-111111111111",
          delegationTokenId: "delegation-token-1",
          delegationClient: "claude",
          delegatedScopes: ["commerce.catalog.read"],
          delegationExpiresAt: 1792800900,
          supabaseUrl: "https://project-ref.supabase.co",
          privateJwk: JSON.stringify(jwk),
          keyId: "expected-kid",
          now: new Date("2026-10-24T00:00:00.000Z"),
        }),
      /key ID does not match/
    );
  });

  it("fails closed when the outer delegation is too close to expiry", () => {
    const key = keyFixture();
    const now = new Date("2026-10-24T00:00:00.000Z");
    const nowSeconds = Math.floor(now.getTime() / 1000);

    assert.throws(
      () =>
        mintRinadsDelegatedRlsJwt({
          actorId: "11111111-1111-4111-8111-111111111111",
          delegationTokenId: "delegation-token-1",
          delegationClient: "gemini",
          delegatedScopes: ["commerce.order.read"],
          delegationExpiresAt: nowSeconds + 5,
          supabaseUrl: "https://project-ref.supabase.co",
          privateJwk: key.privateJwk,
          keyId: key.keyId,
          now,
        }),
      /expires too soon/
    );
  });
});
