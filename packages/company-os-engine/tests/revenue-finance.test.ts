import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  agingBucket,
  derivedInvoiceStatus,
  effectiveProbability,
  istMonthBounds,
  summarizeCash,
  summarizePipeline,
  summarizeReceivables,
  type InvoiceFact,
  type OpportunityFact,
  type PaymentFact,
} from "../src";
import { NOW, daysAgo, daysAhead } from "./fixtures";

const opp = (o: Partial<OpportunityFact> & Pick<OpportunityFact, "id" | "stage">): OpportunityFact => ({
  title: `Deal ${o.id}`,
  companyId: "c1",
  amount: null,
  probability: null,
  expectedCloseDate: null,
  ownerId: null,
  stageChangedAt: daysAgo(1),
  updatedAt: daysAgo(1),
  ...o,
});

describe("weighted pipeline", () => {
  it("weights by explicit probability first, stage default second, and labels the basis", () => {
    const p = summarizePipeline(
      [
        opp({ id: "a", stage: "proposal", amount: 1000, probability: 80 }), // 800 explicit
        opp({ id: "b", stage: "solution", amount: 2000 }), // 25% default => 500
        opp({ id: "c", stage: "discovery" }), // unpriced
      ],
      NOW
    );
    assert.equal(p.openCount, 3);
    assert.equal(p.pricedCount, 2);
    assert.equal(p.unpricedCount, 1);
    assert.equal(p.totalOpenValue, 3000);
    assert.equal(p.weightedValue, 1300);
    assert.equal(p.weightedByExplicitProbability, 1);
    assert.equal(p.weightedByStageDefault, 1);
    assert.match(p.basis, /stage defaults/);
    assert.match(p.basis, /not measured win rates/);
  });

  it("excludes won/lost from the open pipeline and reports won value for the period", () => {
    const p = summarizePipeline(
      [
        opp({ id: "w", stage: "won", amount: 5000, stageChangedAt: "2026-10-05T00:00:00.000Z" }),
        opp({ id: "w-old", stage: "won", amount: 9000, stageChangedAt: "2026-08-05T00:00:00.000Z" }),
        opp({ id: "l", stage: "lost", amount: 700 }),
        opp({ id: "o", stage: "negotiation", amount: 100 }),
      ],
      NOW,
      { periodStart: "2026-09-30T18:30:00.000Z", periodEnd: "2026-10-31T18:30:00.000Z" }
    );
    assert.equal(p.openCount, 1);
    assert.equal(p.wonValueThisPeriod, 5000);
  });

  it("flags stalled and overdue-close deals and clamps probabilities", () => {
    const p = summarizePipeline(
      [opp({ id: "s", stage: "proposal", amount: 10, stageChangedAt: daysAgo(20), updatedAt: daysAgo(20) }), opp({ id: "d", stage: "solution", amount: 10, expectedCloseDate: daysAgo(2) })],
      NOW
    );
    assert.deepEqual(p.stalled.map((o) => o.id), ["s"]);
    assert.deepEqual(p.overdueClose.map((o) => o.id), ["d"]);
    assert.equal(effectiveProbability({ stage: "solution", probability: 250 }).probability, 100);
    assert.equal(effectiveProbability({ stage: "solution", probability: -5 }).probability, 0);
    assert.equal(effectiveProbability({ stage: "solution", probability: null }).basis, "stage_default");
  });

  it("returns zeros, not NaN, for an empty pipeline", () => {
    const p = summarizePipeline([], NOW);
    assert.equal(p.weightedValue, 0);
    assert.equal(p.openCount, 0);
    assert.match(p.basis, /No priced/);
  });
});

const inv = (i: Partial<InvoiceFact> & Pick<InvoiceFact, "id">): InvoiceFact => ({
  number: `INV-${i.id}`,
  companyId: "c1",
  companyName: "Acme",
  projectId: null,
  status: "issued",
  issueDate: daysAgo(40),
  dueDate: daysAgo(10),
  total: 1000,
  currency: "INR",
  ...i,
});
const pay = (p: Partial<PaymentFact> & Pick<PaymentFact, "id" | "amount">): PaymentFact => ({ invoiceId: null, currency: "INR", receivedAt: daysAgo(1), ...p });

