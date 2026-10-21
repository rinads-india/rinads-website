import { evaluateRiAuthorization } from "./ri-policy";
import type {
  RiAutonomyLevel,
  RiDecisionItem,
  RiIntelligenceFrame,
  RiRecommendation,
  RiRiskLevel,
  RiScope,
  RiSignal,
  RiFinding,
} from "./ri-types";

const RISK_PENALTY: Record<RiRiskLevel, number> = {
  low: 0,
  medium: 5,
  high: 15,
  critical: 30,
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clamp100(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Deterministic priority score. LLMs may propose recommendations, but ranking
 * remains inspectable and reproducible in RI v1.
 */
export function scoreRiRecommendation(recommendation: RiRecommendation): number {
  const impact = clamp100(recommendation.impactScore);
  const urgency = clamp100(recommendation.urgencyScore);
  const confidence = clamp01(recommendation.confidence) * 100;
  const weighted = impact * 0.45 + urgency * 0.35 + confidence * 0.2;
  return Math.round(Math.max(0, weighted - RISK_PENALTY[recommendation.risk]));
}

export function rankRiRecommendations(
  recommendations: RiRecommendation[]
): RiRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const scoreDiff = scoreRiRecommendation(b) - scoreRiRecommendation(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.id.localeCompare(b.id);
  });
}

export function buildRiDecisionQueue(input: {
  recommendations: RiRecommendation[];
  autonomyLevel: RiAutonomyLevel;
}): RiDecisionItem[] {
  return rankRiRecommendations(input.recommendations)
    .filter((recommendation) => Boolean(recommendation.action))
    .map((recommendation) => {
      const action = recommendation.action!;
      const authorization = evaluateRiAuthorization({
        autonomyLevel: input.autonomyLevel,
        category: action.category,
        risk: recommendation.risk,
        action,
      });

      return {
        id: `decision:${recommendation.id}`,
        recommendationId: recommendation.id,
        title: recommendation.title,
        rationale: recommendation.rationale,
        risk: recommendation.risk,
        priorityScore: scoreRiRecommendation(recommendation),
        authorization,
        evidence: recommendation.evidence,
      } satisfies RiDecisionItem;
    })
    .filter((decision) => !decision.authorization.allowed || decision.authorization.requiresApproval);
}

export function buildRiIntelligenceFrame(input: {
  scope: RiScope;
  autonomyLevel: RiAutonomyLevel;
  signals?: RiSignal[];
  findings?: RiFinding[];
  recommendations?: RiRecommendation[];
  generatedAt?: string;
}): RiIntelligenceFrame {
  const recommendations = rankRiRecommendations(input.recommendations ?? []);

  return {
    scope: input.scope,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    signals: input.signals ?? [],
    findings: input.findings ?? [],
    recommendations,
    decisions: buildRiDecisionQueue({
      recommendations,
      autonomyLevel: input.autonomyLevel,
    }),
  };
}
