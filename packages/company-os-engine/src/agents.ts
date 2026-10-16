import { getActionSpec } from "./actions";
import type { Actor } from "./types";

/**
 * RINADS AI workforce — provider-neutral logical roles.
 *
 * Roles are CONFIGURATION on top of RINADS Intelligence + the governed runtime, not twelve
 * independent products or security domains. A role defines what it may READ, which governed
 * actions it may PREPARE, and which model task kind to route. It never defines authority:
 *  - authority always comes from the requesting human's real permissions + approval policy;
 *  - the model provider (Grok, Claude, OpenAI, Google, future) is a replaceable worker chosen by
 *    `@rinads/intelligence` routing, injected here as a port.
 */

export type AgentRoleKey =
  | "founder_chief_of_staff"
  | "operations_controller"
  | "sales_intelligence"
  | "client_success"
  | "creative_director"
  | "production_director"
  | "trend_intelligence"
  | "growth_director"
  | "ads_manager"
  | "engineering_lead"
  | "ai_production_lead"
  | "academy_director";

export type ReadDomain =
  | "work"
  | "crm"
  | "finance"
  | "projects"
  | "people"
  | "studio"
  | "growth"
  | "engineering"
  | "ai"
  | "logistics"
  | "comms"
  | "academy"
  | "approvals";

/** Mirrors `RinpoTaskKind` in @rinads/intelligence (kept structural to avoid a package dependency). */
export type AgentTaskKind = "nlu" | "research" | "reasoning" | "code" | "vision" | "voice" | "translation";
export type AgentSensitivity = "public" | "internal" | "confidential" | "restricted";

export type AgentRoleProfile = {
  key: AgentRoleKey;
  label: string;
  purpose: string;
  readDomains: readonly ReadDomain[];
  /** Governed actions this role may PREPARE (always as a pending proposal in v1). */
  mayPrepare: readonly string[];
  taskKind: AgentTaskKind;
  /** Highest data sensitivity this role may send to an external provider. */
  maxSensitivity: AgentSensitivity;
  /** v1 policy: roles read and propose; they never execute. */
  autonomy: "read" | "propose";
};

export const AGENT_ROLES: readonly AgentRoleProfile[] = [
  { key: "founder_chief_of_staff", label: "Founder Chief of Staff", purpose: "Daily brief, attention queue, decisions and tomorrow's priorities", readDomains: ["work", "crm", "finance", "projects", "people", "studio", "growth", "engineering", "ai", "logistics", "comms", "approvals"], mayPrepare: ["task.create", "opportunity.create"], taskKind: "reasoning", maxSensitivity: "confidential", autonomy: "propose" },
  { key: "operations_controller", label: "Operations Controller", purpose: "Work allocation, capacity, blockers and delivery risk", readDomains: ["work", "projects", "people", "logistics", "approvals"], mayPrepare: ["task.create", "task.update_status", "task.assign", "milestone.update"], taskKind: "reasoning", maxSensitivity: "internal", autonomy: "propose" },
  { key: "sales_intelligence", label: "Sales Intelligence", purpose: "Lead qualification, pipeline hygiene, proposal drafting", readDomains: ["crm", "comms"], mayPrepare: ["lead.create", "lead.qualify", "lead.convert", "company.create", "contact.create", "opportunity.create", "opportunity.advance", "proposal.send"], taskKind: "reasoning", maxSensitivity: "confidential", autonomy: "propose" },
  { key: "client_success", label: "Client Success", purpose: "Client health, renewals, upsell and satisfaction follow-up", readDomains: ["crm", "projects", "finance", "comms"], mayPrepare: ["opportunity.create", "task.create", "comm.log_activity"], taskKind: "reasoning", maxSensitivity: "confidential", autonomy: "propose" },
  { key: "creative_director", label: "Creative Director", purpose: "Briefs, creative direction and review of Studio work", readDomains: ["studio", "growth"], mayPrepare: ["studio.job.create", "studio.job.advance", "asset.register", "asset.review"], taskKind: "reasoning", maxSensitivity: "internal", autonomy: "propose" },
  { key: "production_director", label: "Production Director", purpose: "Studio pipeline throughput, QA queue and scheduling", readDomains: ["studio", "people", "projects"], mayPrepare: ["studio.job.advance", "task.create", "task.assign"], taskKind: "reasoning", maxSensitivity: "internal", autonomy: "propose" },
  { key: "trend_intelligence", label: "Trend Intelligence", purpose: "Market and channel trend research feeding content ideas", readDomains: ["growth"], mayPrepare: ["content.create", "campaign.create"], taskKind: "research", maxSensitivity: "public", autonomy: "propose" },
  { key: "growth_director", label: "Growth Director", purpose: "Campaign planning and multi-channel content calendars", readDomains: ["growth", "studio", "crm"], mayPrepare: ["campaign.create", "content.create", "content.publish"], taskKind: "reasoning", maxSensitivity: "internal", autonomy: "propose" },
  { key: "ads_manager", label: "Ads Manager", purpose: "Ad performance signals and budget recommendations", readDomains: ["growth"], mayPrepare: ["ads.budget_change", "content.create"], taskKind: "reasoning", maxSensitivity: "internal", autonomy: "propose" },
  { key: "engineering_lead", label: "Engineering Lead", purpose: "Build, release and infrastructure health summaries", readDomains: ["engineering", "ai"], mayPrepare: ["task.create"], taskKind: "code", maxSensitivity: "internal", autonomy: "propose" },
  { key: "ai_production_lead", label: "AI Production Lead", purpose: "AI-assisted asset production with provenance", readDomains: ["studio", "ai"], mayPrepare: ["asset.register", "studio.job.advance"], taskKind: "vision", maxSensitivity: "internal", autonomy: "propose" },
  { key: "academy_director", label: "Academy Director", purpose: "Skill paths, practice assignments and evidence review (advisory only)", readDomains: ["academy", "people"], mayPrepare: ["academy.record_progress", "task.create"], taskKind: "reasoning", maxSensitivity: "internal", autonomy: "propose" },
];

