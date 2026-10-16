import type { AttentionCategory, AttentionItem } from "./attention";
import type { FounderSnapshot } from "./founder";
import { SEVERITY_RANK, type Severity } from "./types";

/**
 * Deterministic "How is RINADS today?" answer.
 *
 * Every sentence is composed from `FounderSnapshot` facts. A language model may later *rephrase*
 * this text, but it can never add facts, change numbers or grant authority — `basis` is fixed to
 * "facts" and unavailable sections are listed explicitly instead of being papered over.
 */

export type BriefingIntent =
  | "company_status"
  | "attention"
  | "clients_at_risk"
  | "pipeline"
  | "receivables"
  | "cash"
  | "capacity"
  | "approvals"
  | "engineering"
  | "ai"
  | "studio"
  | "growth"
  | "tomorrow"
  | "work"
  | "unknown";

export type BriefingAction = {
  label: string;
  actionKey?: string;
  /** RINPO can prepare this and the user confirms it once (no separate approver needed). */
  executable: boolean;
  requiresApproval: boolean;
  href?: string;
};

export type BriefingRisk = {
  title: string;
  why: string;
  evidence: string[];
  owners: string[];
  severity: Severity;
  href: string;
};

export type Briefing = {
  intent: BriefingIntent;
  question: string;
  asOf: string;
  headline: string;
  whatHappened: string[];
  whatChanged: string[];
  atRisk: BriefingRisk[];
  whyItMatters: string[];
  owners: string[];
  nextSteps: BriefingAction[];
  /** Actions RINPO can prepare for you to confirm (no approver needed). */
  canExecute: BriefingAction[];
  /** Actions that will enter the approval queue. */
  requiresApproval: BriefingAction[];
  unavailable: { section: string; reason: string }[];
  basis: "facts";
  text: string;
};

const INTENT_RULES: { intent: BriefingIntent; test: RegExp }[] = [
  { intent: "clients_at_risk", test: /(client|customer|account)s?\b.*\b(risk|churn|unhappy|trouble)|\b(risk|churn)\b.*\b(client|customer|account)/i },
  { intent: "receivables", test: /receivable|overdue invoice|invoices?\b.*\b(overdue|late|unpaid|outstanding)|unpaid|owe[sd]?\b|collect(ion)?s?\b|outstanding/i },
  { intent: "cash", test: /\bcash\b|revenue|income|money in|paid this|takings/i },
  { intent: "pipeline", test: /pipeline|deal|forecast|opportunit|proposal|\bsales\b|leads?\b/i },
  { intent: "capacity", test: /capacity|workload|utili[sz]ation|overload|overbooked|who.*(free|available)|team load/i },
  { intent: "approvals", test: /approval|decision|waiting on me|sign.?off|need my/i },
  { intent: "engineering", test: /engineering|deploy|release|build|\bci\b|vercel|github|supabase|incident|outage/i },
  { intent: "ai", test: /\bai\b|model|provider|grok|claude|openai|llm|token|ai cost|ai spend/i },
  { intent: "growth", test: /campaign|\bads?\b|advertis|\bctr\b|\bcpl\b|youtube|marketing|growth|content (calendar|performance)/i },
  { intent: "studio", test: /studio|creative|asset|production pipeline|video|design job/i },
  { intent: "tomorrow", test: /tomorrow|next day|plan (for )?(the )?day|prepare for/i },
  { intent: "work", test: /\btasks?\b|\bwork\b|overdue|blocked|backlog|\bdue\b/i },
  { intent: "attention", test: /attention|urgent|focus|priorit|what.*(wrong|matters|need)|exception/i },
  { intent: "company_status", test: /how is|how are|how's|status|pulse|overview|today|doing|summary|brief/i },
];

export function detectBriefingIntent(question: string): BriefingIntent {
  const q = question.trim();
  if (!q) return "unknown";
  for (const rule of INTENT_RULES) if (rule.test.test(q)) return rule.intent;
  return "unknown";
}

const money = (n: number, currency = "INR") => `${currency === "INR" ? "₹" : `${currency} `}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const CATEGORY_FOR_INTENT: Partial<Record<BriefingIntent, AttentionCategory[]>> = {
  pipeline: ["sales"],
  receivables: ["finance"],
  cash: ["finance"],
  capacity: ["people"],
  approvals: ["approvals"],
  engineering: ["engineering"],
  ai: ["ai"],
  studio: ["studio"],
  growth: ["growth"],
  work: ["work", "delivery"],
};

function ownerLabels(ids: readonly string[], names: ReadonlyMap<string, string>): string[] {
  return ids.map((id) => names.get(id) ?? "Unknown member");
}

function toRisk(item: AttentionItem, names: ReadonlyMap<string, string>): BriefingRisk {
  return {
    title: item.title,
    why: item.why,
    evidence: item.evidence,
    owners: item.ownerIds.length ? ownerLabels(item.ownerIds, names) : ["Unassigned"],
    severity: item.severity,
    href: item.href,
  };
}

function actionsFrom(items: readonly AttentionItem[]): { exec: BriefingAction[]; approval: BriefingAction[]; steps: BriefingAction[] } {
  const exec: BriefingAction[] = [];
  const approval: BriefingAction[] = [];
  const steps: BriefingAction[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const action: BriefingAction = {
      label: item.nextAction.label,
      actionKey: item.nextAction.actionKey,
      executable: item.nextAction.executable,
      requiresApproval: item.nextAction.requiresApproval,
      href: item.href,
    };
    const key = `${action.label}|${action.actionKey ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    steps.push(action);
    if (action.requiresApproval) approval.push(action);
    else if (action.actionKey) exec.push({ ...action, executable: true });
  }
  return { exec, approval, steps };
}

