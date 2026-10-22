export const INDIA_GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export type IndiaSupplyType = "intrastate" | "interstate" | "unknown";

export type IndiaGstComponents = {
  taxableMinor: number;
  rateBps: number;
  totalTaxMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  supplyType: IndiaSupplyType;
};

export function normalizeGstin(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidGstinFormat(value: string): boolean {
  return INDIA_GSTIN_PATTERN.test(normalizeGstin(value));
}

export function gstStateCodeFromGstin(value: string): string | null {
  const normalized = normalizeGstin(value);
  if (!INDIA_GSTIN_PATTERN.test(normalized)) return null;
  return normalized.slice(0, 2);
}

/** Format-only validation. It deliberately does not embed a statutory code list. */
export function isValidIndiaStateCode(value: string): boolean {
  return /^\d{2}$/.test(value) && value !== "00";
}

export function classifyIndiaSupply(
  supplierStateCode: string | null | undefined,
  placeOfSupplyStateCode: string | null | undefined
): IndiaSupplyType {
  if (!supplierStateCode || !placeOfSupplyStateCode) return "unknown";
  if (!isValidIndiaStateCode(supplierStateCode) || !isValidIndiaStateCode(placeOfSupplyStateCode)) {
    return "unknown";
  }
  return supplierStateCode === placeOfSupplyStateCode ? "intrastate" : "interstate";
}

function assertMinorAmount(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer in minor currency units.`);
  }
}

function assertRateBps(rateBps: number): void {
  if (!Number.isSafeInteger(rateBps) || rateBps < 0 || rateBps > 100_000) {
    throw new Error("GST rate basis points must be a non-negative safe integer.");
  }
}

/**
 * Multiply a safe-integer minor amount by basis points without creating an
 * unsafe intermediate product. Split the amount around the 10,000-bps
 * denominator so every multiplication remains inside Number safe-integer
 * precision, then apply deterministic half-up rounding to the remainder.
 */
function applyRateBpsToMinor(amountMinor: number, rateBps: number): number {
  if (amountMinor === 0 || rateBps === 0) return 0;

  const denominator = 10_000;
  const quotient = Math.floor(amountMinor / denominator);
  const remainder = amountMinor % denominator;

  if (quotient > Math.floor(Number.MAX_SAFE_INTEGER / rateBps)) {
    throw new Error("GST amount exceeds safe integer precision.");
  }

  const wholeMinor = quotient * rateBps;
  const fractionalMinor = Math.round((remainder * rateBps) / denominator);

  if (wholeMinor > Number.MAX_SAFE_INTEGER - fractionalMinor) {
    throw new Error("GST amount exceeds safe integer precision.");
  }

  return wholeMinor + fractionalMinor;
}

/**
 * Deterministic GST component evidence helper.
 *
 * This is arithmetic only. It does not decide whether a supply is taxable,
 * exempt, zero-rated, reverse-charge, export/SEZ, or which legal rate applies.
 * Those decisions must come from validated tax policy/configuration.
 */
export function calculateIndiaGstComponents(input: {
  taxableMinor: number;
  rateBps: number;
  supplierStateCode?: string | null;
  placeOfSupplyStateCode?: string | null;
}): IndiaGstComponents {
  assertMinorAmount(input.taxableMinor, "Taxable amount");
  assertRateBps(input.rateBps);

  const supplyType = classifyIndiaSupply(input.supplierStateCode, input.placeOfSupplyStateCode);
  const totalTaxMinor = applyRateBpsToMinor(input.taxableMinor, input.rateBps);

  if (supplyType === "intrastate") {
    const cgstMinor = Math.floor(totalTaxMinor / 2);
    const sgstMinor = totalTaxMinor - cgstMinor;
    return {
      taxableMinor: input.taxableMinor,
      rateBps: input.rateBps,
      totalTaxMinor,
      cgstMinor,
      sgstMinor,
      igstMinor: 0,
      supplyType,
    };
  }

  if (supplyType === "interstate") {
    return {
      taxableMinor: input.taxableMinor,
      rateBps: input.rateBps,
      totalTaxMinor,
      cgstMinor: 0,
      sgstMinor: 0,
      igstMinor: totalTaxMinor,
      supplyType,
    };
  }

  return {
    taxableMinor: input.taxableMinor,
    rateBps: input.rateBps,
    totalTaxMinor,
    cgstMinor: 0,
    sgstMinor: 0,
    igstMinor: 0,
    supplyType,
  };
}

/** Shape validation only; legal classification and required digit depth are policy. */
export function isValidTaxClassificationCode(kind: "hsn" | "sac", code: string): boolean {
  const normalized = code.trim();
  if (kind === "sac") return /^\d{4,6}$/.test(normalized);
  return /^\d{4,8}$/.test(normalized);
}
