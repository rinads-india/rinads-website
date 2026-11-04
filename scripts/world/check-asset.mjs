/**
 * Fail-closed RINADS WORLD asset import gate.
 * Standalone: node scripts/world/check-asset.mjs --usage world_geometry manifest.json [...]
 * This is an import policy gate, not a general-purpose JSON Schema validator or rights determination.
 * Copyright evidence IDs must reference approved, access-controlled records, not be self-declared.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const operations = new Set(["internal_review","world_texture","world_geometry","world_cinematic","public_promotion","photogrammetry","ai_training","storefront_public"]);
const sourceTypes = new Set(["original_camera","commissioned_original","original_3d","approved_licensed_third_party","open_data","google_reference_only"]);

export function checkAsset(manifest, operation) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (!operations.has(operation)) return { ok: false, errors: ["Unrecognized requested operation"] };
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return { ok: false, errors: ["Manifest must be a JSON object"] };
  if (manifest.schema_version !== "world.asset.v1") fail("Unsupported schema version");
  if (typeof manifest.asset_id !== "string" || !/^RW-[A-Z0-9][A-Z0-9-]{5,63}$/.test(manifest.asset_id)) fail("Missing or malformed asset_id");
  if (typeof manifest.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(manifest.sha256)) fail("Missing or malformed SHA-256 fingerprint");
  if (typeof manifest.filename !== "string" || !manifest.filename.trim()) fail("Filename required");
  if (!sourceTypes.has(manifest.source_type)) fail("Unrecognized source_type");
  if (typeof manifest.creator !== "string" || !manifest.creator.trim()) fail("Creator provenance missing");
  if (typeof manifest.captured_or_created_at !== "string" || !Number.isFinite(Date.parse(manifest.captured_or_created_at))) fail("Valid capture/creation timestamp required");
  if (!Array.isArray(manifest.intended_uses) || manifest.intended_uses.length === 0 || manifest.intended_uses.some(x => !operations.has(x))) fail("Valid intended_uses list required");

  if (manifest.source_type === "google_reference_only") {
    if (operation !== "internal_review") fail("Google reference assets are research-only, never standalone WORLD assets");
    if (manifest.usage_status === "approved") fail("Google reference cannot be approved via this manifest");
    if (Array.isArray(manifest.intended_uses) && manifest.intended_uses.some(x => x !== "internal_review")) fail("Google reference permits internal_review only");
  }
  if (operation === "internal_review") {
    if (manifest.usage_status === "rejected") fail("Rejected asset cannot be used for any operation");
    if (!Array.isArray(manifest.intended_uses) || !manifest.intended_uses.includes("internal_review")) fail("Internal review use not declared");
  } else {
    if (manifest.usage_status !== "approved") fail("Production operation requires usage_status=approved");
    if (!Array.isArray(manifest.intended_uses) || !manifest.intended_uses.includes(operation)) fail("Requested operation not in approved intended_uses");
    if (!Array.isArray(manifest.rights_evidence) || manifest.rights_evidence.length === 0 ||
        manifest.rights_evidence.some(x => !x || typeof x.record_id !== "string" || !x.record_id.trim() ||
          !["creator_contract","merchant_permission","property_permission","third_party_license","open_data_licence","privacy_release"].includes(x.evidence_type))) {
      fail("Specific recorded rights evidence required");
    }
    if (typeof manifest.reviewed_by !== "string" || !manifest.reviewed_by.trim() || (typeof manifest.reviewed_at !== "string" || !Number.isFinite(Date.parse(manifest.reviewed_at)))) fail("Dated named rights review required");
    if (manifest.privacy_review !== "approved") fail("Privacy review must be approved");
    if (operation === "world_geometry") {
      if (!["field_surveyed","licensed_dataset"].includes(manifest.geography?.verification)) fail("Production geometry needs an independent survey or licensed dataset");
      if (manifest.geography?.verification === "field_surveyed" && (typeof manifest.geography?.survey_record_id !== "string" || !manifest.geography.survey_record_id.trim())) fail("Surveyed geometry requires survey record ID");
    }
    if (manifest.geography?.public_safe === false) fail("Asset is explicitly not approved for public-safe location display");
  }
  return { ok: errors.length === 0, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.length < 3 || args[0] !== "--usage" || !operations.has(args[1])) {
    console.error("Usage: node scripts/world/check-asset.mjs --usage <operation> <manifest.json> [manifest.json ...]");
    process.exitCode = 2;
  } else {
    const use = args[1];
    for (const path of args.slice(2)) {
      try {
        const manifest = JSON.parse(readFileSync(path, "utf8"));
        const decision = checkAsset(manifest, use);
        console.log(JSON.stringify({ file: path, operation: use, ...decision }));
        if (!decision.ok) process.exitCode = 1;
      } catch (error) {
        console.error(JSON.stringify({ file: path, ok: false, errors: ["File unavailable or invalid JSON: " + error.message] }));
        process.exitCode = 1;
      }
    }
  }
}
