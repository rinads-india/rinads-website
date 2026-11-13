import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RiMetricRegistry,
  RiRecommendationRegistry,
  assertRiDecisionTransition,
  buildRiDecisionQueue,
  collectRiSignals,
  defaultRiRecommendationRegistry,
  evaluateRiAuthorization,
  isRiDecisionTerminal,
  rankRiRecommendations,
  scoreRiRecommendation,
  type RiMetricDefinition,
  type RiRecommendation,
  type RiSignalProvider,
} from "../src/index";

const lowRiskAction: RiRecommendation = {
  id: "followup",
  key: "sales.followup",
  dedupeKey: "sales.followup",
  title: "Prepare stale lead follow-up",
  rationale: "Seven qualified leads have no next action.",
  impactScore: 90,
  urgencyScore: 85,
  confidence: 0.95,
  risk: "low",
  evidence: [{ source: "crm", entityType: "lead", summary: "7 stale qualified leads" }],
  action: { category: "ACTION", toolKey: "send_followup", externalSideEffect: true },
};

const financeAction: RiRecommendation = {
  id: "refund",
  title: "Issue customer refund",
  rationale: "Approved service recovery requires a refund.",
  impactScore: 75,
  urgencyScore: 90,
  confidence: 0.95,
  risk: "medium",
  evidence: [{ source: "payment", entityType: "invoice", entityId: "inv_1" }],
  action: {
    category: "SENSITIVE",
    toolKey: "initiate_refund",
    financialSideEffect: true,
    refundOrPayout: true,
  },
};

describe("RINADS Intelligence v1 core", () => {
  it("permits READ at autonomy 0 and approval-gates SENSITIVE actions", () => {
    const read = evaluateRiAuthorization({ autonomyLevel: 0, category: "READ", risk: "low" });
    assert.equal(read.allowed, true);
    assert.equal(read.requiresApproval, false);

    const sensitive = evaluateRiAuthorization({
      autonomyLevel: 5,
      category: "SENSITIVE",
      risk: "medium",
      action: financeAction.action,
    });
    assert.equal(sensitive.allowed, true);
    assert.equal(sensitive.requiresApproval, true);
  });

  it("ranks recommendations deterministically and creates approval decisions", () => {
    const ranked = rankRiRecommendations([financeAction, lowRiskAction]);
    assert.equal(ranked[0]?.id, "followup");
    assert.ok(scoreRiRecommendation(ranked[0]!) > scoreRiRecommendation(ranked[1]!));

    const decisions = buildRiDecisionQueue({
      recommendations: [lowRiskAction, financeAction],
      autonomyLevel: 4,
    });
    assert.deepEqual(decisions.map((decision) => decision.recommendationId), ["refund"]);
  });

  it("rejects duplicate metric keys and supports industry filters", () => {
    const salonMetric: RiMetricDefinition = {
      key: "salon.test_metric",
      label: "Test metric",
      description: "Test",
      domain: "salon",
      valueType: "count",
      timeGrain: "daily",
      sourceProviderKey: "salon",
      industries: ["salon"],
    };
    const registry = new RiMetricRegistry([salonMetric]);
    assert.equal(registry.list({ industryKey: "salon" }).length, 1);
    assert.equal(registry.list({ industryKey: "jewellery" }).length, 0);
    assert.throws(() => registry.register(salonMetric), /already registered/);
  });

  it("isolates signal provider failures instead of failing the intelligence cycle", async () => {
    const good: RiSignalProvider = {
      key: "good",
      async collect() {
        return [{
          id: "signal:1",
          key: "inventory.low_stock_count",
          title: "Low stock",
          value: 3,
          evidence: [{ source: "inventory" }],
        }];
      },
    };
    const bad: RiSignalProvider = {
      key: "bad",
      async collect() {
        throw new Error("provider unavailable");
      },
    };
    const failures: string[] = [];
    const signals = await collectRiSignals({
      providers: [bad, good],
      context: { scope: { organizationId: "org_1" }, now: "2026-10-22T00:00:00.000Z" },
      onFailure: ({ providerKey }) => failures.push(providerKey),
    });
    assert.equal(signals.length, 1);
    assert.deepEqual(failures, ["bad"]);
  });

  it("creates deterministic recommendations from registered signals", () => {
    const recommendations = defaultRiRecommendationRegistry.evaluate({
      scope: { organizationId: "org_1", industryKey: "salon" },
      signals: [{
        id: "signal:low-stock",
        key: "inventory.low_stock_count",
        title: "Low stock",
        value: 4,
        evidence: [{ source: "inventory", metricKey: "inventory.low_stock_count" }],
      }],
    });
    assert.equal(recommendations[0]?.key, "inventory.review_low_stock");
    assert.equal(recommendations[0]?.action?.toolKey, "ops_low_stock");
  });

  it("supports custom recommendation registries", () => {
    const registry = new RiRecommendationRegistry([{
      key: "test.recommendation",
      title: "Test",
      description: "Test recommendation",
      defaultRisk: "low",
      requiredSignalKeys: ["test.signal"],
      evaluate(context) {
        const signal = context.signals.find((item) => item.key === "test.signal");
        if (!signal) return null;
        return {
          id: "recommendation:test",
          key: "test.recommendation",
          title: "Test recommendation",
          rationale: "Test signal exists.",
          impactScore: 50,
          urgencyScore: 50,
          confidence: 1,
          risk: "low",
          evidence: signal.evidence,
        };
      },
    }]);
    assert.equal(registry.evaluate({
      scope: { organizationId: "org_1" },
      signals: [{ id: "s", key: "test.signal", title: "Test", evidence: [] }],
    }).length, 1);
  });

  it("enforces the decision lifecycle", () => {
    assert.doesNotThrow(() => assertRiDecisionTransition("PROPOSED", "APPROVED"));
    assert.throws(() => assertRiDecisionTransition("REJECTED", "APPROVED"), /Invalid RI decision transition/);
    assert.equal(isRiDecisionTerminal("EXECUTED"), true);
    assert.equal(isRiDecisionTerminal("DELEGATED"), false);
  });
});
