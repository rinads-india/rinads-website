import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateIndiaGstComponents,
  classifyIndiaSupply,
  gstStateCodeFromGstin,
  isValidGstinFormat,
  isValidTaxClassificationCode,
  normalizeGstin,
} from "../src/india-compliance";

describe("India compliance helpers", () => {
  it("normalizes and validates GSTIN format", () => {
    assert.equal(normalizeGstin(" 32aabck1234a1z5 "), "32AABCK1234A1Z5");
    assert.equal(isValidGstinFormat("32AABCK1234A1Z5"), true);
    assert.equal(isValidGstinFormat("bad"), false);
    assert.equal(gstStateCodeFromGstin("32AABCK1234A1Z5"), "32");
  });

  it("classifies intra- and interstate evidence", () => {
    assert.equal(classifyIndiaSupply("32", "32"), "intrastate");
    assert.equal(classifyIndiaSupply("32", "29"), "interstate");
    assert.equal(classifyIndiaSupply("32", undefined), "unknown");
  });

  it("splits intrastate GST into CGST and SGST while preserving the total", () => {
    const result = calculateIndiaGstComponents({
      taxableMinor: 100_00,
      rateBps: 1_800,
      supplierStateCode: "32",
      placeOfSupplyStateCode: "32",
    });

    assert.deepEqual(result, {
      taxableMinor: 100_00,
      rateBps: 1_800,
      totalTaxMinor: 1_800,
      cgstMinor: 900,
      sgstMinor: 900,
      igstMinor: 0,
      supplyType: "intrastate",
    });
  });

  it("uses IGST for interstate evidence", () => {
    const result = calculateIndiaGstComponents({
      taxableMinor: 100_00,
      rateBps: 1_800,
      supplierStateCode: "32",
      placeOfSupplyStateCode: "29",
    });

    assert.equal(result.totalTaxMinor, 1_800);
    assert.equal(result.igstMinor, 1_800);
    assert.equal(result.cgstMinor, 0);
    assert.equal(result.sgstMinor, 0);
  });

  it("does not invent a component allocation when place of supply is unknown", () => {
    const result = calculateIndiaGstComponents({ taxableMinor: 100_00, rateBps: 1_800 });
    assert.equal(result.supplyType, "unknown");
    assert.equal(result.totalTaxMinor, 1_800);
    assert.equal(result.cgstMinor + result.sgstMinor + result.igstMinor, 0);
  });

  it("validates only tax-code shape, not legal applicability", () => {
    assert.equal(isValidTaxClassificationCode("sac", "999700"), true);
    assert.equal(isValidTaxClassificationCode("hsn", "7113"), true);
    assert.equal(isValidTaxClassificationCode("hsn", "71131990"), true);
    assert.equal(isValidTaxClassificationCode("sac", "9997"), false);
  });
});
