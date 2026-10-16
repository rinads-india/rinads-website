import type { CompanyFacts, TaskFact } from "./facts";
import { summarizePipeline, STALLED_AFTER_DAYS } from "./pipeline";
import { summarizeReceivables } from "./finance";
import { utilisation } from "./allocation";
import { daysBetween, isAvailable, isBefore, SEVERITY_RANK, type Severity } from "./types";

export type AttentionCategory =
  | "work"
  | "sales"
  | "finance"
  | "delivery"
  | "approvals"
  | "people"
  | "studio"
  | "growth"
  | "engineering"
  | "ai"
  | "logistics"
  | "communication";

export type AttentionItem = {
  id: string;
  category: AttentionCategory;
  severity: Severity;
  title: string;
  /** Why this matters to the business. */
  why: string;
  /** Concrete evidence lines taken directly from facts (never model-generated). */
  evidence: string[];
  count: number;
  ownerIds: string[];
  href: string;
  nextAction: {
    label: string;
    /** Governed action key RINPO may prepare. Absent when the next step is purely human. */
    actionKey?: string;
    executable: boolean;
    requiresApproval: boolean;
  };
  oldestAt: string | null;
  source: "fact";
};

export const THRESHOLDS = {
  uncontactedLeadDays: 2,
  stalledOpportunityDays: STALLED_AFTER_DAYS,
  approvalEscalateHours: 24,
  studioQaStuckDays: 3,
  invoiceCriticalOverdueDays: 30,
  aiFailureMinRuns: 5,
  aiFailureRate: 0.3,
  renewalLookaheadDays: 60,
  proposalExpiryWarnDays: 3,
} as const;

function top<T>(items: readonly T[], n: number, fmt: (item: T) => string): string[] {
  return items.slice(0, n).map(fmt);
}

function mostCommon(ids: readonly (string | null)[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const id of ids) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}

function openTask(t: TaskFact): boolean {
  return t.status === "todo" || t.status === "in_progress" || t.status === "blocked";
}

