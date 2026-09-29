import test from "node:test";
import assert from "node:assert/strict";
import { checkAsset } from "./check-asset.mjs";

const clean = () => ({
  schema_version: "world.asset.v1",
  asset_id: "RW-TEST-1234",
  sha256: "a".repeat(64),
  filename: "original.jpg",
  source_type: "original_camera",
  creator: "Creator under written contract",
  captured_or_created_at: "2026-09-22T05:00:00Z",
  usage_status: "approved",
  intended_uses: ["internal_review", "world_texture", "world_geometry"],
  rights_evidence: [{ evidence_type: "creator_contract", record_id: "CONTRACT-1" }],
  reviewed_by: "Reviewed by authorized legal/production lead",
  reviewed_at: "2026-09-29T05:00:00Z",
  privacy_review: "approved",
  geography: { verification: "field_surveyed", survey_record_id: "SURVEY-1", public_safe: true }
});

test("allows properly reviewed original asset for declared operation", () => {
  assert.equal(checkAsset(clean(), "world_texture").ok, true);
});
test("rejects never-reviewed original", () => {
  const m = clean(); m.usage_status = "pending";
  assert.equal(checkAsset(m, "world_texture").ok, false);
});
test("rejects missing rights evidence", () => {
  const m = clean(); m.rights_evidence = [];
  assert.equal(checkAsset(m, "world_texture").ok, false);
});
test("rejects missing privacy review", () => {
  const m = clean(); m.privacy_review = "pending";
  assert.equal(checkAsset(m, "world_texture").ok, false);
});
test("rejects use beyond approved intended_uses", () => {
  assert.equal(checkAsset(clean(), "ai_training").ok, false);
});
test("rejects missing independent geospatial verification", () => {
  const m = clean(); m.geography = { verification: "exif_sample_only", public_safe: true };
  assert.equal(checkAsset(m, "world_geometry").ok, false);
});
test("rejects production use of Google map screenshots even if falsely labeled approved", () => {
  const m = clean(); m.source_type = "google_reference_only";
  assert.equal(checkAsset(m, "world_geometry").ok, false);
});
test("permits only declared internal review on restricted Google screenshots", () => {
  const m = clean(); m.source_type = "google_reference_only"; m.usage_status = "restricted"; m.intended_uses = ["internal_review"];
  assert.equal(checkAsset(m, "internal_review").ok, true);
});
test("rejects Google screenshots whose manifest declares production uses", () => {
  const m = clean(); m.source_type = "google_reference_only"; m.usage_status = "restricted";
  assert.equal(checkAsset(m, "internal_review").ok, false);
});
test("fail closed for malformed manifest and unknown operation", () => {
  assert.equal(checkAsset(null, "world_texture").ok, false);
  assert.equal(checkAsset(clean(), "unknown-use").ok, false);
});
