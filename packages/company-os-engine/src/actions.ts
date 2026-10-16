import { classifyBudgetChange, DEFAULT_BUDGET_POLICY, type BudgetPolicy } from "./growth";
import { can } from "./permissions";
import { RISK_RANK, type Actor, type OrgContext, type RiskLevel } from "./types";

/**
 * Governed action catalogue + policy.
 *
 * Request → Context → Permission → Risk → Approval (if required) → Domain tool → Execution
 *   → Postcondition verification → Audit/Event → Result
 *
 * Model output is never authorization: an `agent` actor can only PROPOSE. Policy decisions are
 * computed from the typed catalogue and the caller's real permissions — never from model text.
 */

export type ApprovalMode = "never" | "always" | "by_policy";

export type ActionSpec = {
  key: string;
  label: string;
  domain: string;
  description: string;
  risk: RiskLevel;
  /** Permission the *requesting human* (or the human on whose behalf an agent acts) must hold. */
  requiredPermission: string;
  /** Permission an approver must hold. Defaults to `approvals.decide`. */
  approverPermission?: string;
  approval: ApprovalMode;
  /** May an AI role prepare this (as a pending proposal)? */
  agentMayPropose: boolean;
  /** false → the Company OS never executes this; it is a founder-only/external operation. */
  executable: boolean;
  /** Input field carrying a monetary amount, used for escalation. */
  amountField?: string;
};

function spec(s: Omit<ActionSpec, "executable"> & { executable?: boolean }): ActionSpec {
  return { executable: true, ...s };
}