export function buildAttention(facts: CompanyFacts, now: Date): AttentionItem[] {
  const items: AttentionItem[] = [];
  const push = (item: Omit<AttentionItem, "source">) => items.push({ ...item, source: "fact" });

  // ── Work ────────────────────────────────────────────────────────────────────
  if (isAvailable(facts.tasks)) {
    const open = facts.tasks.data.filter(openTask);
    const overdue = open.filter((t) => isBefore(t.dueAt, now));
    if (overdue.length > 0) {
      const hot = overdue.some((t) => t.priority === "urgent" || t.priority === "high");
      push({
        id: "work-overdue",
        category: "work",
        severity: hot || overdue.length >= 5 ? "critical" : "attention",
        title: `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`,
        why: "Overdue delivery work delays milestones, client approvals and invoicing.",
        evidence: top(overdue, 3, (t) => `${t.title} — due ${t.dueAt?.slice(0, 10)} (${t.priority})`),
        count: overdue.length,
        ownerIds: mostCommon(overdue.map((t) => t.assigneeId)),
        href: "/os/work",
        nextAction: { label: "Review and reassign overdue work", actionKey: "task.assign", executable: false, requiresApproval: false },
        oldestAt: overdue.map((t) => t.dueAt).filter(Boolean).sort()[0] ?? null,
      });
    }
    const blocked = open.filter((t) => t.status === "blocked");
    if (blocked.length > 0) {
      push({
        id: "work-blocked",
        category: "work",
        severity: "attention",
        title: `${blocked.length} blocked task${blocked.length === 1 ? "" : "s"}`,
        why: "Blocked work does not progress until someone clears the dependency.",
        evidence: top(blocked, 3, (t) => t.title),
        count: blocked.length,
        ownerIds: mostCommon(blocked.map((t) => t.assigneeId)),
        href: "/os/work",
        nextAction: { label: "Unblock or escalate", executable: false, requiresApproval: false },
        oldestAt: blocked.map((t) => t.updatedAt).sort()[0] ?? null,
      });
    }
    const unassignedUrgent = open.filter((t) => !t.assigneeId && (t.priority === "urgent" || t.priority === "high"));
    if (unassignedUrgent.length > 0) {
      push({
        id: "work-unassigned-urgent",
        category: "work",
        severity: "attention",
        title: `${unassignedUrgent.length} high-priority task${unassignedUrgent.length === 1 ? "" : "s"} unassigned`,
        why: "Nobody owns this work, so it will not start.",
        evidence: top(unassignedUrgent, 3, (t) => t.title),
        count: unassignedUrgent.length,
        ownerIds: [],
        href: "/os/work",
        nextAction: { label: "Get assignment recommendations", actionKey: "task.assign", executable: false, requiresApproval: false },
        oldestAt: unassignedUrgent.map((t) => t.createdAt).sort()[0] ?? null,
      });
    }
  }
  if (isAvailable(facts.alerts)) {
    const critical = facts.alerts.data.filter((a) => a.severity === "critical");
    if (critical.length > 0) {
      push({
        id: "alerts-critical",
        category: "work",
        severity: "critical",
        title: `${critical.length} critical operational alert${critical.length === 1 ? "" : "s"}`,
        why: "Critical alerts indicate an operational failure that has not been acknowledged.",
        evidence: top(critical, 3, (a) => a.title),
        count: critical.length,
        ownerIds: [],
        href: "/os/work",
        nextAction: { label: "Acknowledge and resolve", executable: false, requiresApproval: false },
        oldestAt: critical.map((a) => a.createdAt).sort()[0] ?? null,
      });
    }
  }

  // ── Sales ───────────────────────────────────────────────────────────────────
  if (isAvailable(facts.leads)) {
    const stale = facts.leads.data.filter(
      (l) => l.status === "new" && daysBetween(l.createdAt, now) >= THRESHOLDS.uncontactedLeadDays
    );
    if (stale.length > 0) {
      push({
        id: "sales-uncontacted-leads",
        category: "sales",
        severity: "attention",
        title: `${stale.length} lead${stale.length === 1 ? "" : "s"} uncontacted for ${THRESHOLDS.uncontactedLeadDays}+ days`,
        why: "Response speed is the strongest controllable driver of lead conversion.",
        evidence: top(stale, 3, (l) => `${l.name}${l.company ? ` (${l.company})` : ""} — received ${l.createdAt.slice(0, 10)}`),
        count: stale.length,
        ownerIds: mostCommon(stale.map((l) => l.ownerId)),
        href: "/os/sales",
        nextAction: { label: "Contact or qualify these leads", actionKey: "lead.qualify", executable: false, requiresApproval: false },
        oldestAt: stale.map((l) => l.createdAt).sort()[0] ?? null,
      });
    }
  }
  if (isAvailable(facts.opportunities)) {
    const pipe = summarizePipeline(facts.opportunities.data, now);
    if (pipe.stalled.length > 0) {
      push({
        id: "sales-stalled-opportunities",
        category: "sales",
        severity: "attention",
        title: `${pipe.stalled.length} opportunit${pipe.stalled.length === 1 ? "y" : "ies"} with no movement for ${THRESHOLDS.stalledOpportunityDays}+ days`,
        why: "Stalled deals quietly leave the pipeline; weighted pipeline overstates what will close.",
        evidence: top(pipe.stalled, 3, (o) => `${o.title}${o.companyName ? ` — ${o.companyName}` : ""} (${o.stage})`),
        count: pipe.stalled.length,
        ownerIds: mostCommon(pipe.stalled.map((o) => o.ownerId)),
        href: "/os/sales",
        nextAction: { label: "Advance, re-qualify or close the deal", actionKey: "opportunity.advance", executable: false, requiresApproval: false },
        oldestAt: pipe.stalled.map((o) => o.stageChangedAt ?? o.updatedAt).sort()[0] ?? null,
      });
    }
    if (pipe.overdueClose.length > 0) {
      push({
        id: "sales-overdue-close",
        category: "sales",
        severity: "attention",
        title: `${pipe.overdueClose.length} opportunit${pipe.overdueClose.length === 1 ? "y" : "ies"} past expected close date`,
        why: "The forecast date has passed without a win or loss being recorded.",
        evidence: top(pipe.overdueClose, 3, (o) => `${o.title} — expected ${o.expectedCloseDate?.slice(0, 10)}`),
        count: pipe.overdueClose.length,
        ownerIds: mostCommon(pipe.overdueClose.map((o) => o.ownerId)),
        href: "/os/sales",
        nextAction: { label: "Update close date or outcome", actionKey: "opportunity.advance", executable: false, requiresApproval: false },
        oldestAt: pipe.overdueClose.map((o) => o.expectedCloseDate).filter(Boolean).sort()[0] ?? null,
      });
    }
  }
  if (isAvailable(facts.proposals)) {
    const soon = facts.proposals.data.filter(
      (p) =>
        p.status === "sent" &&
        p.validUntil !== null &&
        new Date(p.validUntil).getTime() - now.getTime() < THRESHOLDS.proposalExpiryWarnDays * 86_400_000
    );
    if (soon.length > 0) {
      push({
        id: "sales-proposals-expiring",
        category: "sales",
        severity: "attention",
        title: `${soon.length} proposal${soon.length === 1 ? "" : "s"} expiring or expired`,
        why: "A proposal that lapses without a reply needs a follow-up or an extension.",
        evidence: top(soon, 3, (p) => `${p.title} — valid until ${p.validUntil?.slice(0, 10)}`),
        count: soon.length,
        ownerIds: [],
        href: "/os/sales",
        nextAction: { label: "Follow up with the client", executable: false, requiresApproval: false },
        oldestAt: soon.map((p) => p.validUntil).filter(Boolean).sort()[0] ?? null,
      });
    }
  }
  if (isAvailable(facts.contracts) && isAvailable(facts.opportunities)) {
    const opportunities = facts.opportunities.data;
    const renewals = facts.contracts.data.filter(
      (c) =>
        c.status === "signed" &&
        c.endDate !== null &&
        new Date(c.endDate).getTime() - now.getTime() < THRESHOLDS.renewalLookaheadDays * 86_400_000 &&
        new Date(c.endDate).getTime() > now.getTime() &&
        !opportunities.some(
          (o) => o.companyId === c.companyId && o.stage !== "lost" && o.stage !== "won" && /renew/i.test(o.title)
        )
    );
    if (renewals.length > 0) {
      push({
        id: "sales-renewals",
        category: "sales",
        severity: "info",
        title: `${renewals.length} contract${renewals.length === 1 ? "" : "s"} ending within ${THRESHOLDS.renewalLookaheadDays} days with no renewal opportunity`,
        why: "Renewals are the cheapest revenue; an unopened renewal is at risk of lapsing.",
        evidence: top(renewals, 3, (c) => `${c.title} — ends ${c.endDate?.slice(0, 10)}`),
        count: renewals.length,
        ownerIds: [],
        href: "/os/sales",
        nextAction: { label: "Open a renewal opportunity", actionKey: "opportunity.create", executable: false, requiresApproval: false },
        oldestAt: renewals.map((c) => c.endDate).filter(Boolean).sort()[0] ?? null,
      });
    }
  }

  // ── Finance ─────────────────────────────────────────────────────────────────
  if (isAvailable(facts.invoices) && isAvailable(facts.payments)) {
    const recv = summarizeReceivables(facts.invoices.data, facts.payments.data, now);
    const overdue = recv.rows.filter((r) => r.overdue);
    if (overdue.length > 0) {
      const worst = Math.max(...overdue.map((r) => r.daysOverdue));
      push({
        id: "finance-overdue-invoices",
        category: "finance",
        severity: worst >= THRESHOLDS.invoiceCriticalOverdueDays ? "critical" : "attention",
        title: `${overdue.length} overdue invoice${overdue.length === 1 ? "" : "s"}${recv.mixedCurrency ? "" : ` (${recv.totalOverdue.toLocaleString("en-IN")} ${recv.currencies[0] ?? ""})`}`,
        why: "Overdue receivables delay cash and are the earliest signal of a client relationship problem.",
        evidence: top(overdue, 3, (r) => `${r.invoice.number}${r.invoice.companyName ? ` — ${r.invoice.companyName}` : ""}: ${r.outstanding.toLocaleString("en-IN")} ${r.invoice.currency}, ${r.daysOverdue}d overdue`),
        count: overdue.length,
        ownerIds: [],
        href: "/os/finance",
        nextAction: { label: "Send a payment reminder", executable: false, requiresApproval: false },
        oldestAt: overdue.map((r) => r.invoice.dueDate).filter(Boolean).sort()[0] ?? null,
      });
    }
  }

  // ── Delivery ────────────────────────────────────────────────────────────────
  if (isAvailable(facts.milestones) && isAvailable(facts.projects)) {
    const delayed = facts.milestones.data.filter((m) => m.status !== "done" && isBefore(m.dueDate, now));
    if (delayed.length > 0) {
      const names = new Map(facts.projects.data.map((p) => [p.id, p.name]));
      push({
        id: "delivery-milestones-delayed",
        category: "delivery",
        severity: "attention",
        title: `${delayed.length} milestone${delayed.length === 1 ? "" : "s"} past due`,
        why: "A delayed milestone puts the project date, the client's trust and dependent invoicing at risk.",
        evidence: top(delayed, 3, (m) => `${names.get(m.projectId) ?? "Project"} — ${m.name} (due ${m.dueDate?.slice(0, 10)})`),
        count: delayed.length,
        ownerIds: [],
        href: "/os/work/projects",
        nextAction: { label: "Re-plan the milestone", executable: false, requiresApproval: false },
        oldestAt: delayed.map((m) => m.dueDate).filter(Boolean).sort()[0] ?? null,
      });
    }
  }
  if (isAvailable(facts.deliverables)) {
    const stuck = facts.deliverables.data.filter(
      (d) => d.changeRequests >= 2 && d.status !== "approved" && d.status !== "delivered"
    );
    if (stuck.length > 0) {
      push({
        id: "delivery-revision-loops",
        category: "delivery",
        severity: "attention",
        title: `${stuck.length} deliverable${stuck.length === 1 ? "" : "s"} in a revision loop (2+ change requests)`,
        why: "Repeated revisions usually mean the brief or expectations are misaligned and margin is eroding.",
        evidence: top(stuck, 3, (d) => `${d.title} — ${d.changeRequests} change requests`),
        count: stuck.length,
        ownerIds: [],
        href: "/os/work/projects",
        nextAction: { label: "Hold a scope/brief alignment call", executable: false, requiresApproval: false },
        oldestAt: stuck.map((d) => d.submittedAt).filter(Boolean).sort()[0] ?? null,
      });
    }
  }

  // ── Approvals ───────────────────────────────────────────────────────────────
  if (isAvailable(facts.approvals) && facts.approvals.data.length > 0) {
    const aged = facts.approvals.data.filter(
      (a) => (now.getTime() - new Date(a.requestedAt).getTime()) / 3_600_000 >= THRESHOLDS.approvalEscalateHours
    );
    const high = facts.approvals.data.filter((a) => a.risk === "HIGH" || a.risk === "CRITICAL");
    push({
      id: "approvals-pending",
      category: "approvals",
      severity: aged.length > 0 || high.length > 0 ? "attention" : "info",
      title: `${facts.approvals.data.length} decision${facts.approvals.data.length === 1 ? "" : "s"} waiting`,
      why: "Governed actions do not run until a human approves them; waiting decisions stall the work behind them.",
      evidence: top(facts.approvals.data, 3, (a) => `${a.summary} [${a.risk}]${a.actorKind === "agent" ? ` — prepared by ${a.agentRole ?? "agent"}` : ""}`),
      count: facts.approvals.data.length,
      ownerIds: [],
      href: "/os/approvals",
      nextAction: { label: "Review and decide", executable: false, requiresApproval: false },
      oldestAt: facts.approvals.data.map((a) => a.requestedAt).sort()[0] ?? null,
    });
  }

  // ── People ──────────────────────────────────────────────────────────────────
  if (isAvailable(facts.people)) {
    const over = facts.people.data.filter((p) => p.status === "active" && (utilisation(p) ?? 0) > 100);
    if (over.length > 0) {
      push({
        id: "people-over-capacity",
        category: "people",
        severity: "attention",
        title: `${over.length} team member${over.length === 1 ? "" : "s"} over recorded capacity`,
        why: "Sustained over-allocation produces slipped deadlines and quality problems.",
        evidence: top(over, 3, (p) => `${p.name} — ${utilisation(p)}% of ${p.weeklyCapacityHours}h/week`),
        count: over.length,
        ownerIds: over.map((p) => p.userId),
        href: "/os/people",
        nextAction: { label: "Rebalance work", actionKey: "task.assign", executable: false, requiresApproval: false },
        oldestAt: null,
      });
    }
  }

  // ── Studio / growth ─────────────────────────────────────────────────────────
  if (isAvailable(facts.studioJobs)) {
    const open = facts.studioJobs.data.filter((j) => j.status === "open");
    const lateQa = open.filter((j) => j.stage === "qa" && daysBetween(j.stageEnteredAt, now) >= THRESHOLDS.studioQaStuckDays);
    const late = open.filter((j) => isBefore(j.dueDate, now));
    if (lateQa.length > 0 || late.length > 0) {
      push({
        id: "studio-late",
        category: "studio",
        severity: late.length > 0 ? "attention" : "info",
        title: `${late.length} Studio job${late.length === 1 ? "" : "s"} past due, ${lateQa.length} stuck in QA`,
        why: "Creative work waiting on QA or past due blocks approval, publishing and campaign launch.",
        evidence: [...top(late, 2, (j) => `${j.title} — due ${j.dueDate?.slice(0, 10)}`), ...top(lateQa, 2, (j) => `${j.title} — in QA ${daysBetween(j.stageEnteredAt, now)}d`)],
        count: late.length + lateQa.length,
        ownerIds: mostCommon([...late, ...lateQa].map((j) => j.ownerId)),
        href: "/os/studio",
        nextAction: { label: "Clear the QA queue", executable: false, requiresApproval: false },
        oldestAt: [...late.map((j) => j.dueDate), ...lateQa.map((j) => j.stageEnteredAt)].filter(Boolean).sort()[0] ?? null,
      });
    }
  }
  if (isAvailable(facts.adSignals)) {
    const critical = facts.adSignals.data.filter((s) => s.severity === "critical");
    if (critical.length > 0) {
      push({
        id: "growth-ad-signals",
        category: "growth",
        severity: "attention",
        title: `${critical.length} critical ad signal${critical.length === 1 ? "" : "s"}`,
        why: "Fatigued or underperforming ads keep spending budget without producing leads.",
        evidence: top(critical, 3, (s) => `${s.title}: ${s.evidence}`),
        count: critical.length,
        ownerIds: [],
        href: "/os/ads",
        nextAction: { label: "Review recommendation (budget changes need approval)", actionKey: "ads.budget_change", executable: false, requiresApproval: true },
        oldestAt: null,
      });
    }
  }

  // ── Engineering ─────────────────────────────────────────────────────────────
  const eng = facts.engineering;
  if (isAvailable(eng.vercel)) {
    const bad = eng.vercel.data.projects.filter((p) => !p.ready);
    if (bad.length > 0) {
      push({
        id: "engineering-deployments",
        category: "engineering",
        severity: "critical",
        title: `${bad.length} production deployment${bad.length === 1 ? "" : "s"} not ready`,
        why: "A non-ready production deployment may mean a failed release or an outage.",
        evidence: top(bad, 3, (p) => `${p.name}: ${p.state}${p.commitSha ? ` @ ${p.commitSha.slice(0, 7)}` : ""}`),
        count: bad.length,
        ownerIds: [],
        href: "/os/engineering",
        nextAction: { label: "Open deployment logs (production changes are founder-only)", executable: false, requiresApproval: true },
        oldestAt: bad.map((p) => p.createdAt).filter(Boolean).sort()[0] ?? null,
      });
    }
  }
  if (isAvailable(eng.github) && eng.github.data.failingChecks.length > 0) {
    push({
      id: "engineering-failing-checks",
      category: "engineering",
      severity: "attention",
      title: `${eng.github.data.failingChecks.length} pull request check${eng.github.data.failingChecks.length === 1 ? "" : "s"} failing`,
      why: "Failing CI blocks merge and therefore the release path.",
      evidence: top(eng.github.data.failingChecks, 3, (c) => `#${c.pr} ${c.title} — ${c.check}`),
      count: eng.github.data.failingChecks.length,
      ownerIds: [],
      href: "/os/engineering",
      nextAction: { label: "Fix or triage failing checks", executable: false, requiresApproval: false },
      oldestAt: null,
    });
  }
  if (isAvailable(eng.supabase) && !eng.supabase.data.healthy) {
    push({
      id: "engineering-supabase",
      category: "engineering",
      severity: "critical",
      title: "Supabase reports unhealthy",
      why: "The system of record is degraded; every module depends on it.",
      evidence: [eng.supabase.data.detail],
      count: 1,
      ownerIds: [],
      href: "/os/engineering",
      nextAction: { label: "Investigate (infrastructure changes are founder-only)", executable: false, requiresApproval: true },
      oldestAt: null,
    });
  }

  // ── AI ──────────────────────────────────────────────────────────────────────
  if (isAvailable(facts.aiRuns)) {
    const runs = facts.aiRuns.data;
    const failed = runs.filter((r) => r.status === "failed");
    if (runs.length >= THRESHOLDS.aiFailureMinRuns && failed.length / runs.length >= THRESHOLDS.aiFailureRate) {
      push({
        id: "ai-failure-rate",
        category: "ai",
        severity: "attention",
        title: `${failed.length} of ${runs.length} recent AI runs failed`,
        why: "A high failure rate means AI-prepared work is silently not being produced.",
        evidence: top(failed, 3, (r) => `${r.provider}/${r.model}${r.agentRole ? ` (${r.agentRole})` : ""}: ${r.errorClass ?? "error"}`),
        count: failed.length,
        ownerIds: [],
        href: "/os/ai",
        nextAction: { label: "Check provider configuration", executable: false, requiresApproval: false },
        oldestAt: failed.map((r) => r.startedAt).sort()[0] ?? null,
      });
    }
  }

  // ── Logistics / communication ───────────────────────────────────────────────
  if (isAvailable(facts.shipments)) {
    const problem = facts.shipments.data.filter((s) => s.delayed || s.exception);
    if (problem.length > 0) {
      push({
        id: "logistics-exceptions",
        category: "logistics",
        severity: "attention",
        title: `${problem.length} shipment exception${problem.length === 1 ? "" : "s"}`,
        why: "Delayed or failed deliveries drive refunds, support load and repeat-purchase loss.",
        evidence: top(problem, 3, (s) => `${s.orderRef ?? s.id}${s.carrier ? ` via ${s.carrier}` : ""}: ${s.exception ?? "delayed"}`),
        count: problem.length,
        ownerIds: [],
        href: "/os/logistics",
        nextAction: { label: "Contact carrier / customer", executable: false, requiresApproval: false },
        oldestAt: null,
      });
    }
  }
  if (isAvailable(facts.commExceptions) && facts.commExceptions.data.length > 0) {
    push({
      id: "communication-exceptions",
      category: "communication",
      severity: "attention",
      title: `${facts.commExceptions.data.length} communication failure${facts.commExceptions.data.length === 1 ? "" : "s"}`,
      why: "Undelivered customer or client messages mean someone is waiting for a reply they never received.",
      evidence: top(facts.commExceptions.data, 3, (c) => `${c.channel}: ${c.summary}`),
      count: facts.commExceptions.data.length,
      ownerIds: [],
      href: "/os/communication",
      nextAction: { label: "Resend or call", executable: false, requiresApproval: false },
      oldestAt: facts.commExceptions.data.map((c) => c.occurredAt).sort()[0] ?? null,
    });
  }

  return sortAttention(items);
}

