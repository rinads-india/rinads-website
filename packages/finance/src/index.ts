export type FinanceAccountType = "asset" | "liability" | "equity" | "income" | "expense";
export type FinanceNormalBalance = "debit" | "credit";
export type FinanceEntryStatus = "draft" | "posted" | "reversed";

export type FinanceAccount = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: FinanceAccountType;
  parentAccountId?: string;
  currency: string;
  isControl: boolean;
  isActive: boolean;
};

export type JournalLineInput = {
  accountId: string;
  debitMinor: number;
  creditMinor: number;
  description?: string;
};

export type JournalValidationResult =
  | { ok: true; totalDebitMinor: number; totalCreditMinor: number }
  | { ok: false; code: "EMPTY_ENTRY" | "INVALID_AMOUNT" | "UNBALANCED_ENTRY"; message: string };

export function normalBalanceForAccountType(type: FinanceAccountType): FinanceNormalBalance {
  return type === "asset" || type === "expense" ? "debit" : "credit";
}

function isWholeNonNegativeMinor(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount >= 0;
}

export function validateJournalLines(lines: readonly JournalLineInput[]): JournalValidationResult {
  if (lines.length < 2) {
    return { ok: false, code: "EMPTY_ENTRY", message: "A journal entry requires at least two lines." };
  }

  let totalDebitMinor = 0;
  let totalCreditMinor = 0;

  for (const line of lines) {
    if (!isWholeNonNegativeMinor(line.debitMinor) || !isWholeNonNegativeMinor(line.creditMinor)) {
      return {
        ok: false,
        code: "INVALID_AMOUNT",
        message: "Journal amounts must be non-negative safe integers in minor currency units.",
      };
    }

    const hasDebit = line.debitMinor > 0;
    const hasCredit = line.creditMinor > 0;
    if (hasDebit === hasCredit) {
      return {
        ok: false,
        code: "INVALID_AMOUNT",
        message: "Each journal line must contain either a debit or a credit, but not both.",
      };
    }

    totalDebitMinor += line.debitMinor;
    totalCreditMinor += line.creditMinor;

    if (!Number.isSafeInteger(totalDebitMinor) || !Number.isSafeInteger(totalCreditMinor)) {
      return {
        ok: false,
        code: "INVALID_AMOUNT",
        message: "Journal totals exceed safe integer precision.",
      };
    }
  }

  if (totalDebitMinor !== totalCreditMinor) {
    return {
      ok: false,
      code: "UNBALANCED_ENTRY",
      message: `Journal entry is not balanced: debit ${totalDebitMinor}, credit ${totalCreditMinor}.`,
    };
  }

  return { ok: true, totalDebitMinor, totalCreditMinor };
}

export type TrialBalanceLine = {
  accountId: string;
  debitMinor: number;
  creditMinor: number;
  netMinor: number;
};

export function buildTrialBalance(lines: readonly JournalLineInput[]): TrialBalanceLine[] {
  const byAccount = new Map<string, { debitMinor: number; creditMinor: number }>();

  for (const line of lines) {
    if (!isWholeNonNegativeMinor(line.debitMinor) || !isWholeNonNegativeMinor(line.creditMinor)) {
      throw new Error("Journal amounts must be non-negative safe integers in minor currency units.");
    }
    const current = byAccount.get(line.accountId) ?? { debitMinor: 0, creditMinor: 0 };
    current.debitMinor += line.debitMinor;
    current.creditMinor += line.creditMinor;
    byAccount.set(line.accountId, current);
  }

  return [...byAccount.entries()]
    .map(([accountId, totals]) => ({
      accountId,
      debitMinor: totals.debitMinor,
      creditMinor: totals.creditMinor,
      netMinor: totals.debitMinor - totals.creditMinor,
    }))
    .sort((a, b) => a.accountId.localeCompare(b.accountId));
}
