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

export type LoyaltyExpiryLedgerEntry = Pick<SalonLoyaltyLedgerEntry, "id" | "points" | "createdAt">;

/**
 * FIFO remaining points from ledger lots older than `pointsExpiryDays` as of `asOf`.
 * Positive rows open lots; negative rows consume oldest lots first.
 */
export function computeExpirablePoints(
  entries: LoyaltyExpiryLedgerEntry[],
  pointsExpiryDays: number,
  asOf: Date = new Date()
): number {
  if (!Number.isInteger(pointsExpiryDays) || pointsExpiryDays <= 0) return 0;
  const sorted = [...entries]
    .filter((entry) => entry.createdAt && Number.isInteger(entry.points) && entry.points !== 0)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id));

  type Lot = { createdAt: Date; remaining: number };
  const lots: Lot[] = [];

  for (const entry of sorted) {
    const createdAt = new Date(String(entry.createdAt));
    if (Number.isNaN(createdAt.getTime())) continue;
    if (entry.points > 0) {
      lots.push({ createdAt, remaining: entry.points });
      continue;
    }
    let need = -entry.points;
    for (const lot of lots) {
      if (need <= 0) break;
      const take = Math.min(lot.remaining, need);
      lot.remaining -= take;
      need -= take;
    }
  }

  const cutoffMs = asOf.getTime() - pointsExpiryDays * 86_400_000;
  return lots.reduce((sum, lot) => (lot.createdAt.getTime() < cutoffMs ? sum + lot.remaining : sum), 0);
}

export type LoyaltyExpiryBatchAccount = {
  accountId: string;
  customerId: string;
  points: number;
};

export function planLoyaltyExpiryBatch(
  accounts: Array<{ accountId: string; customerId: string; entries: LoyaltyExpiryLedgerEntry[] }>,
  pointsExpiryDays: number,
  asOf: Date = new Date()
): LoyaltyExpiryBatchAccount[] {
  const planned: LoyaltyExpiryBatchAccount[] = [];
  for (const account of accounts) {
    const points = computeExpirablePoints(account.entries, pointsExpiryDays, asOf);
    if (points > 0) planned.push({ accountId: account.accountId, customerId: account.customerId, points });
  }
  return planned;
}