export const ACTION_CATALOG: readonly ActionSpec[] = [
  // CRM / sales
  spec({ key: "lead.create", label: "Create lead", domain: "crm", description: "Record a new lead", risk: "LOW", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "lead.qualify", label: "Qualify lead", domain: "crm", description: "Mark a lead contacted / qualified / disqualified", risk: "LOW", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "lead.convert", label: "Convert lead to company, contact and opportunity", domain: "crm", description: "Create company/contact/opportunity from a qualified lead", risk: "MEDIUM", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "lead.import_site", label: "Import website leads", domain: "crm", description: "Copy new website form leads into CRM (idempotent)", risk: "MEDIUM", requiredPermission: "crm.manage", approval: "never", agentMayPropose: false }),
  spec({ key: "company.create", label: "Create company", domain: "crm", description: "Create a company record", risk: "LOW", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "contact.create", label: "Create contact", domain: "crm", description: "Create a contact record", risk: "LOW", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "opportunity.create", label: "Create opportunity", domain: "crm", description: "Open a sales opportunity (incl. renewal / upsell)", risk: "LOW", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "opportunity.advance", label: "Advance opportunity stage", domain: "crm", description: "Move an opportunity through discovery → solution → proposal → negotiation → won/lost", risk: "MEDIUM", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "proposal.create", label: "Create proposal draft", domain: "crm", description: "Draft a priced proposal (not yet sent)", risk: "LOW", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "proposal.send", label: "Send proposal to client", domain: "crm", description: "Mark a priced proposal as sent to a client", risk: "HIGH", requiredPermission: "crm.manage", approval: "always", agentMayPropose: true }),
  spec({ key: "contract.create", label: "Create contract draft", domain: "crm", description: "Draft a contract (not yet sent or signed)", risk: "LOW", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "contract.send", label: "Send contract for signature", domain: "crm", description: "Mark a drafted contract as sent for signature (recording the signature is a separate CRITICAL action)", risk: "MEDIUM", requiredPermission: "crm.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "contract.sign", label: "Record contract signature", domain: "crm", description: "Mark a contract signed (creates a client)", risk: "CRITICAL", requiredPermission: "crm.manage", approval: "always", agentMayPropose: true }),
  // Delivery
  spec({ key: "project.create", label: "Create project / retainer", domain: "projects", description: "Create a delivery project or retainer", risk: "MEDIUM", requiredPermission: "projects.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "milestone.update", label: "Update milestone", domain: "projects", description: "Create or update a milestone", risk: "LOW", requiredPermission: "projects.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "task.create", label: "Create task", domain: "work", description: "Create an operational task", risk: "LOW", requiredPermission: "tasks.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "task.update_status", label: "Update task status", domain: "work", description: "Move a task through its state machine", risk: "LOW", requiredPermission: "tasks.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "task.assign", label: "Assign task", domain: "work", description: "Assign or reassign a task (manager decision; records rationale)", risk: "MEDIUM", requiredPermission: "projects.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "deliverable.create", label: "Create deliverable", domain: "projects", description: "Register a deliverable against a project or milestone", risk: "LOW", requiredPermission: "projects.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "deliverable.submit", label: "Submit deliverable", domain: "projects", description: "Submit a deliverable for review", risk: "LOW", requiredPermission: "tasks.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "deliverable.review", label: "Review deliverable", domain: "projects", description: "Approve or request changes on a deliverable", risk: "MEDIUM", requiredPermission: "projects.manage", approval: "never", agentMayPropose: true }),
  // Finance
  spec({ key: "invoice.create_draft", label: "Create draft invoice", domain: "finance", description: "Prepare an invoice (not yet issued)", risk: "LOW", requiredPermission: "finance.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "invoice.issue", label: "Issue invoice", domain: "finance", description: "Issue an invoice to a client", risk: "HIGH", requiredPermission: "finance.manage", approval: "always", agentMayPropose: true }),
  spec({ key: "invoice.void", label: "Void invoice", domain: "finance", description: "Void an issued invoice", risk: "HIGH", requiredPermission: "finance.manage", approval: "always", agentMayPropose: false }),
  spec({ key: "payment.record", label: "Record payment", domain: "finance", description: "Record a payment received against an invoice", risk: "HIGH", requiredPermission: "finance.manage", approval: "always", agentMayPropose: true, amountField: "amount" }),
  // Studio / growth
  spec({ key: "studio.job.create", label: "Create Studio job", domain: "studio", description: "Open a Studio production job from a request", risk: "LOW", requiredPermission: "studio.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "studio.job.advance", label: "Advance Studio job stage", domain: "studio", description: "Move a Studio job to another stage (gates enforced)", risk: "LOW", requiredPermission: "studio.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "asset.register", label: "Register creative asset", domain: "studio", description: "Register an asset with provenance", risk: "LOW", requiredPermission: "studio.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "asset.review", label: "Approve or reject creative asset", domain: "studio", description: "Record an approval decision on an asset", risk: "MEDIUM", requiredPermission: "studio.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "campaign.create", label: "Create campaign", domain: "growth", description: "Create a growth campaign", risk: "LOW", requiredPermission: "growth.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "content.create", label: "Create content item / variant", domain: "growth", description: "Create a channel variant of a source idea", risk: "LOW", requiredPermission: "growth.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "content.update", label: "Update content status", domain: "growth", description: "Move content through idea → drafting → review → approved → scheduled (publishing is a separate approval-gated action)", risk: "LOW", requiredPermission: "growth.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "content.publish", label: "Publish content", domain: "growth", description: "Mark approved content as published to a channel", risk: "HIGH", requiredPermission: "growth.manage", approval: "always", agentMayPropose: true }),
  spec({ key: "ad.create", label: "Register ad campaign", domain: "growth", description: "Register an ad campaign (paused/draft; no budget)", risk: "LOW", requiredPermission: "growth.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "ads.import_metrics", label: "Import ad metrics", domain: "growth", description: "Import daily ad metrics exported from the provider (read-only facts)", risk: "LOW", requiredPermission: "growth.manage", approval: "never", agentMayPropose: false }),
  spec({ key: "ads.budget_change", label: "Change ad budget", domain: "growth", description: "Change an ad campaign's budget", risk: "HIGH", requiredPermission: "growth.manage", approval: "always", agentMayPropose: true }),
  // People / academy / comms
  spec({ key: "people.update_profile", label: "Update team profile", domain: "people", description: "Update skills, role title or weekly capacity", risk: "MEDIUM", requiredPermission: "people.manage", approval: "never", agentMayPropose: false }),
  spec({ key: "academy.skill_create", label: "Create Academy skill", domain: "academy", description: "Add a skill to the Academy skill graph", risk: "LOW", requiredPermission: "academy.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "academy.record_progress", label: "Record Academy progress", domain: "academy", description: "Record learning progress and evidence (advisory; never an employment decision)", risk: "LOW", requiredPermission: "academy.manage", approval: "never", agentMayPropose: true }),
  spec({ key: "comm.log_activity", label: "Log communication", domain: "comms", description: "Link a call/message/email to a record", risk: "LOW", requiredPermission: "comms.manage", approval: "never", agentMayPropose: true }),
  // Never executable from the Company OS (founder-only / external)
  spec({ key: "deploy.production", label: "Deploy to production", domain: "engineering", description: "Production deployment", risk: "CRITICAL", requiredPermission: "company.founder.view", approval: "always", agentMayPropose: false, executable: false }),
  spec({ key: "secrets.rotate", label: "Rotate secrets", domain: "engineering", description: "Secrets / infrastructure change", risk: "CRITICAL", requiredPermission: "company.founder.view", approval: "always", agentMayPropose: false, executable: false }),
  spec({ key: "db.migrate", label: "Apply database migration", domain: "engineering", description: "Production database migration", risk: "CRITICAL", requiredPermission: "company.founder.view", approval: "always", agentMayPropose: false, executable: false }),
  spec({ key: "permission.change", label: "Change permissions", domain: "settings", description: "Role / permission change", risk: "CRITICAL", requiredPermission: "org.members.manage", approval: "always", agentMayPropose: false, executable: false }),
  spec({ key: "refund.process", label: "Process refund", domain: "commerce", description: "Refunds run through the commerce owner portal, not the Company OS", risk: "CRITICAL", requiredPermission: "refund.approve", approval: "always", agentMayPropose: false, executable: false }),
];

const CATALOG_INDEX = new Map(ACTION_CATALOG.map((s) => [s.key, s]));

export function getActionSpec(key: string): ActionSpec | undefined {
  return CATALOG_INDEX.get(key);
}

export type TenantActionPolicy = {
  /** Approver must differ from requester for HIGH. CRITICAL always requires a distinct approver. */
  requireDistinctApprover: boolean;
  /** Payments at/above this amount are escalated to CRITICAL. null = never escalate on amount. */
  criticalPaymentAmount: number | null;
  approvalTtlHours: number;
  budget: BudgetPolicy;
};

export const DEFAULT_ACTION_POLICY: TenantActionPolicy = {
  requireDistinctApprover: true,
  criticalPaymentAmount: null,
  approvalTtlHours: 24,
  budget: DEFAULT_BUDGET_POLICY,
};

export type PolicyDecision =
  | { decision: "ALLOW"; risk: RiskLevel; reasons: string[] }
  | {
      decision: "APPROVAL_REQUIRED";
      risk: RiskLevel;
      reasons: string[];
      approverPermission: string;
      distinctApprover: boolean;
      ttlHours: number;
    }
  | { decision: "DENY"; risk: RiskLevel | null; reasons: string[]; errorClass: string };

export function effectiveRisk(
  action: ActionSpec,
  input: Record<string, unknown>,
  policy: TenantActionPolicy
): { risk: RiskLevel; reasons: string[] } {
  let risk = action.risk;
  const reasons: string[] = [];
  if (action.amountField) {
    const raw = input[action.amountField];
    const amount = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(amount) && policy.criticalPaymentAmount !== null && amount >= policy.criticalPaymentAmount) {
      risk = "CRITICAL";
      reasons.push(`Amount ${amount} is at or above the critical threshold ${policy.criticalPaymentAmount}.`);
    }
  }
  if (action.key === "ads.budget_change") {
    const current = Number(input.currentBudget);
    const proposed = Number(input.proposedBudget);
    if (Number.isFinite(current) && Number.isFinite(proposed)) {
      const c = classifyBudgetChange(current, proposed, policy.budget);
      if (RISK_RANK[c.risk] > RISK_RANK[risk]) risk = c.risk;
      reasons.push(c.reason);
    }
  }
  return { risk, reasons };
}

/**
 * Pure policy decision. Never consults model output. `ctx` is the *human* context (for an agent
 * actor, the human on whose behalf it acts) — an agent can never exceed that human's permissions.
 */
export function evaluateAction(input: {
  actionKey: string;
  payload: Record<string, unknown>;
  actor: Actor;
  ctx: OrgContext;
  policy?: TenantActionPolicy;
}): PolicyDecision {
  const policy = input.policy ?? DEFAULT_ACTION_POLICY;
  const action = getActionSpec(input.actionKey);
  if (!action) {
    return { decision: "DENY", risk: null, reasons: [`Unregistered action: ${input.actionKey}`], errorClass: "validation_error" };
  }
  if (!input.ctx.organizationId) {
    return { decision: "DENY", risk: action.risk, reasons: ["Tenant context required."], errorClass: "tenant_error" };
  }
  if (!action.executable) {
    return {
      decision: "DENY",
      risk: action.risk,
      reasons: [`"${action.label}" is a founder-only operation and is not executable from the Company OS.`],
      errorClass: "not_executable",
    };
  }
  if (!can(input.ctx, action.requiredPermission)) {
    return { decision: "DENY", risk: action.risk, reasons: [`Missing permission: ${action.requiredPermission}`], errorClass: "authorization_error" };
  }

  const { risk, reasons } = effectiveRisk(action, input.payload, policy);
  const approverPermission = action.approverPermission ?? "approvals.decide";
  const distinct = risk === "CRITICAL" || policy.requireDistinctApprover;

  if (input.actor.kind === "agent") {
    if (!action.agentMayPropose) {
      return { decision: "DENY", risk, reasons: [`AI roles may not prepare "${action.label}".`], errorClass: "agent_not_permitted" };
    }
    return {
      decision: "APPROVAL_REQUIRED",
      risk,
      reasons: ["AI roles prepare actions; a permitted human must approve before anything runs.", ...reasons],
      approverPermission,
      distinctApprover: false,
      ttlHours: policy.approvalTtlHours,
    };
  }

  const needsApproval =
    action.approval === "always" ||
    RISK_RANK[risk] >= RISK_RANK.HIGH ||
    (action.approval === "by_policy" && RISK_RANK[risk] >= RISK_RANK.HIGH);

  if (needsApproval) {
    return {
      decision: "APPROVAL_REQUIRED",
      risk,
      reasons: [`${risk} risk action requires approval by a permitted approver.`, ...reasons],
      approverPermission,
      distinctApprover: distinct,
      ttlHours: policy.approvalTtlHours,
    };
  }
  return { decision: "ALLOW", risk, reasons: reasons.length ? reasons : [`${risk} risk; within the requester's permissions.`] };
}

export type ApproverCheck = { ok: true } | { ok: false; reason: string };

export function canDecide(input: {
  approver: OrgContext;
  requesterUserId: string | null;
  requesterKind: Actor["kind"];
  /** For an agent proposal, the human it was prepared for. */
  onBehalfOfUserId: string | null;
  risk: RiskLevel;
  approverPermission: string;
  distinctApprover: boolean;
}): ApproverCheck {
  if (!can(input.approver, input.approverPermission)) {
    return { ok: false, reason: `Approver lacks permission: ${input.approverPermission}` };
  }
  if (input.requesterKind !== "agent" && input.distinctApprover && input.requesterUserId && input.requesterUserId === input.approver.userId) {
    return { ok: false, reason: "The requester cannot approve their own high-risk action." };
  }
  if (input.risk === "CRITICAL") {
    const role = input.approver.roleKey;
    if (role !== "founder" && role !== "super_admin" && role !== "admin") {
      return { ok: false, reason: "CRITICAL actions require an admin or founder approver." };
    }
  }
  return { ok: true };
}

/** Catalogue invariants (also asserted in tests). */
export function validateCatalog(catalog: readonly ActionSpec[] = ACTION_CATALOG): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const a of catalog) {
    if (seen.has(a.key)) problems.push(`duplicate key ${a.key}`);
    seen.add(a.key);
    if (RISK_RANK[a.risk] >= RISK_RANK.HIGH && a.approval === "never") problems.push(`${a.key}: HIGH/CRITICAL must not be approval=never`);
    if (!a.executable && a.agentMayPropose) problems.push(`${a.key}: non-executable action must not be agent-proposable`);
    if (a.risk === "CRITICAL" && a.agentMayPropose && a.executable === false) problems.push(`${a.key}: critical non-executable`);
  }
  return problems;
}
