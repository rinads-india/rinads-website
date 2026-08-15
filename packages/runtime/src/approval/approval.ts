import type { ActionRiskLevel } from "../actions/registry";

export type ApprovalRecord = {
  id: string;
  organizationId: string;
  executionId?: string;
  stepRunId?: string;
  actionKey: string;
  payloadHash: string;
  riskLevel: ActionRiskLevel;
  status: "pending" | "approved" | "rejected" | "expired";
  requestedBy?: string;
  reason?: string;
  expiresAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
};

export type ApprovalStore = {
  approvals: ApprovalRecord[];
  nextId: (prefix: string) => string;
};

export type TenantPolicy = {
  organizationId: string;
  policyKey: string;
  policyValue: Record<string, unknown>;
  version: number;
};

export function getPolicyValue(
  policies: TenantPolicy[],
  organizationId: string,
  policyKey: string
): Record<string, unknown> | undefined {
  const matches = policies
    .filter((p) => p.organizationId === organizationId && p.policyKey === policyKey)
    .sort((a, b) => b.version - a.version);
  return matches[0]?.policyValue;
}

export function createApprovalRequest(
  store: ApprovalStore,
  input: Omit<ApprovalRecord, "id" | "status" | "createdAt" | "expiresAt"> & { ttlHours?: number }
): ApprovalRecord {
  const expiresAt = new Date(Date.now() + (input.ttlHours ?? 24) * 3600 * 1000).toISOString();
  const record: ApprovalRecord = {
    id: store.nextId("apr"),
    organizationId: input.organizationId,
    executionId: input.executionId,
    stepRunId: input.stepRunId,
    actionKey: input.actionKey,
    payloadHash: input.payloadHash,
    riskLevel: input.riskLevel,
    status: "pending",
    requestedBy: input.requestedBy,
    reason: input.reason,
    expiresAt,
    createdAt: new Date().toISOString(),
  };
  store.approvals.push(record);
  return record;
}

export function resolveApproval(
  store: ApprovalStore,
  approvalId: string,
  decision: "approved" | "rejected",
  resolvedBy: string
): ApprovalRecord | null {
  const record = store.approvals.find((a) => a.id === approvalId);
  if (!record || record.status !== "pending") return null;
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    record.status = "expired";
    return null;
  }
  record.status = decision;
  record.resolvedBy = resolvedBy;
  record.resolvedAt = new Date().toISOString();
  return record;
}

export function expireStaleApprovals(store: ApprovalStore): number {
  let count = 0;
  const now = Date.now();
  for (const a of store.approvals) {
    if (a.status === "pending" && new Date(a.expiresAt).getTime() < now) {
      a.status = "expired";
      count++;
    }
  }
  return count;
}

export function listPendingApprovals(store: ApprovalStore, organizationId: string): ApprovalRecord[] {
  expireStaleApprovals(store);
  return store.approvals.filter((a) => a.organizationId === organizationId && a.status === "pending");
}

export function refundRequiresApproval(
  policies: TenantPolicy[],
  organizationId: string,
  amountInr: number
): boolean {
  const threshold = Number(getPolicyValue(policies, organizationId, "refund_approval_threshold_inr")?.amount ?? 5000);
  return amountInr > threshold;
}
