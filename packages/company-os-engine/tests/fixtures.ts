import { available, notConnected, type CompanyFacts } from "../src";

export const NOW = new Date("2026-10-16T10:00:00.000Z"); // 15:30 IST
export const ORG = "00000000-0000-4000-8000-000000000001";
export const OTHER_ORG = "00000000-0000-4000-8000-000000000002";

export function emptyFacts(overrides: Partial<CompanyFacts> = {}): CompanyFacts {
  const asOf = NOW.toISOString();
  return {
    organizationId: ORG,
    organizationName: "RINADS",
    asOf,
    tasks: available([], asOf),
    alerts: available([], asOf),
    leads: available([], asOf),
    companies: available([], asOf),
    opportunities: available([], asOf),
    proposals: available([], asOf),
    contracts: available([], asOf),
    projects: available([], asOf),
    milestones: available([], asOf),
    deliverables: available([], asOf),
    invoices: available([], asOf),
    payments: available([], asOf),
    expenses: available([], asOf),
    people: available([], asOf),
    approvals: available([], asOf),
    studioJobs: available([], asOf),
    assets: available([], asOf),
    campaigns: available([], asOf),
    adSignals: available([], asOf),
    shipments: available([], asOf),
    commExceptions: available([], asOf),
    aiRuns: available([], asOf),
    engineering: {
      github: notConnected("GitHub token not configured."),
      vercel: notConnected("Vercel token not configured."),
      supabase: notConnected("Supabase health not configured."),
    },
    ...overrides,
  };
}

export function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}
export function daysAhead(n: number): string {
  return new Date(NOW.getTime() + n * 86_400_000).toISOString();
}
