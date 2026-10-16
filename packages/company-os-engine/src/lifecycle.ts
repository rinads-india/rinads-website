/**
 * Connected client lifecycle:
 * Lead → Company/Contact → Opportunity → Discovery → Solution → Proposal → Contract → Client
 *   → Project/Retainer → Milestone → Task → Deliverable → Approval → Invoice → Payment
 *   → Performance → Renewal/Upsell
 *
 * Each object has a small explicit state machine. Transitions are the only way status changes,
 * which makes every status change auditable and testable.
 */

export type StateMachine<S extends string> = {
  readonly name: string;
  readonly initial: S;
  readonly transitions: Readonly<Record<S, readonly S[]>>;
  readonly terminal: readonly S[];
};

export type TransitionResult<S extends string> =
  | { ok: true; from: S; to: S }
  | { ok: false; from: S; to: S; reason: string };

export function canTransition<S extends string>(machine: StateMachine<S>, from: S, to: S): TransitionResult<S> {
  if (from === to) return { ok: false, from, to, reason: `${machine.name} is already ${from}` };
  const allowed = machine.transitions[from];
  if (!allowed) return { ok: false, from, to, reason: `${machine.name}: unknown state ${from}` };
  if (!allowed.includes(to)) {
    return { ok: false, from, to, reason: `${machine.name}: ${from} → ${to} is not a valid transition` };
  }
  return { ok: true, from, to };
}

export function assertTransition<S extends string>(machine: StateMachine<S>, from: S, to: S): void {
  const result = canTransition(machine, from, to);
  if (!result.ok) throw new Error(result.reason);
}

export function isTerminal<S extends string>(machine: StateMachine<S>, state: S): boolean {
  return machine.terminal.includes(state);
}

// ── Lead ──────────────────────────────────────────────────────────────────────
export type LeadStatus = "new" | "contacted" | "qualified" | "disqualified" | "converted";
export const LEAD_MACHINE: StateMachine<LeadStatus> = {
  name: "lead",
  initial: "new",
  transitions: {
    new: ["contacted", "qualified", "disqualified"],
    contacted: ["qualified", "disqualified"],
    qualified: ["converted", "disqualified"],
    disqualified: ["new"],
    converted: [],
  },
  terminal: ["converted"],
};

// ── Opportunity ───────────────────────────────────────────────────────────────
export type OpportunityStage = "discovery" | "solution" | "proposal" | "negotiation" | "won" | "lost";
export const OPPORTUNITY_MACHINE: StateMachine<OpportunityStage> = {
  name: "opportunity",
  initial: "discovery",
  transitions: {
    discovery: ["solution", "lost"],
    solution: ["discovery", "proposal", "lost"],
    proposal: ["solution", "negotiation", "won", "lost"],
    negotiation: ["proposal", "won", "lost"],
    won: [],
    lost: ["discovery"],
  },
  terminal: ["won"],
};

/**
 * Default stage probabilities, used ONLY when an opportunity has no explicit probability.
 * Reports always label the basis so a default is never presented as a measured win rate.
 */
export const DEFAULT_STAGE_PROBABILITY: Record<OpportunityStage, number> = {
  discovery: 10,
  solution: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
};

// ── Proposal ──────────────────────────────────────────────────────────────────
export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export const PROPOSAL_MACHINE: StateMachine<ProposalStatus> = {
  name: "proposal",
  initial: "draft",
  transitions: {
    draft: ["sent"],
    sent: ["accepted", "rejected", "expired"],
    accepted: [],
    rejected: ["draft"],
    expired: ["draft"],
  },
  terminal: ["accepted"],
};

// ── Contract ──────────────────────────────────────────────────────────────────
export type ContractStatus = "draft" | "sent" | "signed" | "declined" | "cancelled";
export const CONTRACT_MACHINE: StateMachine<ContractStatus> = {
  name: "contract",
  initial: "draft",
  transitions: {
    draft: ["sent", "cancelled"],
    sent: ["signed", "declined", "cancelled"],
    signed: [],
    declined: ["draft"],
    cancelled: [],
  },
  terminal: ["signed", "cancelled"],
};

