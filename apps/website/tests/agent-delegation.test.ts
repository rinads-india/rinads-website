import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  delegationAllowsScope,
  issueRinadsAgentDelegation,
  verifyRinadsAgentDelegation,
} from "../lib/agent-gateway/delegation";

const SECRET = "rinads-test-secret-that-is-longer-than-thirty-two-characters";
const NOW = new Date("2026-10-24T00:00:00.000Z");

function issue() {
  return issueRinadsAgentDelegation({
    actorId: "user_123",
    organizationId: "org_456",
    client: "chatgpt",
    scopes: ["commerce.catalog.read", "intelligence.business_summary.read"],
    secret: SECRET,
    ttlSeconds: 900,
    now: NOW,
    tokenId: "token_789",
  });
}

describe("RINADS external-agent delegation", () => {
  it("issues a short-lived token bound to actor, organization, client and scopes", async () => {
    const issued = issue();
    assert.match(issued.token, /^rinads_dlg_v1\./);
    assert.equal(issued.claims.sub, "user_123");
    assert.equal(issued.claims.org, "org_456");
    assert.equal(issued.claims.client, "chatgpt");
    assert.equal(issued.claims.exp - issued.claims.iat, 900);
    assert.equal(delegationAllowsScope(issued.claims, "commerce.catalog.read"), true);
    assert.equal(delegationAllowsScope(issued.claims, "commerce.order.read"), false);

    const verified = await verifyRinadsAgentDelegation({
      token: issued.token,
      secret: SECRET,
      now: new Date("2026-10-24T00:05:00.000Z"),
      expectedClient: "chatgpt",
    });
    assert.equal(verified.ok, true);
    if (verified.ok) {
      assert.equal(verified.claims.org, "org_456");
      assert.deepEqual(verified.claims.scopes, [
        "commerce.catalog.read",
        "intelligence.business_summary.read",
      ]);
    }
  });

  it("rejects tampering", async () => {
    const issued = issue();
    const parts = issued.token.split(".");
    parts[1] = `${parts[1]}x`;
    const verified = await verifyRinadsAgentDelegation({
      token: parts.join("."),
      secret: SECRET,
      now: NOW,
    });
    assert.deepEqual(verified, { ok: false, reason: "invalid_signature" });
  });

  it("rejects expired tokens", async () => {
    const issued = issue();
    const verified = await verifyRinadsAgentDelegation({
      token: issued.token,
      secret: SECRET,
      now: new Date("2026-10-24T00:15:00.000Z"),
    });
    assert.deepEqual(verified, { ok: false, reason: "expired" });
  });

  it("rejects client confusion", async () => {
    const issued = issue();
    const verified = await verifyRinadsAgentDelegation({
      token: issued.token,
      secret: SECRET,
      now: NOW,
      expectedClient: "claude",
    });
    assert.deepEqual(verified, { ok: false, reason: "client_mismatch" });
  });

  it("supports revocation by token id", async () => {
    const issued = issue();
    const verified = await verifyRinadsAgentDelegation({
      token: issued.token,
      secret: SECRET,
      now: NOW,
      isRevoked: async (tokenId) => tokenId === "token_789",
    });
    assert.deepEqual(verified, { ok: false, reason: "revoked" });
  });

  it("refuses weak secrets and excessive TTLs", () => {
    assert.throws(
      () =>
        issueRinadsAgentDelegation({
          actorId: "user_123",
          organizationId: "org_456",
          client: "chatgpt",
          scopes: ["commerce.catalog.read"],
          secret: "weak",
          now: NOW,
        }),
      /at least 32 characters/
    );

    assert.throws(
      () =>
        issueRinadsAgentDelegation({
          actorId: "user_123",
          organizationId: "org_456",
          client: "chatgpt",
          scopes: ["commerce.catalog.read"],
          secret: SECRET,
          ttlSeconds: 3601,
          now: NOW,
        }),
      /between 60 and 3600 seconds/
    );
  });
});
