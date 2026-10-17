import assert from "node:assert/strict";
import test from "node:test";
import { calculateJewelleryPrice } from "../lib/jewellery-pricing";

test("calculates fixed making charge and wastage without tax", () => {
  const result = calculateJewelleryPrice({
    netMetalWeightGrams: 10,
    metalRatePerGram: 7000,
    stoneValue: 5000,
    makingChargeType: "fixed",
    makingChargeValue: 2500,
    wastagePercent: 5,
  });

  assert.deepEqual(result, {
    metalValue: 70000,
    wastageValue: 3500,
    makingCharge: 2500,
    stoneValue: 5000,
    subtotal: 81000,
  });
});

test("supports per gram making charge", () => {
  const result = calculateJewelleryPrice({
    netMetalWeightGrams: 8.5,
    metalRatePerGram: 7100,
    makingChargeType: "per_gram",
    makingChargeValue: 600,
  });

  assert.equal(result.metalValue, 60350);
  assert.equal(result.makingCharge, 5100);
  assert.equal(result.subtotal, 65450);
});

test("supports percentage making charge", () => {
  const result = calculateJewelleryPrice({
    netMetalWeightGrams: 5,
    metalRatePerGram: 7000,
    makingChargeType: "percentage",
    makingChargeValue: 12,
  });

  assert.equal(result.makingCharge, 4200);
  assert.equal(result.subtotal, 39200);
});

test("rejects invalid negative values", () => {
  assert.throws(
    () => calculateJewelleryPrice({ netMetalWeightGrams: -1, metalRatePerGram: 7000 }),
    /netMetalWeightGrams/
  );
});

test("rejects wastage above 100 percent", () => {
  assert.throws(
    () => calculateJewelleryPrice({ netMetalWeightGrams: 1, metalRatePerGram: 7000, wastagePercent: 101 }),
    /cannot exceed 100/
  );
});