export function answerCompanyQuestion(
  question: string,
  snapshot: FounderSnapshot,
  options: { memberNames?: ReadonlyMap<string, string> } = {}
): Briefing {
  const intent = detectBriefingIntent(question);
  const names = options.memberNames ?? new Map<string, string>();
  const effective: BriefingIntent = intent === "unknown" ? "company_status" : intent;

  const unavailable = snapshot.pulse.sectionsUnavailable.map((section) => ({
    section,
    reason: sectionReason(snapshot, section),
  }));

  const categories = CATEGORY_FOR_INTENT[effective];
  const relevant = snapshot.attention.filter((a) =>
    effective === "clients_at_risk" ? a.category === "finance" || a.category === "delivery" : categories ? categories.includes(a.category) : true
  );
  const sorted = [...relevant].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const atRisk = sorted.slice(0, effective === "company_status" || effective === "attention" ? 6 : 4).map((a) => toRisk(a, names));

  const whatHappened: string[] = [];
  const whatChanged: string[] = [];
  const whyItMatters: string[] = [];
  let headline = "";

  const close = snapshot.dailyClose;
  const pushIf = (arr: string[], value: number | null, template: (n: number) => string) => {
    if (value !== null && value > 0) arr.push(template(value));
  };

  switch (effective) {
    case "company_status":
    case "attention": {
      const parts: string[] = [];
      if (snapshot.work.state === "available") parts.push(`${plural(snapshot.work.data.open, "open task")} (${snapshot.work.data.overdue} overdue, ${snapshot.work.data.blocked} blocked)`);
      if (snapshot.pipeline.state === "available") parts.push(`${plural(snapshot.pipeline.data.openCount, "open deal")}, weighted ${money(snapshot.pipeline.data.weightedValue)}`);
      if (snapshot.receivables.state === "available") parts.push(`${money(snapshot.receivables.data.totalOutstanding)} outstanding, ${money(snapshot.receivables.data.totalOverdue)} overdue`);
      if (snapshot.approvals.state === "available") parts.push(`${plural(snapshot.approvals.data.pending, "decision")} waiting`);
      const exceptionLine = `${plural(snapshot.pulse.criticalCount, "critical item")}, ${plural(snapshot.pulse.attentionCount - snapshot.pulse.criticalCount, "other item")} needing attention`;
      headline = `${snapshot.organizationName} today: ${exceptionLine}.${parts.length ? ` ${parts.join("; ")}.` : ""}`;
      pushIf(whatHappened, close.tasksCompleted, (n) => `${plural(n, "task")} completed today`);
      pushIf(whatHappened, close.leadsReceived, (n) => `${plural(n, "new lead")} received today`);
      pushIf(whatHappened, close.invoicesIssued, (n) => `${plural(n, "invoice")} issued today`);
      if (close.paymentsReceivedAmount) whatHappened.push(`${money(close.paymentsReceivedAmount)} received today`);
      pushIf(whatChanged, close.opportunitiesAdvanced, (n) => `${plural(n, "deal")} changed stage today`);
      pushIf(whatChanged, close.tasksCreated, (n) => `${plural(n, "task")} created today`);
      pushIf(whatChanged, close.tasksCarriedOver, (n) => `${n} due/overdue task${n === 1 ? "" : "s"} carried over`);
      if (snapshot.attention.length > 0) whyItMatters.push("Items below are exceptions only; routine activity is summarised, not listed.");
      break;
    }
    case "clients_at_risk": {
      if (snapshot.clientRisk.state === "available") {
        const r = snapshot.clientRisk.data;
        headline = r.length === 0 ? "No clients are flagged at risk by the stated rules." : `${plural(r.length, "client")} flagged at risk.`;
        for (const c of r.slice(0, 5)) whatHappened.push(`${c.companyName}: ${c.reasons.join("; ")}`);
        whyItMatters.push("Risk is derived from overdue invoices (30+ days), late projects and repeated change requests — no hidden score.");
      } else headline = "Client risk cannot be assessed: customer records are not available.";
      break;
    }
    case "pipeline": {
      if (snapshot.pipeline.state === "available") {
        const p = snapshot.pipeline.data;
        headline = `${plural(p.openCount, "open deal")}; priced total ${money(p.totalOpenValue)}, weighted ${money(p.weightedValue)}.`;
        if (p.unpricedCount) whatHappened.push(`${plural(p.unpricedCount, "open deal")} have no amount and are excluded from value.`);
        for (const s of p.byStage.filter((x) => x.count > 0)) whatHappened.push(`${s.stage}: ${s.count} (${money(s.totalValue)})`);
        if (p.wonValueThisPeriod) whatChanged.push(`Won this month: ${money(p.wonValueThisPeriod)}`);
        whyItMatters.push(p.basis);
      } else headline = "Pipeline cannot be summarised: opportunities are not available.";
      break;
    }
    case "receivables": {
      if (snapshot.receivables.state === "available") {
        const r = snapshot.receivables.data;
        headline = r.rows.length === 0 ? "No outstanding invoices." : `${money(r.totalOutstanding)} outstanding across ${plural(r.rows.length, "invoice")}; ${money(r.totalOverdue)} overdue.`;
        for (const [bucket, amount] of Object.entries(r.buckets)) if (amount > 0) whatHappened.push(`${bucket === "current" ? "Not yet due" : `${bucket} days overdue`}: ${money(amount)}`);
        if (r.mixedCurrency) whyItMatters.push("Invoices are in more than one currency; totals above are not converted.");
        whyItMatters.push("Overdue receivables delay cash and are an early signal of client trouble.");
      } else headline = "Receivables cannot be summarised: invoices or payments are not available.";
      break;
    }
    case "cash": {
      if (snapshot.cash.state === "available") {
        const c = snapshot.cash.data;
        headline = `Received this month: ${money(c.receivedThisPeriod)} (last month ${money(c.receivedPreviousPeriod)}).`;
        if (c.expensesThisPeriod !== null) whatHappened.push(`Expenses this month: ${money(c.expensesThisPeriod)}; net movement ${money(c.netCashMovement ?? 0)}`);
        else whatHappened.push("Expenses are not readable, so net cash movement is not reported.");
        whyItMatters.push(c.basis);
      } else headline = "Cash cannot be summarised: payments are not available.";
      break;
    }
    case "capacity": {
      if (snapshot.capacity.state === "available") {
        const c = snapshot.capacity.data;
        headline = `${plural(c.overCapacity, "person", "people")} over recorded capacity; ${c.capacityNotRecorded} active member(s) have no capacity recorded.`;
        for (const p of c.people.filter((x) => x.status === "active").slice(0, 6)) whatHappened.push(`${p.name}: ${p.utilisationPct === null ? "capacity not recorded" : `${p.utilisationPct}%`} (${p.openTasks} open)`);
      } else headline = "Capacity cannot be assessed: team records are not available.";
      break;
    }
    case "approvals": {
      if (snapshot.approvals.state === "available") {
        const a = snapshot.approvals.data;
        headline = a.pending === 0 ? "Nothing is waiting for a decision." : `${plural(a.pending, "decision")} waiting; ${a.highRisk} high-risk, ${a.aged} older than 24h, ${a.preparedByAgents} prepared by AI roles.`;
        whyItMatters.push("Nothing governed runs until a permitted human approves; AI roles can only prepare.");
      } else headline = "Approvals cannot be read.";
      break;
    }
    case "engineering": {
      const e = snapshot.engineering;
      headline = "Engineering signals:";
      whatHappened.push(e.vercel.state === "available" ? `Vercel: ${e.vercel.data.projects.filter((p) => p.ready).length}/${e.vercel.data.projects.length} production deployments ready` : `Vercel: ${e.vercel.reason}`);
      whatHappened.push(e.github.state === "available" ? `GitHub: ${plural(e.github.data.openPullRequests, "open PR")}, ${e.github.data.failingChecks.length} failing check(s)` : `GitHub: ${e.github.reason}`);
      whatHappened.push(e.supabase.state === "available" ? `Supabase: ${e.supabase.data.healthy ? "healthy" : "unhealthy"} — ${e.supabase.data.detail}` : `Supabase: ${e.supabase.reason}`);
      break;
    }
    case "ai": {
      if (snapshot.ai.state === "available") {
        const a = snapshot.ai.data;
        headline = `${plural(a.runs, "AI run")} recorded; ${a.failed} failed, ${a.blocked} blocked.${a.costUsd === null ? " Cost is not fully recorded." : ` Estimated cost $${a.costUsd}.`}`;
        for (const p of a.byProvider) whatHappened.push(`${p.provider}/${p.model}: ${p.runs} run(s), ${p.failed} failed`);
        whyItMatters.push("Providers are replaceable workers; routing and authority stay inside RINADS.");
      } else headline = "AI usage cannot be summarised: the run ledger is not available.";
      break;
    }
    case "studio": {
      if (snapshot.studio.state === "available") {
        const s = snapshot.studio.data;
        headline = `${plural(s.openJobs, "Studio job")} open; ${s.pastDue} past due, ${s.inQa} in QA, ${s.assetsAwaitingApproval} asset(s) awaiting approval.`;
        for (const [stage, n] of Object.entries(s.byStage)) whatHappened.push(`${stage}: ${n}`);
        if (s.assetsMissingProvenance) whyItMatters.push(`${plural(s.assetsMissingProvenance, "asset")} lack complete provenance and cannot be published.`);
      } else headline = "Studio health cannot be summarised.";
      break;
    }
    case "growth": {
      const g = snapshot.growth;
      if (g.activeCampaigns.state === "available") {
        headline = `${plural(g.activeCampaigns.data, "campaign")} active.`;
        if (g.adSignals.state === "available") {
          headline += ` ${g.adSignals.data.total === 0 ? "No ad performance signals detected." : `${plural(g.adSignals.data.total, "ad signal")} detected (${g.adSignals.data.critical} critical).`}`;
          whyItMatters.push("Ad signals are derived from recorded daily metrics against stated thresholds; budget changes need approval.");
        } else whatHappened.push(`Ad performance: ${g.adSignals.reason}`);
      } else headline = "Campaign performance cannot be summarised: growth records are not available.";
      break;
    }
    case "tomorrow": {
      headline = snapshot.tomorrowPriorities.length === 0 ? "Nothing specific is scheduled for tomorrow in the available data." : `${plural(snapshot.tomorrowPriorities.length, "priority", "priorities")} for tomorrow.`;
      for (const p of snapshot.tomorrowPriorities) whatHappened.push(`${p.title} — ${p.detail}`);
      break;
    }
    case "work": {
      if (snapshot.work.state === "available") {
        const w = snapshot.work.data;
        headline = `${plural(w.open, "open task")}: ${w.dueToday} due today, ${w.overdue} overdue, ${w.blocked} blocked, ${w.unassigned} unassigned.`;
      } else headline = "Work cannot be summarised: tasks are not available.";
      break;
    }
    default:
      headline = "I can answer from your company data.";
  }

  const owners = [...new Set(atRisk.flatMap((r) => r.owners))];
  const { exec, approval, steps } = actionsFrom(sorted.slice(0, 6));

  const briefing: Briefing = {
    intent,
    question,
    asOf: snapshot.asOf,
    headline,
    whatHappened,
    whatChanged,
    atRisk,
    whyItMatters: [...new Set([...whyItMatters, ...atRisk.slice(0, 3).map((r) => r.why)])],
    owners,
    nextSteps: steps,
    canExecute: exec,
    requiresApproval: approval,
    unavailable,
    basis: "facts",
    text: "",
  };
  briefing.text = renderBriefingText(briefing);
  return briefing;
}

