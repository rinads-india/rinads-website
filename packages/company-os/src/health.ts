/**
 * Client health score — only from available signals; transparent formula.
 * Returns null when insufficient data (never invent).
 */
export type ClientHealthSignals = {
  overdueInvoiceCount?: number;
  openProjectAtRiskCount?: number;
  openSupportIssueCount?: number;
  pendingApprovalCount?: number;
  daysToRenewal?: number | null;
  engagementScore01?: number | null;
};

export type ClientHealthResult = {
  score: number;
  band: "healthy" | "watch" | "at_risk" | "critical";
  formula: string;
  components: Array<{ key: string; weight: number; value: number; note: string }>;
};

export function computeClientHealth(signals: ClientHealthSignals): ClientHealthResult | null {
  const components: ClientHealthResult["components"] = [];
  let weightSum = 0;
  let scoreSum = 0;

  const add = (key: string, weight: number, value: number, note: string) => {
    const v = Math.max(0, Math.min(100, value));
    components.push({ key, weight, value: v, note });
    weightSum += weight;
    scoreSum += v * weight;
  };

  if (signals.overdueInvoiceCount !== undefined) {
    const v = Math.max(0, 100 - signals.overdueInvoiceCount * 25);
    add("payments", 0.25, v, `${signals.overdueInvoiceCount} overdue invoice(s)`);
  }
  if (signals.openProjectAtRiskCount !== undefined) {
    const v = Math.max(0, 100 - signals.openProjectAtRiskCount * 30);
    add("projects", 0.25, v, `${signals.openProjectAtRiskCount} at-risk project(s)`);
  }
  if (signals.openSupportIssueCount !== undefined) {
    const v = Math.max(0, 100 - signals.openSupportIssueCount * 15);
    add("support", 0.15, v, `${signals.openSupportIssueCount} open support issue(s)`);
  }
  if (signals.pendingApprovalCount !== undefined) {
    const v = Math.max(0, 100 - signals.pendingApprovalCount * 10);
    add("approvals", 0.1, v, `${signals.pendingApprovalCount} pending approval(s)`);
  }
  if (signals.engagementScore01 != null) {
    add("engagement", 0.15, signals.engagementScore01 * 100, "Engagement signal 0–1");
  }
  if (signals.daysToRenewal != null) {
    const v = signals.daysToRenewal < 30 ? 55 : signals.daysToRenewal < 90 ? 75 : 90;
    add("renewal", 0.1, v, `${signals.daysToRenewal} days to renewal`);
  }

  if (weightSum <= 0) return null;

  const score = Math.round(scoreSum / weightSum);
  const band =
    score >= 80 ? "healthy" : score >= 60 ? "watch" : score >= 40 ? "at_risk" : "critical";

  return {
    score,
    band,
    formula:
      "Weighted average of available signals (payments, projects, support, approvals, engagement, renewal). Missing signals are omitted — never invented.",
    components,
  };
}
