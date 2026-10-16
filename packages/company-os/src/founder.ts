import { buildAttention, assessClientRisk, type AttentionItem, type ClientRisk } from "./attention";
import { utilisation } from "./allocation";
import type { CompanyFacts, EngineeringFacts } from "./facts";
import {
  istMonthBounds,
  summarizeCash,
  summarizeReceivables,
  type CashSummary,
  type ReceivablesSummary,
} from "./finance";
import { summarizePipeline, type PipelineSummary } from "./pipeline";
import {
  available,
  isAvailable,
  isBefore,
  istDayBounds,
  MS_PER_DAY,
  notConnected,
  unavailable,
  SEVERITY_RANK,
  type Section,
} from "./types";

export type WorkPulse = {
  open: number;
  dueToday: number;
  overdue: number;
  blocked: number;
  urgent: number;
  unassigned: number;
};

export type CapacityRow = {
  userId: string;
  name: string;
  utilisationPct: number | null;
  committedHours: number;
  weeklyCapacityHours: number | null;
  openTasks: number;
  status: "active" | "on_leave" | "inactive";
};

export type CapacitySummary = {
  people: CapacityRow[];
  overCapacity: number;
  capacityNotRecorded: number;
};

export type ProjectRisk = {
  activeProjects: number;
  overdueProjects: number;
  delayedMilestones: number;
  revisionLoops: number;
};

export type StudioHealth = {
  openJobs: number;
  byStage: Record<string, number>;
  pastDue: number;
  inQa: number;
  assetsAwaitingApproval: number;
  assetsMissingProvenance: number;
};

export type AiHealth = {
  runs: number;
  failed: number;
  blocked: number;
  costUsd: number | null;
  byProvider: { provider: string; model: string; runs: number; failed: number }[];
};

export type DailyClose = {
  /** IST calendar day, e.g. 2026-10-16 */
  day: string;
  tasksCompleted: number | null;
  tasksCreated: number | null;
  tasksCarriedOver: number | null;
  leadsReceived: number | null;
  invoicesIssued: number | null;
  paymentsReceivedAmount: number | null;
  opportunitiesAdvanced: number | null;
  approvalsStillPending: number | null;
  unavailable: string[];
};

export type TomorrowPriority = {
  id: string;
  kind: "task_due" | "milestone_due" | "invoice_due" | "proposal_expiring" | "attention" | "approval";
  title: string;
  detail: string;
  href: string;
};

export type FounderSnapshot = {
  asOf: string;
  organizationName: string;
  /** Plain counts. There is deliberately no composite health score. */
  pulse: { attentionCount: number; criticalCount: number; sectionsUnavailable: string[] };
  cash: Section<CashSummary>;
  receivables: Section<ReceivablesSummary>;
  pipeline: Section<PipelineSummary>;
  clientRisk: Section<ClientRisk[]>;
  projectRisk: Section<ProjectRisk>;
  work: Section<WorkPulse>;
  capacity: Section<CapacitySummary>;
  approvals: Section<{ pending: number; aged: number; highRisk: number; preparedByAgents: number }>;
  studio: Section<StudioHealth>;
  growth: {
    activeCampaigns: Section<number>;
    adSignals: Section<{ critical: number; total: number }>;
  };
  engineering: EngineeringFacts;
  ai: Section<AiHealth>;
  logistics: Section<{ active: number; exceptions: number }>;
  communication: Section<{ failures: number }>;
  dailyClose: DailyClose;
  tomorrowPriorities: TomorrowPriority[];
  attention: AttentionItem[];
};

function reasonOf(section: Section<unknown>): string {
  return section.state === "available" ? "" : section.reason;
}

function carry<T>(section: Section<unknown>, fallback: string): Section<T> {
  if (section.state === "not_connected") return notConnected<T>(section.reason || fallback);
  return unavailable<T>(reasonOf(section) || fallback);
}

