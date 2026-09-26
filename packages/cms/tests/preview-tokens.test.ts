import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createPreviewToken,
  resolvePreviewSecret,
  verifyPreviewToken,
} from "../src/preview-tokens";

const SECRET = "test-preview-secret";

describe("cms preview tokens", () => {
  it("creates a token that verifies for its own path", () => {
    const token = createPreviewToken({ path: "/blog/hello", secret: SECRET });
    const result = verifyPreviewToken({ token, secret: SECRET, path: "/blog/hello" });
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.payload.path, "/blog/hello");
  });

  it("rejects a token used for a different path", () => {
    const token = createPreviewToken({ path: "/blog/hello", secret: SECRET });
    const result = verifyPreviewToken({ token, secret: SECRET, path: "/blog/other" });
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, "path_mismatch");
  });

  it("rejects a tampered signature", () => {
    const token = createPreviewToken({ path: "/blog/hello", secret: SECRET });
    const tampered = `${token.split(".")[0]}.deadbeef`;
    const result = verifyPreviewToken({ token: tampered, secret: SECRET, path: "/blog/hello" });
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, "bad_signature");
  });

  it("rejects a token signed with a different secret", () => {
    const token = createPreviewToken({ path: "/blog/hello", secret: SECRET });
    const result = verifyPreviewToken({ token, secret: "other-secret", path: "/blog/hello" });
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, "bad_signature");
  });

  it("expires tokens after the TTL", () => {
    const base = 1_000_000_000_000; // fixed clock
    const token = createPreviewToken({
      path: "/blog/hello",
      secret: SECRET,
      ttlSeconds: 60,
      now: () => base,
    });
    const before = verifyPreviewToken({ token, secret: SECRET, path: "/blog/hello", now: () => base + 30_000 });
    assert.equal(before.valid, true);
    const after = verifyPreviewToken({ token, secret: SECRET, path: "/blog/hello", now: () => base + 61_000 });
    assert.equal(after.valid, false);
    if (!after.valid) assert.equal(after.reason, "expired");
  });

  it("treats malformed tokens as invalid without throwing", () => {
    for (const bad of ["", "nodot", "a.b.c.d"]) {
      const result = verifyPreviewToken({ token: bad, secret: SECRET, path: "/x" });
      assert.equal(result.valid, false);
    }
  });

  it("requires an absolute path and a secret", () => {
    assert.throws(() => createPreviewToken({ path: "relative", secret: SECRET }));
    assert.throws(() => createPreviewToken({ path: "/ok", secret: "" }));
  });

  it("resolves a preview secret and fails closed when unset", () => {
    assert.equal(resolvePreviewSecret({ CMS_PREVIEW_SECRET: "s" }), "s");
    assert.equal(resolvePreviewSecret({ CMS_REVALIDATE_SECRET: "fallback" }), "fallback");
    assert.equal(resolvePreviewSecret({}), null);
  });
});
