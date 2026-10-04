import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPreviewToken } from "@rinads/cms/preview-tokens";
import { evaluatePreview, resolvePreview } from "../lib/cms-preview";

const SECRET = "website-preview-secret";
const PATH = "/blog/rinpo-grounded-business-actions";

describe("website cms preview decision", () => {
  it("does not preview when no token is present", () => {
    const decision = evaluatePreview({ token: null, path: PATH, secret: SECRET });
    assert.equal(decision.previewing, false);
    assert.equal(decision.reason, "no_token");
  });

  it("fails closed when no secret is configured", () => {
    const token = createPreviewToken({ path: PATH, secret: SECRET });
    const decision = evaluatePreview({ token, path: PATH, secret: null });
    assert.equal(decision.previewing, false);
    assert.equal(decision.reason, "no_secret");
  });

  it("previews a draft with a valid, path-scoped token", () => {
    const token = createPreviewToken({ path: PATH, secret: SECRET });
    const decision = evaluatePreview({ token, path: PATH, secret: SECRET });
    assert.equal(decision.previewing, true);
    assert.equal(decision.reason, "valid");
  });

  it("rejects a token minted for a different path", () => {
    const token = createPreviewToken({ path: "/blog/other", secret: SECRET });
    const decision = evaluatePreview({ token, path: PATH, secret: SECRET });
    assert.equal(decision.previewing, false);
    assert.equal(decision.reason, "path_mismatch");
  });

  it("rejects a tampered token", () => {
    const token = createPreviewToken({ path: PATH, secret: SECRET });
    const tampered = `${token.split(".")[0]}.deadbeef`;
    const decision = evaluatePreview({ token: tampered, path: PATH, secret: SECRET });
    assert.equal(decision.previewing, false);
    assert.equal(decision.reason, "bad_signature");
  });

  it("rejects an expired token", () => {
    const base = 1_000_000_000_000;
    const token = createPreviewToken({ path: PATH, secret: SECRET, ttlSeconds: 60, now: () => base });
    const decision = evaluatePreview({ token, path: PATH, secret: SECRET, now: () => base + 61_000 });
    assert.equal(decision.previewing, false);
    assert.equal(decision.reason, "expired");
  });

  it("resolvePreview reads the secret from the provided env and verifies", () => {
    const token = createPreviewToken({ path: PATH, secret: SECRET });
    const ok = resolvePreview({ token, path: PATH, env: { CMS_PREVIEW_SECRET: SECRET } });
    assert.equal(ok.previewing, true);
    const noSecret = resolvePreview({ token, path: PATH, env: {} });
    assert.equal(noSecret.previewing, false);
    assert.equal(noSecret.reason, "no_secret");
  });
});