export function buildFounderSnapshot(facts: CompanyFacts, now: Date): FounderSnapshot {
  const asOf = now.toISOString();
  const month = istMonthBounds(now);
  const day = istDayBounds(now);
  const unavailableSections: string[] = [];
  const note = (name: string, section: Section<unknown>) => {
    if (!isAvailable(section)) unavailableSections.push(name);
  };

  // Cash
  let cash: Section<CashSummary>;
  if (isAvailable(facts.payments)) {
    cash = available(
      summarizeCash({
        payments: facts.payments.data,
        expenses: isAvailable(facts.expenses) ? facts.expenses.data : null,
        periodStart: month.start,
        periodEnd: month.end,
        previousPeriodStart: month.previousStart,
      }),
      asOf
    );
  } else {
    cash = carry(facts.payments, "Payments are not readable.");
  }
  note("cash", facts.payments);

  // Receivables
  let receivables: Section<ReceivablesSummary>;
  if (isAvailable(facts.invoices) && isAvailable(facts.payments)) {
    receivables = available(summarizeReceivables(facts.invoices.data, facts.payments.data, now), asOf);
  } else {
    receivables = carry(isAvailable(facts.invoices) ? facts.payments : facts.invoices, "Invoices are not readable.");
  }
  note("receivables", isAvailable(facts.invoices) ? facts.payments : facts.invoices);

  // Pipeline
  let pipeline: Section<PipelineSummary>;
  if (isAvailable(facts.opportunities)) {
    pipeline = available(summarizePipeline(facts.opportunities.data, now, { periodStart: month.start, periodEnd: month.end }), asOf);
  } else {
    pipeline = carry(facts.opportunities, "Opportunities are not readable.");
  }
  note("pipeline", facts.opportunities);

  // Client risk
  const risk = assessClientRisk(facts, now);
  const clientRisk: Section<ClientRisk[]> =
    risk.state === "available" ? available(risk.risks, asOf) : unavailable(risk.reason);
  if (risk.state !== "available") unavailableSections.push("clientRisk");

  // Project risk
  let projectRisk: Section<ProjectRisk>;
  if (isAvailable(facts.projects)) {
    const active = facts.projects.data.filter((p) => p.status === "active");
    projectRisk = available(
      {
        activeProjects: active.length,
        overdueProjects: facts.projects.data.filter(
          (p) => (p.status === "active" || p.status === "on_hold") && isBefore(p.dueDate, now)
        ).length,
        delayedMilestones: isAvailable(facts.milestones)
          ? facts.milestones.data.filter((m) => m.status !== "done" && isBefore(m.dueDate, now)).length
          : 0,
        revisionLoops: isAvailable(facts.deliverables)
          ? facts.deliverables.data.filter((d) => d.changeRequests >= 2 && d.status !== "approved" && d.status !== "delivered").length
          : 0,
      },
      asOf
    );
  } else {
    projectRisk = carry(facts.projects, "Projects are not readable.");
  }
  note("projectRisk", facts.projects);

  // Work
  let work: Section<WorkPulse>;
  if (isAvailable(facts.tasks)) {
    const open = facts.tasks.data.filter((t) => t.status === "todo" || t.status === "in_progress" || t.status === "blocked");
    work = available(
      {
        open: open.length,
        dueToday: open.filter((t) => t.dueAt !== null && t.dueAt >= day.start && t.dueAt < day.end).length,
        overdue: open.filter((t) => isBefore(t.dueAt, now)).length,
        blocked: open.filter((t) => t.status === "blocked").length,
        urgent: open.filter((t) => t.priority === "urgent").length,
        unassigned: open.filter((t) => !t.assigneeId).length,
      },
      asOf
    );
  } else {
    work = carry(facts.tasks, "Tasks are not readable.");
  }
  note("work", facts.tasks);

  // Capacity
  let capacity: Section<CapacitySummary>;
  if (isAvailable(facts.people)) {
    const people = facts.people.data.map<CapacityRow>((p) => ({
      userId: p.userId,
      name: p.name,
      utilisationPct: utilisation(p),
      committedHours: p.committedHours,
      weeklyCapacityHours: p.weeklyCapacityHours,
      openTasks: p.openTaskCount,
      status: p.status,
    }));
    capacity = available(
      {
        people,
        overCapacity: people.filter((p) => p.status === "active" && (p.utilisationPct ?? 0) > 100).length,
        capacityNotRecorded: people.filter((p) => p.status === "active" && p.utilisationPct === null).length,
      },
      asOf
    );
  } else {
    capacity = carry(facts.people, "Team capacity is not readable.");
  }
  note("capacity", facts.people);

  // Approvals
  let approvals: FounderSnapshot["approvals"];
  if (isAvailable(facts.approvals)) {
    approvals = available(
      {
        pending: facts.approvals.data.length,
        aged: facts.approvals.data.filter((a) => now.getTime() - new Date(a.requestedAt).getTime() >= MS_PER_DAY).length,
        highRisk: facts.approvals.data.filter((a) => a.risk === "HIGH" || a.risk === "CRITICAL").length,
        preparedByAgents: facts.approvals.data.filter((a) => a.actorKind === "agent").length,
      },
      asOf
    );
  } else {
    approvals = carry(facts.approvals, "Approvals are not readable.");
  }
  note("approvals", facts.approvals);

  // Studio
  let studio: Section<StudioHealth>;
  if (isAvailable(facts.studioJobs)) {
    const open = facts.studioJobs.data.filter((j) => j.status === "open");
    const byStage: Record<string, number> = {};
    for (const j of open) byStage[j.stage] = (byStage[j.stage] ?? 0) + 1;
    studio = available(
      {
        openJobs: open.length,
        byStage,
        pastDue: open.filter((j) => isBefore(j.dueDate, now)).length,
        inQa: open.filter((j) => j.stage === "qa").length,
        assetsAwaitingApproval: isAvailable(facts.assets) ? facts.assets.data.filter((a) => a.approvalStatus === "submitted").length : 0,
        assetsMissingProvenance: isAvailable(facts.assets) ? facts.assets.data.filter((a) => !a.provenanceComplete).length : 0,
      },
      asOf
    );
  } else {
    studio = carry(facts.studioJobs, "Studio jobs are not readable.");
  }
  note("studio", facts.studioJobs);

  // Growth
  const activeCampaigns: Section<number> = isAvailable(facts.campaigns)
    ? available(facts.campaigns.data.filter((c) => c.status === "active").length, asOf)
    : carry(facts.campaigns, "Campaigns are not readable.");
  const adSignals: Section<{ critical: number; total: number }> = isAvailable(facts.adSignals)
    ? available({ critical: facts.adSignals.data.filter((s) => s.severity === "critical").length, total: facts.adSignals.data.length }, asOf)
    : carry(facts.adSignals, "Ad performance data is not connected.");
  note("campaigns", facts.campaigns);
  note("adSignals", facts.adSignals);

  // AI
  let ai: Section<AiHealth>;
  if (isAvailable(facts.aiRuns)) {
    const runs = facts.aiRuns.data;
    const costs = runs.map((r) => r.costUsd);
    const known = costs.every((c) => c !== null);
    const byKey = new Map<string, { provider: string; model: string; runs: number; failed: number }>();
    for (const r of runs) {
      const k = `${r.provider}/${r.model}`;
      const row = byKey.get(k) ?? { provider: r.provider, model: r.model, runs: 0, failed: 0 };
      row.runs += 1;
      if (r.status === "failed") row.failed += 1;
      byKey.set(k, row);
    }
    ai = available(
      {
        runs: runs.length,
        failed: runs.filter((r) => r.status === "failed").length,
        blocked: runs.filter((r) => r.status === "blocked").length,
        // Cost is reported only when every run has a recorded cost; otherwise it is not guessed.
        costUsd: runs.length > 0 && known ? Math.round(costs.reduce<number>((s, c) => s + (c ?? 0), 0) * 10000) / 10000 : runs.length === 0 ? 0 : null,
        byProvider: [...byKey.values()].sort((a, b) => b.runs - a.runs),
      },
      asOf
    );
  } else {
    ai = carry(facts.aiRuns, "AI run ledger is not readable.");
  }
  note("ai", facts.aiRuns);

  // Logistics / communication
  const logistics: Section<{ active: number; exceptions: number }> = isAvailable(facts.shipments)
    ? available(
        {
          active: facts.shipments.data.filter((s) => !/delivered|cancel/i.test(s.status)).length,
          exceptions: facts.shipments.data.filter((s) => s.delayed || s.exception).length,
        },
        asOf
      )
    : carry(facts.shipments, "Shipments are not readable.");
  const communication: Section<{ failures: number }> = isAvailable(facts.commExceptions)
    ? available({ failures: facts.commExceptions.data.length }, asOf)
    : carry(facts.commExceptions, "Communication activity is not readable.");
  note("logistics", facts.shipments);
  note("communication", facts.commExceptions);

  note("engineering.github", facts.engineering.github);
  note("engineering.vercel", facts.engineering.vercel);
  note("engineering.supabase", facts.engineering.supabase);

  const attention = buildAttention(facts, now);

  return {
    asOf,
    organizationName: facts.organizationName,
    pulse: {
      attentionCount: attention.length,
      criticalCount: attention.filter((a) => a.severity === "critical").length,
      sectionsUnavailable: unavailableSections,
    },
    cash,
    receivables,
    pipeline,
    clientRisk,
    projectRisk,
    work,
    capacity,
    approvals,
    studio,
    growth: { activeCampaigns, adSignals },
    engineering: facts.engineering,
    ai,
    logistics,
    communication,
    dailyClose: buildDailyClose(facts, now),
    tomorrowPriorities: buildTomorrowPriorities(facts, attention, now),
    attention,
  };
}

