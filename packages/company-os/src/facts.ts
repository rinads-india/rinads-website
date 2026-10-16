import type { OpportunityFact } from "./pipeline";
import type { ExpenseFact, InvoiceFact, PaymentFact } from "./finance";
import type {
  ContractStatus,
  DeliverableStatus,
  LeadStatus,
  MilestoneStatus,
  ProjectStatus,
  ProposalStatus,
  TaskStatus,
} from "./lifecycle";
import type { PersonCapacity } from "./allocation";
import type { RiskLevel, Section } from "./types";

/**
 * `CompanyFacts` is the single, permission-filtered input to every founder / attention / briefing
 * computation. Loaders (in the app) fill each section from RLS-readable tables; a section the
 * caller cannot read or that has no backing integration is simply not `available`.
 */

export type TaskFact = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: "low" | "normal" | "high" | "urgent";
  dueAt: string | null;
  assigneeId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Planning inputs for allocation. Optional: absent/empty means "not recorded", never a guess. */
  estimateHours?: number | null;
  requiredSkills?: string[];
  blockedBy?: string[];
};

export type AlertFact = {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
};

export type LeadFact = {
  id: string;
  name: string;
  company: string | null;
  status: LeadStatus;
  source: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
};

export type CompanyFact = {
  id: string;
  name: string;
  relationship: "prospect" | "client" | "partner" | "churned";
  ownerId: string | null;
  priority: "strategic" | "standard" | "low";
};

export type ProposalFact = {
  id: string;
  title: string;
  opportunityId: string | null;
  companyId: string | null;
  status: ProposalStatus;
  amount: number | null;
  sentAt: string | null;
  validUntil: string | null;
};

export type ContractFact = {
  id: string;
  title: string;
  companyId: string | null;
  status: ContractStatus;
  value: number | null;
  signedAt: string | null;
  endDate: string | null;
};

export type ProjectFact = {
  id: string;
  name: string;
  companyId: string | null;
  kind: "project" | "retainer";
  status: ProjectStatus;
  dueDate: string | null;
  ownerId: string | null;
  updatedAt: string;
};

export type MilestoneFact = {
  id: string;
  projectId: string;
  name: string;
  dueDate: string | null;
  status: MilestoneStatus;
};

export type DeliverableFact = {
  id: string;
  projectId: string | null;
  companyId: string | null;
  title: string;
  status: DeliverableStatus;
  dueDate: string | null;
  submittedAt: string | null;
  changeRequests: number;
};

export type ApprovalFact = {
  id: string;
  actionType: string;
  summary: string;
  risk: RiskLevel;
  requestedAt: string;
  expiresAt: string | null;
  actorKind: "user" | "agent" | "system";
  agentRole: string | null;
  requestedBy: string | null;
};

export type StudioJobFact = {
  id: string;
  title: string;
  stage: string;
  companyId: string | null;
  dueDate: string | null;
  ownerId: string | null;
  stageEnteredAt: string;
  status: "open" | "done" | "cancelled";
};

export type AssetFact = {
  id: string;
  kind: string;
  approvalStatus: "draft" | "submitted" | "approved" | "rejected";
  createdAt: string;
  provenanceComplete: boolean;
};

export type CampaignFact = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  channels: string[];
};

export type AdSignalFact = {
  id: string;
  kind: string;
  severity: "info" | "attention" | "critical";
  title: string;
  evidence: string;
  campaignId: string | null;
};

export type ShipmentFact = {
  id: string;
  orderRef: string | null;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  expectedDelivery: string | null;
  delayed: boolean;
  exception: string | null;
};

export type CommExceptionFact = {
  id: string;
  channel: string;
  summary: string;
  occurredAt: string;
  linkedType: string | null;
  linkedId: string | null;
};

export type AiRunFact = {
  id: string;
  provider: string;
  model: string;
  agentRole: string | null;
  status: "succeeded" | "failed" | "blocked";
  costUsd: number | null;
  startedAt: string;
  errorClass: string | null;
};

export type EngineeringFacts = {
  github: Section<{
    repository: string;
    openPullRequests: number;
    failingChecks: { pr: number; title: string; check: string }[];
    defaultBranchCommit: string | null;
  }>;
  vercel: Section<{
    projects: { name: string; state: string; commitSha: string | null; createdAt: string | null; ready: boolean }[];
  }>;
  supabase: Section<{
    healthy: boolean;
    detail: string;
    appliedMigrations: number | null;
  }>;
};

export type ApprovalSummary = { pending: number };

export type CompanyFacts = {
  organizationId: string;
  organizationName: string;
  asOf: string;
  tasks: Section<TaskFact[]>;
  alerts: Section<AlertFact[]>;
  leads: Section<LeadFact[]>;
  companies: Section<CompanyFact[]>;
  opportunities: Section<OpportunityFact[]>;
  proposals: Section<ProposalFact[]>;
  contracts: Section<ContractFact[]>;
  projects: Section<ProjectFact[]>;
  milestones: Section<MilestoneFact[]>;
  deliverables: Section<DeliverableFact[]>;
  invoices: Section<InvoiceFact[]>;
  payments: Section<PaymentFact[]>;
  expenses: Section<ExpenseFact[]>;
  people: Section<PersonCapacity[]>;
  approvals: Section<ApprovalFact[]>;
  studioJobs: Section<StudioJobFact[]>;
  assets: Section<AssetFact[]>;
  campaigns: Section<CampaignFact[]>;
  adSignals: Section<AdSignalFact[]>;
  shipments: Section<ShipmentFact[]>;
  commExceptions: Section<CommExceptionFact[]>;
  aiRuns: Section<AiRunFact[]>;
  engineering: EngineeringFacts;
};
