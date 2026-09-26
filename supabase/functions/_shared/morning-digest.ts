/**
 * Pure morning-digest builder shared by the `morning-digest` Edge Function
 * and its unit tests. No Deno/Node globals — safe to import from both.
 *
 * The digest turns per-organization operational signals into a small set of
 * notification-outbox items. It never invents work: an organization with no
 * actionable signals produces zero items (an honest "nothing to report").
 */

export type MorningDigestSignals = {
  organizationId: string;
  overdueInvoices?: number;
  staleLeads?: number;
  atRiskProjects?: number;
  appointmentsToday?: number;
};

export type DigestItem = {
  organizationId: string;
  kind:
    | "overdue_invoices"
    | "stale_leads"
    | "at_risk_projects"
    | "appointments_today";
  severity: "info" | "warning";
  count: number;
  message: string;
};

function count(value: number | undefined): number {
  if (value === undefined || value === null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

/**
 * Build the outbox items for a single organization. Returns an empty array
 * when there is nothing actionable — callers must not synthesize a message.
 */
export function buildMorningDigest(signals: MorningDigestSignals): DigestItem[] {
  const items: DigestItem[] = [];
  const org = signals.organizationId;

  const overdue = count(signals.overdueInvoices);
  if (overdue > 0) {
    items.push({
      organizationId: org,
      kind: "overdue_invoices",
      severity: "warning",
      count: overdue,
      message: `${overdue} invoice${overdue === 1 ? "" : "s"} past due need follow-up.`,
    });
  }

  const stale = count(signals.staleLeads);
  if (stale > 0) {
    items.push({
      organizationId: org,
      kind: "stale_leads",
      severity: "warning",
      count: stale,
      message: `${stale} lead${stale === 1 ? "" : "s"} have had no activity recently.`,
    });
  }

  const atRisk = count(signals.atRiskProjects);
  if (atRisk > 0) {
    items.push({
      organizationId: org,
      kind: "at_risk_projects",
      severity: "warning",
      count: atRisk,
      message: `${atRisk} project${atRisk === 1 ? "" : "s"} are at risk and need attention.`,
    });
  }

  const appts = count(signals.appointmentsToday);
  if (appts > 0) {
    items.push({
      organizationId: org,
      kind: "appointments_today",
      severity: "info",
      count: appts,
      message: `${appts} appointment${appts === 1 ? "" : "s"} scheduled today.`,
    });
  }

  return items;
}

export type DigestSummary = {
  organizationsProcessed: number;
  organizationsWithItems: number;
  totalItems: number;
};

/** Summarize a batch of per-org digests for the function's JSON response. */
export function summarizeDigests(perOrgItems: DigestItem[][]): DigestSummary {
  const withItems = perOrgItems.filter((items) => items.length > 0);
  return {
    organizationsProcessed: perOrgItems.length,
    organizationsWithItems: withItems.length,
    totalItems: perOrgItems.reduce((sum, items) => sum + items.length, 0),
  };
}