export function buildDailyClose(facts: CompanyFacts, now: Date): DailyClose {
  const { start, end } = istDayBounds(now);
  const today = (iso: string | null | undefined) => !!iso && iso >= start && iso < end;
  const missing: string[] = [];
  const dayLabel = new Date(new Date(start).getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);

  let tasksCompleted: number | null = null;
  let tasksCreated: number | null = null;
  let tasksCarriedOver: number | null = null;
  if (isAvailable(facts.tasks)) {
    tasksCompleted = facts.tasks.data.filter((t) => t.status === "completed" && today(t.updatedAt)).length;
    tasksCreated = facts.tasks.data.filter((t) => today(t.createdAt)).length;
    tasksCarriedOver = facts.tasks.data.filter(
      (t) => (t.status === "todo" || t.status === "in_progress" || t.status === "blocked") && t.dueAt !== null && t.dueAt < end
    ).length;
  } else missing.push("tasks");

  const leadsReceived = isAvailable(facts.leads) ? facts.leads.data.filter((l) => today(l.createdAt)).length : (missing.push("leads"), null);
  const invoicesIssued = isAvailable(facts.invoices)
    ? facts.invoices.data.filter((i) => i.status !== "draft" && i.status !== "void" && i.issueDate !== null && i.issueDate >= dayLabel && i.issueDate <= dayLabel).length
    : (missing.push("invoices"), null);
  const paymentsReceivedAmount = isAvailable(facts.payments)
    ? Math.round(facts.payments.data.filter((p) => today(p.receivedAt)).reduce((s, p) => s + p.amount, 0) * 100) / 100
    : (missing.push("payments"), null);
  const opportunitiesAdvanced = isAvailable(facts.opportunities)
    ? facts.opportunities.data.filter((o) => today(o.stageChangedAt)).length
    : (missing.push("opportunities"), null);
  const approvalsStillPending = isAvailable(facts.approvals) ? facts.approvals.data.length : (missing.push("approvals"), null);

  return {
    day: dayLabel,
    tasksCompleted,
    tasksCreated,
    tasksCarriedOver,
    leadsReceived,
    invoicesIssued,
    paymentsReceivedAmount,
    opportunitiesAdvanced,
    approvalsStillPending,
    unavailable: missing,
  };
}