/**
 * Order: severity first; within a severity, pending DECISIONS come first (they block other work and
 * only a human can clear them), then oldest first, then larger groups.
 */
export function sortAttention(items: readonly AttentionItem[]): AttentionItem[] {
  const decisionRank = (i: AttentionItem) => (i.category === "approvals" ? 0 : 1);
  return [...items].sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      decisionRank(a) - decisionRank(b) ||
      (a.oldestAt ?? "9999").localeCompare(b.oldestAt ?? "9999") ||
      b.count - a.count ||
      a.id.localeCompare(b.id)
  );
}

export type ClientRisk = {
  companyId: string;
  companyName: string;
  reasons: string[];
  severity: Severity;
};

/**
 * Clients at risk. Every reason is a stated rule over recorded facts — there is no hidden score.
 *  - overdue receivable older than 30 days
 *  - a project past its due date that is not complete
 *  - a deliverable with 2+ change requests
 *  - signed contract ending within 60 days with no renewal opportunity (info only)
 */
export function assessClientRisk(facts: CompanyFacts, now: Date): { state: "available"; risks: ClientRisk[] } | { state: "unavailable"; reason: string } {
  if (!isAvailable(facts.companies)) return { state: "unavailable", reason: "Customer records are not readable." };
  const reasonsByCompany = new Map<string, { reasons: string[]; severity: Severity }>();
  const add = (companyId: string | null, reason: string, severity: Severity) => {
    if (!companyId) return;
    const entry = reasonsByCompany.get(companyId) ?? { reasons: [], severity: "info" as Severity };
    entry.reasons.push(reason);
    if (SEVERITY_RANK[severity] > SEVERITY_RANK[entry.severity]) entry.severity = severity;
    reasonsByCompany.set(companyId, entry);
  };

  if (isAvailable(facts.invoices) && isAvailable(facts.payments)) {
    const recv = summarizeReceivables(facts.invoices.data, facts.payments.data, now);
    for (const row of recv.rows) {
      if (row.overdue && row.daysOverdue >= THRESHOLDS.invoiceCriticalOverdueDays) {
        add(row.invoice.companyId, `Invoice ${row.invoice.number} is ${row.daysOverdue} days overdue`, "critical");
      } else if (row.overdue) {
        add(row.invoice.companyId, `Invoice ${row.invoice.number} is ${row.daysOverdue} days overdue`, "attention");
      }
    }
  }
  if (isAvailable(facts.projects)) {
    for (const p of facts.projects.data) {
      if ((p.status === "active" || p.status === "on_hold") && p.dueDate && isBefore(p.dueDate, now)) {
        add(p.companyId, `Project "${p.name}" is past its due date`, "attention");
      }
    }
  }
  if (isAvailable(facts.deliverables)) {
    for (const d of facts.deliverables.data) {
      if (d.changeRequests >= 2 && d.status !== "approved" && d.status !== "delivered") {
        add(d.companyId, `Deliverable "${d.title}" has ${d.changeRequests} change requests`, "attention");
      }
    }
  }

  const names = new Map(facts.companies.data.map((c) => [c.id, c.name]));
  const risks = [...reasonsByCompany.entries()]
    .filter(([id]) => names.has(id))
    .map(([companyId, v]) => ({ companyId, companyName: names.get(companyId)!, reasons: v.reasons, severity: v.severity }))
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.reasons.length - a.reasons.length);
  return { state: "available", risks };
}
