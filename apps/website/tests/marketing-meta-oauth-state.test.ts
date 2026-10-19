import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createMetaOAuthState,
  sanitizeMarketingReturnTo,
  verifyMetaOAuthState,
} from "../lib/marketing/meta-oauth-state";

const SECRET = "0123456789abcdef0123456789abcdef";

describe("Meta OAuth state", () => {
  it("binds state to tenant and user and verifies its signature", () => {
    const state = createMetaOAuthState(
      { organizationId: "org-1", userId: "user-1", returnTo: "/os/marketing", ttlSeconds: 300 },
      SECRET,
    );
    const payload = verifyMetaOAuthState(state, SECRET);
    assert.equal(payload.organizationId, "org-1");
    assert.equal(payload.userId, "user-1");
    assert.equal(payload.returnTo, "/os/marketing");
  });

  it("rejects tampered state", () => {
    const state = createMetaOAuthState({ organizationId: "org-1", userId: "user-1" }, SECRET);
    const [payload, signature] = state.split(".");
    // Flip a mid-signature character (trailing base64url chars can be no-ops after decode).
    const mid = Math.floor(signature.length / 2);
    const flipped = signature[mid] === "A" ? "B" : "A";
    const tampered = `${payload}.${signature.slice(0, mid)}${flipped}${signature.slice(mid + 1)}`;
    assert.throws(() => verifyMetaOAuthState(tampered, SECRET), /Invalid Meta OAuth state signature/);
  });

  it("prevents open redirects", () => {
    assert.equal(sanitizeMarketingReturnTo("https://evil.example"), "/os");
    assert.equal(sanitizeMarketingReturnTo("//evil.example"), "/os");
    assert.equal(sanitizeMarketingReturnTo("/pricing"), "/os");
    assert.equal(sanitizeMarketingReturnTo("/os/founder"), "/os/founder");
  });
});
