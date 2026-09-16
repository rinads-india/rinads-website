import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateLoyaltyBalance, loyaltyLiability, matchesSegment, pointsEarnedForAmount, redemptionValue, resolveLoyaltyTier } from "../src/index";

describe("loyalty helpers", () => {
  it("uses whole earn units and integer points", () => {
    assert.equal(pointsEarnedForAmount(299.99, { earnCurrencyUnits: 100, earnPoints: 1 }), 2);
    assert.equal(pointsEarnedForAmount(-1, { earnCurrencyUnits: 100, earnPoints: 1 }), 0);
  });

  it("derives balance, redemption value, liability, and tier", () => {
    assert.equal(calculateLoyaltyBalance([{ points: 20 }, { points: -7 }]), 13);
    assert.equal(redemptionValue(25, 10), 2.5);
    assert.equal(loyaltyLiability(25, 10), 2.5);
    assert.equal(resolveLoyaltyTier(120, [{ name: "Gold", minimumPoints: 100 }, { name: "Member", minimumPoints: 0 }]).name, "Gold");
  });

  it("supports balance and tier segmentation criteria", () => {
    const base = { visitCount: 1, lifetimeSpend: 100, preferredChannel: "whatsapp" as const, loyaltyBalance: 50, loyaltyTier: "Gold" };
    assert.deepEqual(matchesSegment(base, { minLoyaltyBalance: 50, loyaltyTier: "Gold" }), { matches: true });
    assert.equal(matchesSegment(base, { minLoyaltyBalance: 51 }).matches, false);
  });
});
