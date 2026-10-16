import type { CosApprovalItem, CosApprovalSource, CosApprovalStatus } from "./types";

/**
 * Unified Approvals Center DTO — merges runtime_approvals + rinpo_actions + cos_approval_items.
 */
export type UnifiedApprovalInboxItem = {
  id: string;
  source: CosApprovalSource;
  sourceId: string;
  title: string;
  reason: string;
  risk: CosApprovalItem["risk"];
  requesterLabel: string;
  companyId: string | null;
  projectId: string | null;
  financialImpact: number | null;
  currency: string;
  rinpoRecommendation: string;
  status: CosApprovalStatus;
  createdAt: string;
  href?: string;
};

export type RuntimeApprovalRow = {
  id: string;
  organization_id: string;
  title?: string | null;
  reason?: string | null;
  status: string;
  created_at: string;
  requested_by?: string | null;
  risk?: string | null;
};

export type RinpoActionRow = {
  id: string;
  organization_id: string;
  tool?: string | null;
  action?: string | null;
  status: string;
  created_at: string;
  actor_id?: string | null;
  risk?: string | null;
};

export type CosApprovalRow = {
  id: string;
  organization_id: string;
  source: CosApprovalSource;
  source_id: string;
  title: string;
  reason: string;
  risk: CosApprovalItem["risk"];
  requester_label: string;
  company_id: string | null;
  project_id: string | null;
  financial_impact: number | null;
  currency: string;
  rinpo_recommendation: string;
  status: CosApprovalStatus;
  created_at: string;
};

function mapStatus(raw: string): CosApprovalStatus {
  switch (raw) {
    case "pending":
    case "awaiting_approval":
      return "awaiting_approval";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "changes_requested":
      return "changes_requested";
    case "proposed":
      return "proposed";
    default:
      return "awaiting_approval";
  }
}

function mapRisk(raw: string | null | undefined): CosApprovalItem["risk"] {
  switch (raw) {
    case "read":
    case "low":
    case "medium":
    case "high":
    case "critical":
      return raw;
    default:
      return "medium";
  }
}

export function mergeApprovalInbox(input: {
  runtime?: RuntimeApprovalRow[];
  rinpo?: RinpoActionRow[];
  companyOs?: CosApprovalRow[];
}): UnifiedApprovalInboxItem[] {
  const items: UnifiedApprovalInboxItem[] = [];

  for (const row of input.runtime ?? []) {
    items.push({
      id: `runtime:${row.id}`,
      source: "runtime",
      sourceId: row.id,
      title: row.title?.trim() || "Runtime approval",
      reason: row.reason?.trim() || "",
      risk: mapRisk(row.risk),
      requesterLabel: row.requested_by?.trim() || "System",
      companyId: null,
      projectId: null,
      financialImpact: null,
      currency: "INR",
      rinpoRecommendation: "",
      status: mapStatus(row.status),
      createdAt: row.created_at,
      href: "/os/approvals",
    });
  }

  for (const row of input.rinpo ?? []) {
    items.push({
      id: `rinpo:${row.id}`,
      source: "rinpo",
      sourceId: row.id,
      title: [row.tool, row.action].filter(Boolean).join(" · ") || "RINPO action",
      reason: "Sensitive RINPO tool requires human approval before execution.",
      risk: mapRisk(row.risk),
      requesterLabel: row.actor_id?.trim() || "RINPO",
      companyId: null,
      projectId: null,
      financialImpact: null,
      currency: "INR",
      rinpoRecommendation: "Review tool input and approve only if policy allows.",
      status: mapStatus(row.status),
      createdAt: row.created_at,
      href: "/os/approvals",
    });
  }

  for (const row of input.companyOs ?? []) {
    items.push({
      id: `company_os:${row.id}`,
      source: row.source,
      sourceId: row.source_id,
      title: row.title,
      reason: row.reason,
      risk: row.risk,
      requesterLabel: row.requester_label,
      companyId: row.company_id,
      projectId: row.project_id,
      financialImpact: row.financial_impact,
      currency: row.currency,
      rinpoRecommendation: row.rinpo_recommendation,
      status: row.status,
      createdAt: row.created_at,
      href: "/os/approvals",
    });
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function openApprovalsOnly(items: UnifiedApprovalInboxItem[]): UnifiedApprovalInboxItem[] {
  return items.filter(
    (i) => i.status === "awaiting_approval" || i.status === "proposed" || i.status === "changes_requested",
  );
}
