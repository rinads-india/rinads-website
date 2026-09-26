/**
 * Pure organization health-score model shared by the `health-check` Edge
 * Function and its unit tests. Deliberately free of Deno/Node globals so it
 * can be imported by the Deno runtime and by `node --test` alike.
 *
 * The score is a deterministic 0–100 composite of measurable signals. It is
 * intentionally conservative: missing signals pull the score toward a neutral
 * baseline rather than inventing confidence. This mirrors the platform's
 * "honest states" policy — never fabricate a healthy score when we lack data.
 */

export type OrganizationHealthSignals = {
  /** Count of invoices past their due date. Higher is worse. */
  overdueInvoices?: number;
  /** Days since the most recent meaningful account activity. Higher is worse. */
  daysSinceLastActivity?: number;
  /** Count of service orders currently open/in-progress. */
  openServiceOrders?: number;
  /** Count of unresolved support tickets. Higher is worse. */
  openSupportTickets?: number;
  /** Count of failed payments in the trailing window. Higher is worse. */
  failedPayments?: number;
};

export type OrganizationHealthResult = {
  score: number;
  band: "healthy" | "watch" | "at_risk";
  /** Per-signal contribution breakdown for observability (never fabricated). */
  signals: Record<string, number>;
  /** True when no measurable signal was supplied — score is the neutral baseline. */
  neutralBaseline: boolean;
};

const NEUTRAL_BASELINE = 70;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Coerce an unknown numeric signal into a non-negative finite number. */
function normalizeCount(value: number | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

/**
 * Compute a deterministic health score from measurable signals.
 *
 * Weighting rationale (documented so the model is auditable, per ADR intent):
 * - overdue invoices and failed payments are the strongest negative signals;
 * - inactivity degrades health gradually;
 * - open service orders are mildly positive (engagement) but capped;
 * - unresolved support tickets are a moderate negative signal.
 */
export function computeOrganizationHealthScore(
  signals: OrganizationHealthSignals,
): OrganizationHealthResult {
  const overdue = normalizeCount(signals.overdueInvoices);
  const inactivity = normalizeCount(signals.daysSinceLastActivity);
  const openOrders = normalizeCount(signals.openServiceOrders);
  const tickets = normalizeCount(signals.openSupportTickets);
  const failed = normalizeCount(signals.failedPayments);

  const provided = [overdue, inactivity, openOrders, tickets, failed].filter(
    (value): value is number => value !== null,
  );

  if (provided.length === 0) {
    return {
      score: NEUTRAL_BASELINE,
      band: "watch",
      signals: {},
      neutralBaseline: true,
    };
  }

  const contributions: Record<string, number> = {};

  let score = 100;

  if (overdue !== null) {
    const penalty = clamp(overdue * 8, 0, 40);
    contributions.overdueInvoices = penalty ? -penalty : 0;
    score -= penalty;
  }
  if (failed !== null) {
    const penalty = clamp(failed * 10, 0, 30);
    contributions.failedPayments = penalty ? -penalty : 0;
    score -= penalty;
  }
  if (inactivity !== null) {
    // No penalty for the first week; then ~1.5 points/day up to a cap.
    const penalty = clamp((inactivity - 7) * 1.5, 0, 25);
    contributions.daysSinceLastActivity = penalty ? -penalty : 0;
    score -= penalty;
  }
  if (tickets !== null) {
    const penalty = clamp(tickets * 4, 0, 20);
    contributions.openSupportTickets = penalty ? -penalty : 0;
    score -= penalty;
  }
  if (openOrders !== null) {
    const bonus = clamp(openOrders * 2, 0, 10);
    contributions.openServiceOrders = bonus;
    score += bonus;
  }

  score = Math.round(clamp(score, 0, 100));

  const band: OrganizationHealthResult["band"] =
    score >= 75 ? "healthy" : score >= 50 ? "watch" : "at_risk";

  return { score, band, signals: contributions, neutralBaseline: false };
}
