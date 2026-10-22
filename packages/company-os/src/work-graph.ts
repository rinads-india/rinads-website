export type WorkActorKind = "human" | "rinpo" | "agent";
export type WorkUnitStatus =
  | "draft"
  | "ready"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "changes_requested"
  | "approved"
  | "cancelled";

export type WorkEvidence = {
  id: string;
  kind: "file" | "url" | "commit" | "deployment" | "record" | "note";
  uri: string;
  createdAt: string;
  submittedBy: string;
};

export type WorkActorProfile = {
  actorId: string;
  kind: WorkActorKind;
  organizationId: string;
  skills: string[];
  available: boolean;
  workload: number;
  qualityScore?: number;
  permissions: string[];
  conflictOrganizationIds?: string[];
};

export type WorkUnit = {
  id: string;
  organizationId: string;
  title: string;
  status: WorkUnitStatus;
  requiredSkills: string[];
  requiredPermissions: string[];
  assigneeId?: string;
  evidence: WorkEvidence[];
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
};

export type WorkAssignmentDecision = {
  allowed: boolean;
  reasons: string[];
  score: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function evaluateWorkAssignment(unit: WorkUnit, actor: WorkActorProfile): WorkAssignmentDecision {
  const reasons: string[] = [];
  if (unit.organizationId !== actor.organizationId) reasons.push("tenant_mismatch");
  if (!actor.available) reasons.push("actor_unavailable");
  if (actor.conflictOrganizationIds?.includes(unit.organizationId)) reasons.push("conflict_boundary");

  const missingPermissions = unit.requiredPermissions.filter((permission) => !actor.permissions.includes(permission));
  if (missingPermissions.length) reasons.push("missing_permission");

  const matchedSkills = unit.requiredSkills.filter((skill) => actor.skills.includes(skill)).length;
  const skillScore = unit.requiredSkills.length ? matchedSkills / unit.requiredSkills.length : 1;
  if (skillScore < 1) reasons.push("skill_gap");

  const workloadScore = clamp(1 - actor.workload);
  const qualityScore = clamp(actor.qualityScore ?? 0.5);
  const score = Number((skillScore * workloadScore * qualityScore).toFixed(4));

  return { allowed: reasons.length === 0, reasons, score };
}

export type RinadsVerification = {
  workUnitId: string;
  organizationId: string;
  status: "verified";
  evidenceIds: string[];
  approvedBy: string;
  approvedAt: string;
};

/**
 * RINADS Verified is an evidence-backed approval state, never an AI assertion.
 */
export function issueRinadsVerification(unit: WorkUnit): RinadsVerification {
  if (unit.status !== "approved") throw new Error("WORK_NOT_APPROVED");
  if (!unit.approvedBy || !unit.approvedAt) throw new Error("APPROVAL_EVIDENCE_MISSING");
  if (unit.evidence.length === 0) throw new Error("WORK_EVIDENCE_REQUIRED");

  return {
    workUnitId: unit.id,
    organizationId: unit.organizationId,
    status: "verified",
    evidenceIds: unit.evidence.map((item) => item.id),
    approvedBy: unit.approvedBy,
    approvedAt: unit.approvedAt,
  };
}

export function canActorAccessProductionSecrets(actor: WorkActorProfile): boolean {
  if (actor.kind !== "human") return false;
  return actor.permissions.includes("production.secrets.read");
}
