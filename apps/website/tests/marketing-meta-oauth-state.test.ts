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
    const tampered = `${state.slice(0, -1)}${state.endsWith("a") ? "b" : "a"}`;
    assert.throws(() => verifyMetaOAuthState(tampered, SECRET), /Invalid Meta OAuth state signature/);
  });

  it("prevents open redirects", () => {
    assert.equal(sanitizeMarketingReturnTo("https://evil.example"), "/os");
    assert.equal(sanitizeMarketingReturnTo("//evil.example"), "/os");
    assert.equal(sanitizeMarketingReturnTo("/pricing"), "/os");
    assert.equal(sanitizeMarketingReturnTo("/os/founder"), "/os/founder");
  });
});