export function buildTomorrowPriorities(facts: CompanyFacts, attention: readonly AttentionItem[], now: Date): TomorrowPriority[] {
  const tomorrowStart = new Date(new Date(istDayBounds(now).end).getTime()).toISOString();
  const tomorrowEnd = new Date(new Date(tomorrowStart).getTime() + MS_PER_DAY).toISOString();
  const tomorrowDate = new Date(new Date(tomorrowStart).getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);
  const out: TomorrowPriority[] = [];

  for (const a of attention.filter((x) => x.severity === "critical").slice(0, 3)) {
    out.push({ id: `att-${a.id}`, kind: "attention", title: a.title, detail: a.nextAction.label, href: a.href });
  }
  if (isAvailable(facts.tasks)) {
    const rank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
    const due = facts.tasks.data
      .filter((t) => (t.status === "todo" || t.status === "in_progress" || t.status === "blocked") && t.dueAt !== null && t.dueAt >= tomorrowStart && t.dueAt < tomorrowEnd)
      .sort((a, b) => rank[a.priority] - rank[b.priority]);
    for (const t of due.slice(0, 3)) {
      out.push({ id: `task-${t.id}`, kind: "task_due", title: t.title, detail: `Task due tomorrow (${t.priority})`, href: "/os/work" });
    }
  }
  if (isAvailable(facts.milestones) && isAvailable(facts.projects)) {
    const names = new Map(facts.projects.data.map((p) => [p.id, p.name]));
    for (const m of facts.milestones.data.filter((x) => x.status !== "done" && x.dueDate !== null && x.dueDate.slice(0, 10) === tomorrowDate).slice(0, 2)) {
      out.push({ id: `ms-${m.id}`, kind: "milestone_due", title: `${names.get(m.projectId) ?? "Project"}: ${m.name}`, detail: "Milestone due tomorrow", href: "/os/work/projects" });
    }
  }
  if (isAvailable(facts.invoices)) {
    for (const i of facts.invoices.data.filter((x) => (x.status === "issued" || x.status === "partially_paid") && x.dueDate !== null && x.dueDate.slice(0, 10) === tomorrowDate).slice(0, 2)) {
      out.push({ id: `inv-${i.id}`, kind: "invoice_due", title: `Invoice ${i.number} falls due`, detail: i.companyName ? `Client: ${i.companyName}` : "Follow up on payment", href: "/os/finance" });
    }
  }
  if (isAvailable(facts.proposals)) {
    for (const p of facts.proposals.data.filter((x) => x.status === "sent" && x.validUntil !== null && x.validUntil.slice(0, 10) === tomorrowDate).slice(0, 2)) {
      out.push({ id: `prop-${p.id}`, kind: "proposal_expiring", title: `Proposal "${p.title}" expires`, detail: "Follow up before it lapses", href: "/os/sales" });
    }
  }
  if (isAvailable(facts.approvals) && facts.approvals.data.length > 0) {
    out.push({ id: "approvals", kind: "approval", title: `${facts.approvals.data.length} decision(s) waiting`, detail: "Clear the approvals queue", href: "/os/approvals" });
  }

  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))).slice(0, 8);
}

/** Exposed for tests / UI: rank used when merging attention from several sources. */
export function severityRank(item: Pick<AttentionItem, "severity">): number {
  return SEVERITY_RANK[item.severity];
}