function sectionReason(snapshot: FounderSnapshot, section: string): string {
  const pick = (s: { state: string; reason?: string }) => (s.state !== "available" ? (s.reason ?? "Unavailable") : "Unavailable");
  switch (section) {
    case "cash": return pick(snapshot.cash);
    case "receivables": return pick(snapshot.receivables);
    case "pipeline": return pick(snapshot.pipeline);
    case "clientRisk": return pick(snapshot.clientRisk);
    case "projectRisk": return pick(snapshot.projectRisk);
    case "work": return pick(snapshot.work);
    case "capacity": return pick(snapshot.capacity);
    case "approvals": return pick(snapshot.approvals);
    case "studio": return pick(snapshot.studio);
    case "campaigns": return pick(snapshot.growth.activeCampaigns);
    case "adSignals": return pick(snapshot.growth.adSignals);
    case "ai": return pick(snapshot.ai);
    case "logistics": return pick(snapshot.logistics);
    case "communication": return pick(snapshot.communication);
    case "engineering.github": return pick(snapshot.engineering.github);
    case "engineering.vercel": return pick(snapshot.engineering.vercel);
    case "engineering.supabase": return pick(snapshot.engineering.supabase);
    default: return "Unavailable";
  }
}

export function renderBriefingText(b: Briefing): string {
  const lines: string[] = [b.headline];
  const block = (title: string, items: readonly string[]) => {
    if (items.length === 0) return;
    lines.push("", `${title}:`, ...items.map((i) => `• ${i}`));
  };
  block("What happened", b.whatHappened);
  block("What changed", b.whatChanged);
  if (b.atRisk.length) {
    lines.push("", "At risk:");
    for (const r of b.atRisk) {
      lines.push(`• [${r.severity}] ${r.title} — owner: ${r.owners.join(", ")}`);
      for (const e of r.evidence.slice(0, 2)) lines.push(`    ${e}`);
    }
  }
  block("Why it matters", b.whyItMatters);
  block("Next", b.nextSteps.slice(0, 5).map((s) => s.label));
  block("I can prepare (you confirm once)", b.canExecute.map((a) => a.label));
  block("Needs approval first", b.requiresApproval.map((a) => a.label));
  if (b.unavailable.length) {
    lines.push("", `Not available (not estimated): ${b.unavailable.map((u) => u.section).join(", ")}`);
  }
  lines.push("", "Answered from recorded company data only. I prepare actions; a permitted person decides.");
  return lines.join("\n");
}