describe("receivables", () => {
  it("computes outstanding, overdue days and aging buckets from payments", () => {
    const r = summarizeReceivables(
      [
        inv({ id: "1", total: 1000, dueDate: daysAgo(10) }),
        inv({ id: "2", total: 500, dueDate: daysAgo(45) }),
        inv({ id: "3", total: 300, dueDate: daysAhead(5) }),
        inv({ id: "4", total: 100, dueDate: daysAgo(100) }),
        inv({ id: "5", status: "paid", total: 999 }),
        inv({ id: "6", status: "draft", total: 999 }),
        inv({ id: "7", status: "void", total: 999 }),
      ],
      [pay({ id: "p1", invoiceId: "1", amount: 400 }), pay({ id: "p2", invoiceId: "4", amount: 100 })],
      NOW
    );
    assert.equal(r.rows.length, 3, "fully paid, draft, void invoices excluded");
    assert.equal(r.totalOutstanding, 600 + 500 + 300);
    assert.equal(r.totalOverdue, 600 + 500);
    assert.equal(r.overdueCount, 2);
    assert.equal(r.buckets["1-30"], 600);
    assert.equal(r.buckets["31-60"], 500);
    assert.equal(r.buckets.current, 300);
    assert.equal(r.buckets["90+"], 0, "fully paid 90+ invoice is not outstanding");
    assert.equal(r.mixedCurrency, false);
  });

  it("flags mixed currency instead of silently adding", () => {
    const r = summarizeReceivables([inv({ id: "1", currency: "INR" }), inv({ id: "2", currency: "USD" })], [], NOW);
    assert.equal(r.mixedCurrency, true);
    assert.deepEqual(r.currencies.sort(), ["INR", "USD"]);
  });

  it("derives overdue status, never stores it", () => {
    assert.equal(derivedInvoiceStatus({ status: "issued", dueDate: daysAgo(1) }, 100, NOW), "overdue");
    assert.equal(derivedInvoiceStatus({ status: "issued", dueDate: daysAhead(1) }, 100, NOW), "issued");
    assert.equal(derivedInvoiceStatus({ status: "issued", dueDate: daysAgo(1) }, 0, NOW), "issued");
    assert.equal(derivedInvoiceStatus({ status: "draft", dueDate: daysAgo(1) }, 100, NOW), "draft");
  });

  it("bucket boundaries", () => {
    assert.equal(agingBucket(0), "current");
    assert.equal(agingBucket(1), "1-30");
    assert.equal(agingBucket(30), "1-30");
    assert.equal(agingBucket(31), "31-60");
    assert.equal(agingBucket(61), "61-90");
    assert.equal(agingBucket(91), "90+");
  });
});

describe("cash summary", () => {
  it("is cash-basis on recorded payments, labels itself, and nets expenses only when readable", () => {
    const m = istMonthBounds(NOW);
    const withExp = summarizeCash({
      payments: [pay({ id: "a", amount: 1000, receivedAt: "2026-10-03T00:00:00.000Z" }), pay({ id: "b", amount: 400, receivedAt: "2026-09-10T00:00:00.000Z" })],
      expenses: [{ id: "e", amount: 250, incurredAt: "2026-10-04T00:00:00.000Z" }],
      periodStart: m.start,
      periodEnd: m.end,
      previousPeriodStart: m.previousStart,
    });
    assert.equal(withExp.receivedThisPeriod, 1000);
    assert.equal(withExp.receivedPreviousPeriod, 400);
    assert.equal(withExp.netCashMovement, 750);
    assert.match(withExp.basis, /not accounting revenue/);

    const noExp = summarizeCash({ payments: [], expenses: null, periodStart: m.start, periodEnd: m.end, previousPeriodStart: m.previousStart });
    assert.equal(noExp.expensesThisPeriod, null);
    assert.equal(noExp.netCashMovement, null, "no expenses data => no net figure");
  });

  it("IST month bounds are correct around the UTC boundary", () => {
    const m = istMonthBounds(new Date("2026-10-31T19:00:00.000Z")); // already Nov 1 in IST
    assert.equal(m.start, "2026-10-31T18:30:00.000Z");
    assert.equal(m.end, "2026-11-30T18:30:00.000Z");
  });
});
