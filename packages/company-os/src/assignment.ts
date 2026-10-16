/**
 * Intelligent work allocation score (recommendation only — managers may override).
 * Score = product of normalized factors in [0, 1] (zeros collapse recommendation).
 */
export type AssignmentFactors = {
  skillMatch: number;
  availability: number;
  currentCapacity: number;
  deadlineUrgency: number;
  clientPriority: number;
  historicalDeliveryQuality: number;
  costEfficiency: number;
  dependencyFit: number;
};

export type AssignmentRecommendation = {
  workerId: string;
  displayName: string;
  score: number;
  factors: AssignmentFactors;
};

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function scoreAssignee(factors: AssignmentFactors): number {
  const values = [
    factors.skillMatch,
    factors.availability,
    factors.currentCapacity,
    factors.deadlineUrgency,
    factors.clientPriority,
    factors.historicalDeliveryQuality,
    factors.costEfficiency,
    factors.dependencyFit,
  ].map(clamp01);

  return values.reduce((acc, v) => acc * v, 1);
}

export function rankAssignees(
  candidates: Array<{ workerId: string; displayName: string; factors: AssignmentFactors }>,
): AssignmentRecommendation[] {
  return candidates
    .map((c) => ({
      workerId: c.workerId,
      displayName: c.displayName,
      factors: c.factors,
      score: scoreAssignee(c.factors),
    }))
    .sort((a, b) => b.score - a.score);
}

/** Capacity utilization 0–1 from hours; returns remaining capacity score (1 = free). */
export function capacityScore(availableHours: number, committedHours: number): number {
  if (availableHours <= 0) return 0;
  const util = committedHours / availableHours;
  return clamp01(1 - util);
}
