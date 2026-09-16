import type { LoyaltyTier, SalonLoyaltyLedgerEntry, SalonLoyaltyProgram } from "./types";

export function calculateLoyaltyBalance(entries: Pick<SalonLoyaltyLedgerEntry, "points">[]): number {
  return entries.reduce((total, entry) => total + entry.points, 0);
}

export function pointsEarnedForAmount(amount: number, program: Pick<SalonLoyaltyProgram, "earnCurrencyUnits" | "earnPoints">): number {
  if (!Number.isFinite(amount) || amount <= 0 || program.earnCurrencyUnits <= 0) return 0;
  return Math.floor(amount / program.earnCurrencyUnits) * program.earnPoints;
}

export function redemptionValue(points: number, pointsPerCurrencyUnit: number): number {
  if (!Number.isInteger(points) || points <= 0 || pointsPerCurrencyUnit <= 0) return 0;
  return Math.floor((points / pointsPerCurrencyUnit) * 100) / 100;
}

export function resolveLoyaltyTier(lifetimeEarnedPoints: number, tiers: LoyaltyTier[]): LoyaltyTier {
  const ordered = [...tiers].filter((tier) => tier.minimumPoints >= 0).sort((a, b) => a.minimumPoints - b.minimumPoints);
  return [...ordered].reverse().find((tier) => lifetimeEarnedPoints >= tier.minimumPoints) ?? { name: "Member", minimumPoints: 0 };
}

export function loyaltyLiability(balancePoints: number, pointsPerCurrencyUnit: number): number {
  return redemptionValue(Math.max(0, balancePoints), pointsPerCurrencyUnit);
}
