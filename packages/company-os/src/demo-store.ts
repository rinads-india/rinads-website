import type {
  CosApprovalItem,
  CosAttentionItem,
  CosCompany,
  CosCompanyPulse,
  CosFinanceSummary,
  CosOpportunity,
  CosProject,
  CosTask,
  CosWorker,
} from "./types";
import { mergeApprovalInbox, openApprovalsOnly } from "./approvals";

/**
 * Honest demo/sample store for Company OS when Supabase is not enforced.
 * All figures are labelled sample — never mixed into live tenant reads.
 */
const DEMO_ORG = "demo-operator-org";

export const DEMO_COMPANIES: CosCompany[] = [
  {
    id: "co-apex",
    organizationId: DEMO_ORG,
    name: "Apex Nursery",
    industry: "Landscape",
    lifecycleStage: "client",
    healthScore: 72,
    healthNotes: "Sample health — overdue follow-up on proposal revision.",
  },
  {
    id: "co-glow",
    organizationId: DEMO_ORG,
    name: "Glow Studio Salon",
    industry: "Salon",
    lifecycleStage: "client",
    healthScore: 88,
    healthNotes: "Sample health — on-track delivery.",
  },
];

export const DEMO_WORKERS: CosWorker[] = [
  {
    id: "w-founder",
    organizationId: DEMO_ORG,
    kind: "human",
    displayName: "Andrino T D",
    departmentId: "d-founder",
    roleTitle: "Founder",
    skills: ["strategy", "sales", "product"],
    availableHoursWeek: 40,
    committedHoursWeek: 36,
  },
  {
    id: "w-ops",
    organizationId: DEMO_ORG,
    kind: "human",
    displayName: "Operations Lead",
    departmentId: "d-ops",
    roleTitle: "Ops",
    skills: ["delivery", "planning"],
    availableHoursWeek: 40,
    committedHoursWeek: 28,
  },
  {
    id: "w-bot-cos",
    organizationId: DEMO_ORG,
    kind: "bot",
    displayName: "Founder Chief of Staff",
    departmentId: "d-founder",
    roleTitle: "Bot",
    skills: ["briefing", "research"],
    availableHoursWeek: 80,
    committedHoursWeek: 20,
  },
];

export const DEMO_PROJECTS: CosProject[] = [
  {
    id: "p-1",
    organizationId: DEMO_ORG,
    companyId: "co-apex",
    name: "Apex operating rollout",
    status: "active",
    health: "warning",
  },
  {
    id: "p-2",
    organizationId: DEMO_ORG,
    companyId: "co-glow",
    name: "R GLOW implementation",
    status: "active",
    health: "on_track",
  },
];

export const DEMO_TASKS: CosTask[] = [
  {
    id: "t-1",
    organizationId: DEMO_ORG,
    projectId: "p-1",
    title: "Send revised proposal to Apex",
    status: "waiting",
    priority: "high",
    assigneeWorkerId: "w-ops",
    dueAt: new Date().toISOString(),
  },
  {
    id: "t-2",
    organizationId: DEMO_ORG,
    projectId: "p-2",
    title: "QA salon booking flow",
    status: "in_progress",
    priority: "normal",
    assigneeWorkerId: "w-ops",
    dueAt: null,
  },
  {
    id: "t-3",
    organizationId: DEMO_ORG,
    projectId: "p-2",
    title: "Draft founder morning brief",
    status: "todo",
    priority: "normal",
    assigneeWorkerId: "w-bot-cos",
    dueAt: null,
  },
  {
    id: "t-4",
    organizationId: DEMO_ORG,
    projectId: "p-1",
    title: "Review overdue receivable note",
    status: "review",
    priority: "high",
    assigneeWorkerId: "w-founder",
    dueAt: null,
  },
];

export const DEMO_OPPORTUNITIES: CosOpportunity[] = [
  {
    id: "o-1",
    organizationId: DEMO_ORG,
    companyId: "co-apex",
    title: "Apex Business OS expansion",
    stage: "proposal",
    amount: 180000,
    probability: 55,
  },
  {
    id: "o-2",
    organizationId: DEMO_ORG,
    companyId: "co-glow",
    title: "Glow loyalty + campaigns",
    stage: "negotiation",
    amount: 95000,
    probability: 70,
  },
];

export const DEMO_ATTENTION: CosAttentionItem[] = [
  {
    id: "a-1",
    organizationId: DEMO_ORG,
    severity: "P1",
    title: "Overdue receivable — Apex Nursery",
    summary: "Sample: invoice aging past policy threshold. Not live AR.",
    href: "/os/finance",
    createdAt: new Date().toISOString(),
  },
  {
    id: "a-2",
    organizationId: DEMO_ORG,
    severity: "P1",
    title: "Proposal awaiting founder review",
    summary: "Sample: Apex expansion proposal ready for decision.",
    href: "/os/approvals",
    createdAt: new Date().toISOString(),
  },
  {
    id: "a-3",
    organizationId: DEMO_ORG,
    severity: "P2",
    title: "Project deadline risk — Apex rollout",
    summary: "Sample: milestone slip risk flagged from task waiting state.",
    href: "/os/work",
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_APPROVALS: CosApprovalItem[] = [
  {
    id: "ap-1",
    organizationId: DEMO_ORG,
    source: "company_os",
    sourceId: "demo-proposal-1",
    title: "Approve Apex expansion proposal",
    reason: "Commercial proposal above discretionary threshold (sample).",
    risk: "high",
    requesterLabel: "Sales Intelligence (bot)",
    companyId: "co-apex",
    projectId: "p-1",
    financialImpact: 180000,
    rinpoRecommendation: "Approve after confirming margin and delivery capacity.",
    status: "awaiting_approval",
    createdAt: new Date().toISOString(),
  },
];

export function demoCompanyPulse(): CosCompanyPulse {
  return {
    revenue: null,
    cash: null,
    receivables: null,
    expenses: null,
    pipelineTotal: 275000,
    pipelineWeighted: 165250,
    clientsActive: 2,
    clientsAtRisk: 1,
    projectsOnTrack: 1,
    projectsWarning: 1,
    projectsCritical: 0,
    teamUtilization: 0.8,
    adsSpend: null,
    adsReturn: null,
    aiSpend: null,
    platformUptime: null,
    unavailable: [
      "revenue",
      "cash",
      "receivables",
      "expenses",
      "adsSpend",
      "adsReturn",
      "aiSpend",
      "platformUptime",
    ],
    currency: "INR",
  };
}

export function demoFinanceSummary(): CosFinanceSummary {
  return {
    revenueMtd: null,
    cashPosition: null,
    receivablesOutstanding: null,
    receivablesOverdue: null,
    expensesMtd: null,
    currency: "INR",
    unavailable: [
      "revenueMtd",
      "cashPosition",
      "receivablesOutstanding",
      "receivablesOverdue",
      "expensesMtd",
    ],
  };
}

export function demoApprovalInbox() {
  return openApprovalsOnly(
    mergeApprovalInbox({
      companyOs: DEMO_APPROVALS.map((a) => ({
        id: a.id,
        organization_id: a.organizationId,
        source: a.source,
        source_id: a.sourceId,
        title: a.title,
        reason: a.reason,
        risk: a.risk,
        requester_label: a.requesterLabel,
        company_id: a.companyId,
        project_id: a.projectId,
        financial_impact: a.financialImpact,
        currency: "INR",
        rinpo_recommendation: a.rinpoRecommendation,
        status: a.status,
        created_at: a.createdAt,
      })),
    }),
  );
}
