import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeOrganizationHealthScore,
} from "../../../supabase/functions/_shared/health-score";
import {
  buildMorningDigest,
  summarizeDigests,
} from "../../../supabase/functions/_shared/morning-digest";

describe("organization health score", () => {
  it("returns a neutral watch baseline when no signals are provided", () => {
    const result = computeOrganizationHealthScore({});
    assert.equal(result.neutralBaseline, true);
    assert.equal(result.score, 70);
    assert.equal(result.band, "watch");
    assert.deepEqual(result.signals, {});
  });

  it("scores a clean organization as healthy", () => {
    const result = computeOrganizationHealthScore({
      overdueInvoices: 0,
      failedPayments: 0,
      daysSinceLastActivity: 2,
      openSupportTickets: 0,
      openServiceOrders: 3,
    });
    assert.equal(result.neutralBaseline, false);
    assert.ok(result.score >= 75, `expected healthy score, got ${result.score}`);
    assert.equal(result.band, "healthy");
  });

  it("drives an organization with heavy negative signals to at_risk", () => {
    const result = computeOrganizationHealthScore({
      overdueInvoices: 6,
      failedPayments: 4,
      daysSinceLastActivity: 30,
      openSupportTickets: 5,
    });
    assert.ok(result.score < 50, `expected at_risk score, got ${result.score}`);
    assert.equal(result.band, "at_risk");
  });

  it("clamps into 0..100 and never fabricates NaN from bad input", () => {
    const result = computeOrganizationHealthScore({
      overdueInvoices: Number.NaN,
      failedPayments: 9999,
    });
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(Number.isFinite(result.score));
  });

  it("does not penalize inactivity within the first week", () => {
    const within = computeOrganizationHealthScore({ daysSinceLastActivity: 5 });
    assert.equal(within.signals.daysSinceLastActivity, 0);
  });
});

describe("morning digest builder", () => {
  it("produces no items when there is nothing actionable", () => {
    const items = buildMorningDigest({ organizationId: "org_1" });
    assert.deepEqual(items, []);
  });

  it("emits one warning item per non-zero operational signal", () => {
    const items = buildMorningDigest({
      organizationId: "org_1",
      overdueInvoices: 2,
      staleLeads: 1,
      atRiskProjects: 3,
      appointmentsToday: 4,
    });
    const kinds = items.map((i) => i.kind).sort();
    assert.deepEqual(kinds, [
      "appointments_today",
      "at_risk_projects",
      "overdue_invoices",
      "stale_leads",
    ]);
    const overdue = items.find((i) => i.kind === "overdue_invoices");
    assert.equal(overdue?.severity, "warning");
    assert.match(overdue?.message ?? "", /2 invoices past due/);
    const appts = items.find((i) => i.kind === "appointments_today");
    assert.equal(appts?.severity, "info");
  });

  it("uses singular phrasing for a count of one", () => {
    const items = buildMorningDigest({ organizationId: "org_1", overdueInvoices: 1 });
    assert.match(items[0].message, /1 invoice past due/);
  });

  it("summarizes a batch of per-org digests", () => {
    const summary = summarizeDigests([
      buildMorningDigest({ organizationId: "a", overdueInvoices: 2 }),
      buildMorningDigest({ organizationId: "b" }),
      buildMorningDigest({ organizationId: "c", staleLeads: 1, atRiskProjects: 1 }),
    ]);
    assert.equal(summary.organizationsProcessed, 3);
    assert.equal(summary.organizationsWithItems, 2);
    assert.equal(summary.totalItems, 3);
  });
});
