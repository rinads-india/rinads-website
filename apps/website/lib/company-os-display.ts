import type { CosCompanyPulse, CosFinanceSummary } from "@rinads/company-os";

export function formatInrAmount(value: number | null | undefined, currency = "INR"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent01(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

const PULSE_LABELS: Record<string, string> = {
  revenue: "Revenue",
  cash: "Cash",
  receivables: "Receivables",
  expenses: "Expenses",
  pipelineTotal: "Pipeline total",
  pipelineWeighted: "Weighted pipeline",
  clientsActive: "Active clients",
  clientsAtRisk: "Clients at risk",
  projectsOnTrack: "Projects on track",
  projectsWarning: "Projects warning",
  projectsCritical: "Projects critical",
  teamUtilization: "Team utilization",
  adsSpend: "Ads spend",
  adsReturn: "Ads return",
  aiSpend: "AI spend",
  platformUptime: "Platform uptime",
};

const FINANCE_LABELS: Record<string, string> = {
  revenueMtd: "Revenue (MTD)",
  cashPosition: "Cash position",
  receivablesOutstanding: "Receivables outstanding",
  receivablesOverdue: "Receivables overdue",
  expensesMtd: "Expenses (MTD)",
};

export function pulseMetricLabel(key: string): string {
  return PULSE_LABELS[key] ?? key;
}

export function financeMetricLabel(key: string): string {
  return FINANCE_LABELS[key] ?? key;
}

export type PulseMetricRow = {
  key: string;
  label: string;
  value: string;
  unavailable: boolean;
};

export function buildPulseMetricRows(pulse: CosCompanyPulse): PulseMetricRow[] {
  const keys = Object.keys(PULSE_LABELS);
  return keys.map((key) => {
    const unavailable = pulse.unavailable.includes(key);
    const raw = pulse[key as keyof CosCompanyPulse];
    let value = "Unavailable";
    if (!unavailable && raw != null) {
      if (key === "teamUtilization") value = formatPercent01(raw as number);
      else if (typeof raw === "number") value = formatInrAmount(raw as number, pulse.currency);
      else value = String(raw);
    }
    return { key, label: pulseMetricLabel(key), value, unavailable };
  });
}

export function buildFinanceMetricRows(summary: CosFinanceSummary) {
  return Object.keys(FINANCE_LABELS).map((key) => {
    const unavailable = summary.unavailable.includes(key);
    const raw = summary[key as keyof CosFinanceSummary];
    const value =
      unavailable || raw == null
        ? "Unavailable"
        : formatInrAmount(raw as number, summary.currency);
    return { key, label: financeMetricLabel(key), value, unavailable };
  });
}

export const OPPORTUNITY_STAGES = [
  "discover",
  "qualify",
  "discovery",
  "solution",
  "proposal",
  "negotiation",
  "contract",
  "won",
  "lost",
] as const;

export const TASK_KANBAN_COLUMNS = ["todo", "in_progress", "waiting", "review", "done"] as const;
