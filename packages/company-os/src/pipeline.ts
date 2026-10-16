import { DEFAULT_STAGE_PROBABILITY, type OpportunityStage } from "./lifecycle";
import { daysBetween, round2 } from "./types";

export type OpportunityFact = {
  id: string;
  title: string;
  companyId: string | null;
  companyName?: string | null;
  stage: OpportunityStage;
  /** Expected contract value in major currency units; null when not yet priced. */
  amount: number | null;
  /** Explicit 0–100 probability set by a human; null → stage default is used and labelled. */
  probability: number | null;
  expectedCloseDate: string | null;
  ownerId: string | null;
  stageChangedAt: string | null;
  updatedAt: string;
};

export type PipelineStageRow = {
  stage: OpportunityStage;
  count: number;
  pricedCount: number;
  totalValue: number;
  weightedValue: number;
};

export type PipelineSummary = {
  openCount: number;
  pricedCount: number;
  /** Open opportunities with no amount: counted but excluded from value math. */
  unpricedCount: number;
  totalOpenValue: number;
  weightedValue: number;
  /** How many weighted amounts rely on a stage default rather than a human probability. */
  weightedByStageDefault: number;
  weightedByExplicitProbability: number;
  byStage: PipelineStageRow[];
  overdueClose: OpportunityFact[];
  stalled: OpportunityFact[];
  wonValueThisPeriod: number | null;
  basis: string;
};

const OPEN_STAGES: OpportunityStage[] = ["discovery", "solution", "proposal", "negotiation"];
export const STALLED_AFTER_DAYS = 14;

export function effectiveProbability(opp: Pick<OpportunityFact, "stage" | "probability">): {
  probability: number;
  basis: "explicit" | "stage_default";
} {
  if (opp.probability !== null && opp.probability !== undefined) {
    return { probability: Math.max(0, Math.min(100, opp.probability)), basis: "explicit" };
  }
  return { probability: DEFAULT_STAGE_PROBABILITY[opp.stage], basis: "stage_default" };
}

export function summarizePipeline(
  opportunities: readonly OpportunityFact[],
  now: Date,
  options: { periodStart?: string; periodEnd?: string } = {}
): PipelineSummary {
  const open = opportunities.filter((o) => OPEN_STAGES.includes(o.stage));
  const byStage = OPEN_STAGES.map<PipelineStageRow>((stage) => ({
    stage,
    count: 0,
    pricedCount: 0,
    totalValue: 0,
    weightedValue: 0,
  }));

  let weighted = 0;
  let total = 0;
  let priced = 0;
  let byDefault = 0;
  let byExplicit = 0;

  for (const opp of open) {
    const row = byStage.find((r) => r.stage === opp.stage)!;
    row.count += 1;
    if (opp.amount === null || opp.amount === undefined) continue;
    const { probability, basis } = effectiveProbability(opp);
    const weightedAmount = (opp.amount * probability) / 100;
    row.pricedCount += 1;
    row.totalValue += opp.amount;
    row.weightedValue += weightedAmount;
    priced += 1;
    total += opp.amount;
    weighted += weightedAmount;
    if (basis === "explicit") byExplicit += 1;
    else byDefault += 1;
  }

  let wonValue: number | null = null;
  if (options.periodStart && options.periodEnd) {
    wonValue = round2(
      opportunities
        .filter(
          (o) =>
            o.stage === "won" &&
            o.amount !== null &&
            (o.stageChangedAt ?? o.updatedAt) >= options.periodStart! &&
            (o.stageChangedAt ?? o.updatedAt) < options.periodEnd!
        )
        .reduce((sum, o) => sum + (o.amount ?? 0), 0)
    );
  }

  const overdueClose = open.filter(
    (o) => o.expectedCloseDate !== null && new Date(o.expectedCloseDate).getTime() < now.getTime()
  );
  const stalled = open.filter(
    (o) => daysBetween(o.stageChangedAt ?? o.updatedAt, now) >= STALLED_AFTER_DAYS
  );

  return {
    openCount: open.length,
    pricedCount: priced,
    unpricedCount: open.length - priced,
    totalOpenValue: round2(total),
    weightedValue: round2(weighted),
    weightedByStageDefault: byDefault,
    weightedByExplicitProbability: byExplicit,
    byStage: byStage.map((r) => ({
      ...r,
      totalValue: round2(r.totalValue),
      weightedValue: round2(r.weightedValue),
    })),
    overdueClose,
    stalled,
    wonValueThisPeriod: wonValue,
    basis:
      byDefault > 0
        ? `Weighted value uses human probabilities on ${byExplicit} deal(s) and documented stage defaults on ${byDefault} deal(s); defaults are not measured win rates.`
        : byExplicit > 0
          ? `Weighted value uses human-entered probabilities on ${byExplicit} deal(s).`
          : "No priced open opportunities.",
  };
}
