export type CreditSource =
  | "subscription"
  | "purchase"
  | "promotion"
  | "manual_adjustment"
  | "refund";

export type CreditLedgerEventType =
  | "grant"
  | "purchase"
  | "consume"
  | "refund"
  | "expire"
  | "adjustment";

export type CreditReservationStatus = "active" | "captured" | "released" | "expired";

export type CreditUsageProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "runway"
  | "elevenlabs"
  | "internal"
  | "other";

export type CreditLedgerEntry = {
  id: string;
  organizationId: string;
  accountId: string;
  eventType: CreditLedgerEventType;
  units: number;
  idempotencyKey: string;
  lotId?: string;
  usageEventId?: string;
  note?: string;
  occurredAt: string;
};

export type CreditReservation = {
  id: string;
  organizationId: string;
  accountId: string;
  units: number;
  status: CreditReservationStatus;
  idempotencyKey: string;
  expiresAt: string;
  createdAt: string;
};

export type CreditUsageEvent = {
  id: string;
  organizationId: string;
  provider: CreditUsageProvider;
  model?: string;
  operation: string;
  quantity?: number;
  providerCostMicros?: number;
  billableCredits: number;
  idempotencyKey: string;
  occurredAt: string;
};

export type CreditBalance = {
  total: number;
  reserved: number;
  available: number;
};

export function normalizeCreditUnits(units: number): number {
  if (!Number.isFinite(units)) throw new Error("Credit units must be finite.");
  if (!Number.isInteger(units)) throw new Error("Credit units must be whole integers.");
  return units;
}

export function calculateCreditBalance(
  ledger: readonly CreditLedgerEntry[],
  reservations: readonly CreditReservation[],
  organizationId: string,
  accountId: string,
  now = new Date()
): CreditBalance {
  const total = ledger
    .filter((entry) => entry.organizationId === organizationId && entry.accountId === accountId)
    .reduce((sum, entry) => sum + normalizeCreditUnits(entry.units), 0);

  const nowMs = now.getTime();
  const reserved = reservations
    .filter(
      (reservation) =>
        reservation.organizationId === organizationId &&
        reservation.accountId === accountId &&
        reservation.status === "active" &&
        new Date(reservation.expiresAt).getTime() > nowMs
    )
    .reduce((sum, reservation) => sum + Math.abs(normalizeCreditUnits(reservation.units)), 0);

  return {
    total,
    reserved,
    available: Math.max(0, total - reserved),
  };
}

export function canReserveCredits(balance: CreditBalance, requestedUnits: number): boolean {
  const units = Math.abs(normalizeCreditUnits(requestedUnits));
  return units > 0 && balance.available >= units;
}

export function creditsFromProviderCost(
  providerCostMicros: number,
  markupBps: number,
  microsPerCredit: number
): number {
  if (!Number.isFinite(providerCostMicros) || providerCostMicros < 0) {
    throw new Error("Provider cost must be a non-negative finite number.");
  }
  if (!Number.isFinite(markupBps) || markupBps < 0) {
    throw new Error("Markup basis points must be a non-negative finite number.");
  }
  if (!Number.isFinite(microsPerCredit) || microsPerCredit <= 0) {
    throw new Error("microsPerCredit must be greater than zero.");
  }

  const grossMicros = providerCostMicros * (1 + markupBps / 10_000);
  return Math.max(1, Math.ceil(grossMicros / microsPerCredit));
}
