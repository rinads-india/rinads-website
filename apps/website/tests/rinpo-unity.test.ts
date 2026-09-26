import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRinpoUnityManifest, resolveRinpoUnityBaseUrl } from "../lib/rinpo-unity";

const valid = {
  version: "1.0.0",
  loader: "Build/rinpo.loader.js",
  data: "Build/rinpo.data.br",
  framework: "Build/rinpo.framework.js.br",
  code: "Build/rinpo.wasm.br",
};

describe("RINPO Unity Web public asset contract", () => {
  it("accepts a pinned Unity build manifest", () => {
    assert.deepEqual(parseRinpoUnityManifest(valid), valid);
  });

  it("rejects cross-directory paths and unexpected filenames", () => {
    assert.equal(parseRinpoUnityManifest({ ...valid, loader: "../../evil.loader.js" }), null);
    assert.equal(parseRinpoUnityManifest({ ...valid, framework: "https://other.test/a.js" }), null);
    assert.equal(parseRinpoUnityManifest({ ...valid, code: "Build/rinpo.js" }), null);
    assert.equal(parseRinpoUnityManifest({ ...valid, version: "<script>" }), null);
    assert.equal(parseRinpoUnityManifest(null), null);
  });

  it("accepts only the owned deployment origin or assets.rinads.com", () => {
    const origin = "https://www.rinads.com";
    assert.equal(
      resolveRinpoUnityBaseUrl("/unity/rinpo/v1", origin),
      "https://www.rinads.com/unity/rinpo/v1",
    );
    assert.equal(
      resolveRinpoUnityBaseUrl("https://assets.rinads.com/unity/rinpo/v1", origin),
      "https://assets.rinads.com/unity/rinpo/v1",
    );
    assert.equal(resolveRinpoUnityBaseUrl("https://cdn.example.com/unity/rinpo/v1", origin), null);
    assert.equal(resolveRinpoUnityBaseUrl("//assets.rinads.com/unity/rinpo/v1", origin), null);
    assert.equal(resolveRinpoUnityBaseUrl("/unity/rinpo/../other", origin), null);
    assert.equal(resolveRinpoUnityBaseUrl("javascript:alert(1)", origin), null);
  });
});
