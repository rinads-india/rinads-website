export type MakingChargeType = "fixed" | "per_gram" | "percentage";

export type JewelleryPriceInput = {
  netMetalWeightGrams: number;
  metalRatePerGram: number;
  stoneValue?: number;
  makingChargeType?: MakingChargeType;
  makingChargeValue?: number;
  wastagePercent?: number;
};

export type JewelleryPriceBreakdown = {
  metalValue: number;
  wastageValue: number;
  makingCharge: number;
  stoneValue: number;
  subtotal: number;
};

function finiteNonNegative(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite non-negative number.`);
  }
  return value;
}

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateJewelleryPrice(input: JewelleryPriceInput): JewelleryPriceBreakdown {
  const weight = finiteNonNegative(input.netMetalWeightGrams, "netMetalWeightGrams");
  const rate = finiteNonNegative(input.metalRatePerGram, "metalRatePerGram");
  const stoneValue = finiteNonNegative(input.stoneValue ?? 0, "stoneValue");
  const makingChargeValue = finiteNonNegative(input.makingChargeValue ?? 0, "makingChargeValue");
  const wastagePercent = finiteNonNegative(input.wastagePercent ?? 0, "wastagePercent");

  if (wastagePercent > 100) {
    throw new Error("wastagePercent cannot exceed 100.");
  }

  const metalValue = weight * rate;
  const wastageValue = metalValue * (wastagePercent / 100);
  const makingChargeType = input.makingChargeType ?? "fixed";

  let makingCharge: number;
  switch (makingChargeType) {
    case "fixed":
      makingCharge = makingChargeValue;
      break;
    case "per_gram":
      makingCharge = weight * makingChargeValue;
      break;
    case "percentage":
      makingCharge = metalValue * (makingChargeValue / 100);
      break;
    default: {
      const exhaustive: never = makingChargeType;
      throw new Error(`Unsupported making charge type: ${exhaustive}`);
    }
  }

  return {
    metalValue: money(metalValue),
    wastageValue: money(wastageValue),
    makingCharge: money(makingCharge),
    stoneValue: money(stoneValue),
    subtotal: money(metalValue + wastageValue + makingCharge + stoneValue),
  };
}
