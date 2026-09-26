import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRinaglowPublicPath } from "../lib/public-paths";
import fs from "node:fs";

describe("R GLOW middleware public path contract", () => {
  it("allows the feedback capability route and descendants", () => {
    assert.equal(isRinaglowPublicPath("/feedback"), true);
    assert.equal(isRinaglowPublicPath("/feedback/opaque-token"), true);
  });

  it("keeps near-matches and console routes protected", () => {
    assert.equal(isRinaglowPublicPath("/feedback-private"), false);
    assert.equal(isRinaglowPublicPath("/feedbackish/token"), false);
    assert.equal(isRinaglowPublicPath("/calendar"), false);
  });

  it("keeps the production environment contract ahead of auth routing", () => {
    const source = fs.readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
    assert.ok(source.indexOf("checkProductionEnvContract()") < source.indexOf("isRinaglowPublicPath(pathname)"));
    assert.match(source, /status:\s*503/);
    assert.match(source, /sanitizeRelativeNext/);
    assert.match(source, /getSharedAuthCookieOptions/);
  });
});
