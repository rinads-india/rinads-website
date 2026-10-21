import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildRiDecisionQueue,
  buildRiIntelligenceFrame,
  evaluateRiAuthorization,
  rankRiRecommendations,
  scoreRiRecommendation,
  type RiRecommendation,
} from "../src/index";

const readRecommendation: RiRecommendation = {
  id: "read",
  title: "Review pipeline",
  rationale: "Pipeline coverage is below target.",
  impactScore: 70,
  urgencyScore: 70,
  confidence: 0.9,
  risk: "low",
  evidence: [{ source: "metric", metricKey: "sales.pipeline_coverage" }],
  action: { category: "READ", toolKey: "sales_pipeline_summary" },
};

const lowRiskAction: RiRecommendation = {
  id: "followup",
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
    category: "ACTION",
    toolKey: "initiate_refund",
    financialSideEffect: true,
    refundOrPayout: true,
  },
};

describe("RINADS Intelligence v1", () => {
  it("permits read-only intelligence at autonomy level 0", () => {
    const authorization = evaluateRiAuthorization({
      autonomyLevel: 0,
      category: "READ",
      risk: "low",
    });
    assert.equal(authorization.allowed, true);
    assert.equal(authorization.requiresApproval, false);
  });

  it("blocks actions below approve-to-act level", () => {
    const authorization = evaluateRiAuthorization({
      autonomyLevel: 2,
      category: "ACTION",
      risk: "low",
      action: lowRiskAction.action,
    });
    assert.equal(authorization.allowed, false);
  });

  it("requires approval for level-3 actions", () => {
    const authorization = evaluateRiAuthorization({
      autonomyLevel: 3,
      category: "ACTION",
      risk: "low",
      action: lowRiskAction.action,
    });
    assert.equal(authorization.allowed, true);
    assert.equal(authorization.requiresApproval, true);
  });

  it("allows low-risk level-4 actions without approval", () => {
    const authorization = evaluateRiAuthorization({
      autonomyLevel: 4,
      category: "ACTION",
      risk: "low",
      action: lowRiskAction.action,
    });
    assert.equal(authorization.allowed, true);
    assert.equal(authorization.requiresApproval, false);
  });

  it("keeps sensitive finance mutations behind explicit approval", () => {
    const authorization = evaluateRiAuthorization({
      autonomyLevel: 5,
      category: "ACTION",
      risk: "medium",
      action: financeAction.action,
    });
    assert.equal(authorization.allowed, true);
    assert.equal(authorization.requiresApproval, true);
  });

  it("hard-blocks critical-risk actions", () => {
    const authorization = evaluateRiAuthorization({
      autonomyLevel: 5,
      category: "ACTION",
      risk: "critical",
      action: { category: "ACTION" },
    });
    assert.equal(authorization.allowed, false);
  });

  it("ranks recommendations deterministically", () => {
    const ranked = rankRiRecommendations([readRecommendation, lowRiskAction]);
    assert.equal(ranked[0]?.id, "followup");
    assert.ok(scoreRiRecommendation(ranked[0]!) > scoreRiRecommendation(ranked[1]!));
  });

  it("builds a founder decision queue only for blocked or approval-required work", () => {
    const decisions = buildRiDecisionQueue({
      recommendations: [readRecommendation, lowRiskAction, financeAction],
      autonomyLevel: 4,
    });
    assert.deepEqual(
      decisions.map((item) => item.recommendationId),
      ["refund"]
    );
  });

  it("builds an inspectable intelligence frame", () => {
    const frame = buildRiIntelligenceFrame({
      scope: { organizationId: "org_1", roleKey: "founder" },
      autonomyLevel: 3,
      recommendations: [lowRiskAction],
      generatedAt: "2026-10-22T00:00:00.000Z",
    });
    assert.equal(frame.generatedAt, "2026-10-22T00:00:00.000Z");
    assert.equal(frame.recommendations[0]?.id, "followup");
    assert.equal(frame.decisions[0]?.authorization.requiresApproval, true);
  });
});
