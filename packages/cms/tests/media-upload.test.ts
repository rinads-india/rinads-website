import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CMS_MEDIA_BUCKET,
  CMS_MEDIA_MAX_BYTES,
  buildCmsMediaStoragePath,
  resolveCmsMediaBucket,
  sanitizeMediaFileName,
  validateCmsMediaUpload,
} from "../src/media-upload";

describe("@rinads/cms media-upload", () => {
  it("sanitizes file names", () => {
    assert.equal(sanitizeMediaFileName("../../Evil Name!!.PNG"), "evil-name.png");
    assert.equal(sanitizeMediaFileName("path/to/Logo.svg"), "logo.svg");
    assert.equal(sanitizeMediaFileName("..."), "upload");
  });

  it("accepts allowed image uploads", () => {
    const result = validateCmsMediaUpload({
      fileName: "hero.png",
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.fileName, "hero.png");
      assert.equal(result.mimeType, "image/png");
    }
  });

  it("rejects empty, oversized, and disallowed mime types", () => {
    assert.equal(
      validateCmsMediaUpload({ fileName: "a.png", mimeType: "image/png", sizeBytes: 0 }).ok,
      false,
    );
    assert.equal(
      validateCmsMediaUpload({
        fileName: "a.png",
        mimeType: "image/png",
        sizeBytes: CMS_MEDIA_MAX_BYTES + 1,
      }).ok,
      false,
    );
    assert.equal(
      validateCmsMediaUpload({
        fileName: "a.pdf",
        mimeType: "application/pdf",
        sizeBytes: 10,
      }).ok,
      false,
    );
  });

  it("builds dated storage paths with id and extension fallback", () => {
    const path = buildCmsMediaStoragePath({
      fileName: "Hero Shot",
      mimeType: "image/jpeg",
      now: new Date("2026-10-08T12:00:00Z"),
      id: "abc123",
    });
    assert.equal(path, "uploads/2026/10/abc123-hero-shot.jpg");
  });

  it("resolves bucket from env with default fallback", () => {
    assert.equal(resolveCmsMediaBucket({}), CMS_MEDIA_BUCKET);
    assert.equal(resolveCmsMediaBucket({ CMS_MEDIA_BUCKET: " custom " }), "custom");
  });
});
