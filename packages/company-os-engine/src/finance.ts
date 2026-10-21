import type { InvoiceStatus } from "./lifecycle";
import { daysBetween, round2 } from "./types";

export type InvoiceFact = {
  id: string;
  number: string;
  companyId: string | null;
  companyName?: string | null;
  projectId: string | null;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  total: number;
  currency: string;
};

export type PaymentFact = {
  id: string;
  invoiceId: string | null;
  amount: number;
  currency: string;
  receivedAt: string;
};

export type ExpenseFact = {
  id: string;
  amount: number;
  incurredAt: string;
};

export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export type ReceivableRow = {
  invoice: InvoiceFact;
  paid: number;
  outstanding: number;
  daysOverdue: number;
  bucket: AgingBucket;
  overdue: boolean;
};

export type ReceivablesSummary = {
  rows: ReceivableRow[];
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  buckets: Record<AgingBucket, number>;
  currencies: string[];
  mixedCurrency: boolean;
};

export function paidAgainst(invoiceId: string, payments: readonly PaymentFact[]): number {
  return round2(payments.filter((p) => p.invoiceId === invoiceId).reduce((sum, p) => sum + p.amount, 0));
}

export function agingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return "current";
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

/** Derived display status. `overdue` is never stored. */
export function derivedInvoiceStatus(
  invoice: Pick<InvoiceFact, "status" | "dueDate">,
  outstanding: number,
  now: Date
): InvoiceStatus | "overdue" {
  if ((invoice.status === "issued" || invoice.status === "partially_paid") && outstanding > 0.005) {
    if (invoice.dueDate && new Date(invoice.dueDate).getTime() < now.getTime()) return "overdue";
  }
  return invoice.status;
}

export function summarizeReceivables(
  invoices: readonly InvoiceFact[],
  payments: readonly PaymentFact[],
  now: Date
): ReceivablesSummary {
  const rows: ReceivableRow[] = [];
  const buckets: Record<AgingBucket, number> = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

  for (const invoice of invoices) {
    if (invoice.status !== "issued" && invoice.status !== "partially_paid") continue;
    const paid = paidAgainst(invoice.id, payments);
    const outstanding = round2(invoice.total - paid);
    if (outstanding <= 0.005) continue;
    const daysOverdue = invoice.dueDate ? Math.max(0, daysBetween(invoice.dueDate, now)) : 0;
    const overdue = !!invoice.dueDate && new Date(invoice.dueDate).getTime() < now.getTime();
    const bucket = overdue ? agingBucket(Math.max(1, daysOverdue)) : "current";
    buckets[bucket] = round2(buckets[bucket] + outstanding);
    rows.push({ invoice, paid, outstanding, daysOverdue: overdue ? Math.max(1, daysOverdue) : 0, bucket, overdue });
  }

  const currencies = [...new Set(rows.map((r) => r.invoice.currency))];
  const totalOutstanding = round2(rows.reduce((s, r) => s + r.outstanding, 0));
  const totalOverdue = round2(rows.filter((r) => r.overdue).reduce((s, r) => s + r.outstanding, 0));

  return {
    rows: rows.sort((a, b) => b.daysOverdue - a.daysOverdue || b.outstanding - a.outstanding),
    totalOutstanding,
    totalOverdue,
    overdueCount: rows.filter((r) => r.overdue).length,
    buckets,
    currencies,
    mixedCurrency: currencies.length > 1,
  };
}

export type CashSummary = {
  /** Cash-basis: only payments actually recorded in `finance_payments` count as revenue. */
  receivedThisPeriod: number;
  receivedPreviousPeriod: number;
  expensesThisPeriod: number | null;
  netCashMovement: number | null;
  basis: string;
};

export function summarizeCash(input: {
  payments: readonly PaymentFact[];
  expenses: readonly ExpenseFact[] | null;
  periodStart: string;
  periodEnd: string;
  previousPeriodStart: string;
}): CashSummary {
  const inPeriod = (iso: string, from: string, to: string) => iso >= from && iso < to;
  const received = round2(
    input.payments.filter((p) => inPeriod(p.receivedAt, input.periodStart, input.periodEnd)).reduce((s, p) => s + p.amount, 0)
  );
  const previous = round2(
    input.payments
      .filter((p) => inPeriod(p.receivedAt, input.previousPeriodStart, input.periodStart))
      .reduce((s, p) => s + p.amount, 0)
  );
  const expenses =
    input.expenses === null
      ? null
      : round2(
          input.expenses.filter((e) => inPeriod(e.incurredAt, input.periodStart, input.periodEnd)).reduce((s, e) => s + e.amount, 0)
        );
  return {
    receivedThisPeriod: received,
    receivedPreviousPeriod: previous,
    expensesThisPeriod: expenses,
    netCashMovement: expenses === null ? null : round2(received - expenses),
    basis:
      "Cash basis from recorded payments only; not accounting revenue, not a bank balance. Expenses come from the ERP expenses table when readable.",
  };
}

/** Start of the IST calendar month containing `reference`, and the previous month start. */
export function istMonthBounds(reference: Date): { start: string; end: string; previousStart: string } {
  const IST = 330 * 60 * 1000;
  const shifted = new Date(reference.getTime() + IST);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1) - IST);
  const end = new Date(Date.UTC(y, m + 1, 1) - IST);
  const previousStart = new Date(Date.UTC(y, m - 1, 1) - IST);
  return { start: start.toISOString(), end: end.toISOString(), previousStart: previousStart.toISOString() };
}