export function getAgentRole(key: string): AgentRoleProfile | undefined {
  return AGENT_ROLES.find((r) => r.key === key);
}

export type ProposedAction = {
  actionKey: string;
  input: Record<string, unknown>;
  rationale: string;
};

export type AgentRunRequest = {
  role: AgentRoleProfile;
  instruction: string;
  /** Already permission-filtered context; the worker cannot fetch anything itself. */
  context: Record<string, unknown>;
  correlationId?: string | null;
};

export type AgentUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  latencyMs: number;
};

export type AgentRunResult =
  | { ok: true; text: string; proposals: ProposedAction[]; usage: AgentUsage }
  | { ok: false; error: string; errorClass: string; usage: AgentUsage };

/**
 * A model provider adapter. Grok/xAI, Anthropic, OpenAI, Google and future models all implement
 * this one interface; none of them owns tenancy, permissions or business state.
 */
export interface AgentWorker {
  readonly provider: string;
  readonly model: string;
  run(request: AgentRunRequest): Promise<AgentRunResult>;
}

/** Injected from @rinads/intelligence `selectRinpoModel`; keeps routing authority there. */
export type AgentModelRouter = (
  taskKind: AgentTaskKind,
  sensitivity: AgentSensitivity
) => { mode: "model"; provider: string; model: string; reason: string } | { mode: "deterministic"; reason: string };

export type ProposalValidation = {
  accepted: ProposedAction[];
  rejected: { proposal: ProposedAction; reason: string }[];
};

/**
 * Filters worker output. Even a well-behaved model is never trusted to stay inside its lane:
 * anything outside the role's `mayPrepare`, unknown to the catalogue, or not agent-proposable is dropped.
 */
export function validateProposals(role: AgentRoleProfile, proposals: readonly ProposedAction[]): ProposalValidation {
  const accepted: ProposedAction[] = [];
  const rejected: ProposalValidation["rejected"] = [];
  for (const proposal of proposals) {
    const spec = getActionSpec(proposal.actionKey);
    if (!spec) {
      rejected.push({ proposal, reason: "Unknown action." });
    } else if (!spec.executable) {
      rejected.push({ proposal, reason: "Not executable from the Company OS." });
    } else if (!spec.agentMayPropose) {
      rejected.push({ proposal, reason: "Action cannot be prepared by an AI role." });
    } else if (!role.mayPrepare.includes(proposal.actionKey)) {
      rejected.push({ proposal, reason: `${role.label} may not prepare ${proposal.actionKey}.` });
    } else if (typeof proposal.input !== "object" || proposal.input === null || Array.isArray(proposal.input)) {
      rejected.push({ proposal, reason: "Input must be an object." });
    } else {
      accepted.push(proposal);
    }
  }
  return { accepted, rejected };
}

export function agentActor(role: AgentRoleProfile, onBehalfOfUserId: string, worker?: Pick<AgentWorker, "provider" | "model">): Actor {
  return { kind: "agent", agentRole: role.key, onBehalfOfUserId, provider: worker?.provider, model: worker?.model };
}

/** Context passed to a worker must only contain domains the role may read. */
export function filterContextForRole(role: AgentRoleProfile, context: Record<string, { domain: ReadDomain; data: unknown }>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(context)) {
    if (role.readDomains.includes(entry.domain)) out[key] = entry.data;
  }
  return out;
}

/** Validate role profiles themselves (also asserted in tests). */
export function validateRoleProfiles(roles: readonly AgentRoleProfile[] = AGENT_ROLES): string[] {
  const problems: string[] = [];
  const keys = new Set<string>();
  for (const role of roles) {
    if (keys.has(role.key)) problems.push(`duplicate role ${role.key}`);
    keys.add(role.key);
    if (role.autonomy !== "read" && role.autonomy !== "propose") problems.push(`${role.key}: autonomy must be read|propose in v1`);
    for (const action of role.mayPrepare) {
      const spec = getActionSpec(action);
      if (!spec) problems.push(`${role.key}: unknown action ${action}`);
      else if (!spec.agentMayPropose) problems.push(`${role.key}: ${action} is not agent-proposable`);
      else if (!spec.executable) problems.push(`${role.key}: ${action} is not executable`);
    }
  }
  return problems;
}