// ── Project / retainer ────────────────────────────────────────────────────────
export type ProjectStatus = "planned" | "active" | "on_hold" | "completed" | "cancelled";
export const PROJECT_MACHINE: StateMachine<ProjectStatus> = {
  name: "project",
  initial: "planned",
  transitions: {
    planned: ["active", "cancelled"],
    active: ["on_hold", "completed", "cancelled"],
    on_hold: ["active", "cancelled"],
    completed: [],
    cancelled: [],
  },
  terminal: ["completed", "cancelled"],
};

export type MilestoneStatus = "pending" | "in_progress" | "done";
export const MILESTONE_MACHINE: StateMachine<MilestoneStatus> = {
  name: "milestone",
  initial: "pending",
  transitions: { pending: ["in_progress", "done"], in_progress: ["pending", "done"], done: [] },
  terminal: ["done"],
};

// ── Deliverable / approval ────────────────────────────────────────────────────
export type DeliverableStatus = "draft" | "submitted" | "in_review" | "changes_requested" | "approved" | "delivered";
export const DELIVERABLE_MACHINE: StateMachine<DeliverableStatus> = {
  name: "deliverable",
  initial: "draft",
  transitions: {
    draft: ["submitted"],
    submitted: ["in_review", "changes_requested", "approved"],
    in_review: ["changes_requested", "approved"],
    changes_requested: ["submitted"],
    approved: ["delivered"],
    delivered: [],
  },
  terminal: ["delivered"],
};

// ── Task (reuses operational_tasks statuses) ──────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed" | "cancelled";
export const TASK_MACHINE: StateMachine<TaskStatus> = {
  name: "task",
  initial: "todo",
  transitions: {
    todo: ["in_progress", "blocked", "cancelled", "completed"],
    in_progress: ["blocked", "completed", "cancelled", "todo"],
    blocked: ["todo", "in_progress", "cancelled"],
    completed: [],
    cancelled: [],
  },
  terminal: ["completed", "cancelled"],
};

// ── Invoice ───────────────────────────────────────────────────────────────────
/** `overdue` is derived (see finance.ts), never stored. */
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "void";
export const INVOICE_MACHINE: StateMachine<InvoiceStatus> = {
  name: "invoice",
  initial: "draft",
  transitions: {
    draft: ["issued", "void"],
    issued: ["partially_paid", "paid", "void"],
    partially_paid: ["paid", "void"],
    paid: [],
    void: [],
  },
  terminal: ["paid", "void"],
};

// ── Lifecycle map (for the client workspace) ─────────────────────────────────
export type LifecycleStageId =
  | "lead"
  | "company_contact"
  | "opportunity"
  | "proposal"
  | "contract"
  | "client"
  | "project"
  | "milestone"
  | "task"
  | "deliverable"
  | "approval"
  | "invoice"
  | "payment"
  | "performance"
  | "renewal";

export const LIFECYCLE_STAGES: readonly { id: LifecycleStageId; label: string; object: string }[] = [
  { id: "lead", label: "Lead", object: "crm_leads" },
  { id: "company_contact", label: "Company / Contact", object: "crm_companies" },
  { id: "opportunity", label: "Opportunity (Discovery → Solution)", object: "crm_opportunities" },
  { id: "proposal", label: "Proposal", object: "crm_proposals" },
  { id: "contract", label: "Contract", object: "crm_contracts" },
  { id: "client", label: "Client", object: "crm_companies" },
  { id: "project", label: "Project / Retainer", object: "projects" },
  { id: "milestone", label: "Milestone", object: "project_milestones" },
  { id: "task", label: "Task", object: "operational_tasks" },
  { id: "deliverable", label: "Deliverable", object: "deliverables" },
  { id: "approval", label: "Approval", object: "rinpo_actions" },
  { id: "invoice", label: "Invoice", object: "finance_invoices" },
  { id: "payment", label: "Payment", object: "finance_payments" },
  { id: "performance", label: "Performance", object: "asset_performance" },
  { id: "renewal", label: "Renewal / Upsell", object: "crm_opportunities" },
];

/** A company is a *client* once it has a signed contract (or an active project). */
export function isClient(input: { signedContracts: number; activeProjects: number }): boolean {
  return input.signedContracts > 0 || input.activeProjects > 0;
}
