/** Actor kinds for Company OS audit / Runtime actions. */
export type CosActorKind = "human" | "ai" | "system";

export type CosWorkerKind = "human" | "bot" | "agent" | "contractor" | "system";

export type CosTaskStatus = "todo" | "in_progress" | "waiting" | "review" | "done" | "cancelled";

export type CosOpportunityStage =
  | "discover"
  | "qualify"
  | "discovery"
  | "solution"
  | "proposal"
  | "negotiation"
  | "contract"
  | "won"
  | "lost";

export type CosAttentionSeverity = "P0" | "P1" | "P2" | "P3";

export type CosApprovalSource = "runtime" | "rinpo" | "company_os";

export type CosApprovalStatus =
  | "proposed"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "completed"
  | "failed";

export type CosCompany = {
  id: string;
  organizationId: string;
  name: string;
  industry: string | null;
  lifecycleStage: string;
  healthScore: number | null;
  healthNotes: string;
};

export type CosLead = {
  id: string;
  organizationId: string;
  companyId: string | null;
  title: string;
  status: string;
  urgency: string;
};

export type CosOpportunity = {
  id: string;
  organizationId: string;
  companyId: string | null;
  title: string;
  stage: CosOpportunityStage;
  amount: number | null;
  probability: number;
};

export type CosProject = {
  id: string;
  organizationId: string;
  companyId: string | null;
  name: string;
  status: string;
  health: "on_track" | "warning" | "critical";
};

export type CosTask = {
  id: string;
  organizationId: string;
  projectId: string | null;
  title: string;
  status: CosTaskStatus;
  priority: string;
  assigneeWorkerId: string | null;
  dueAt: string | null;
};

export type CosWorker = {
  id: string;
  organizationId: string;
  kind: CosWorkerKind;
  displayName: string;
  departmentId: string | null;
  roleTitle: string;
  skills: string[];
  availableHoursWeek: number;
  committedHoursWeek: number;
};

export type CosAttentionItem = {
  id: string;
  organizationId: string;
  severity: CosAttentionSeverity;
  title: string;
  summary: string;
  href: string | null;
  createdAt: string;
};

export type CosApprovalItem = {
  id: string;
  organizationId: string;
  source: CosApprovalSource;
  sourceId: string;
  title: string;
  reason: string;
  risk: "read" | "low" | "medium" | "high" | "critical";
  requesterLabel: string;
  companyId: string | null;
  projectId: string | null;
  financialImpact: number | null;
  rinpoRecommendation: string;
  status: CosApprovalStatus;
  createdAt: string;
};

export type CosFinanceSummary = {
  revenueMtd: number | null;
  cashPosition: number | null;
  receivablesOutstanding: number | null;
  receivablesOverdue: number | null;
  expensesMtd: number | null;
  currency: string;
  unavailable: string[];
};

export type CosCompanyPulse = {
  revenue: number | null;
  cash: number | null;
  receivables: number | null;
  expenses: number | null;
  pipelineTotal: number | null;
  pipelineWeighted: number | null;
  clientsActive: number | null;
  clientsAtRisk: number | null;
  projectsOnTrack: number | null;
  projectsWarning: number | null;
  projectsCritical: number | null;
  teamUtilization: number | null;
  adsSpend: number | null;
  adsReturn: number | null;
  aiSpend: number | null;
  platformUptime: number | null;
  unavailable: string[];
  currency: string;
};
