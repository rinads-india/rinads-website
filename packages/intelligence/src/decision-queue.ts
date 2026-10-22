import type { RiActionIntent, RiAuthorization, RiEvidenceRef, RiRiskLevel } from "./ri-types";

export type RiDecisionStatus =
  | "PROPOSED"
  | "REVIEWING"
  | "APPROVED"
  | "REJECTED"
  | "DELEGATED"
  | "EXPIRED"
  | "EXECUTED"
  | "FAILED";

export type RiDecisionRecord = {
  id: string;
  organizationId: string;
  recommendationId: string;
  recommendationKey?: string;
  dedupeKey: string;
  title: string;
  rationale: string;
  risk: RiRiskLevel;
  priorityScore: number;
  authorization: RiAuthorization;
  evidence: RiEvidenceRef[];
  action?: RiActionIntent;
  status: RiDecisionStatus;
  assignedTo?: string;
  delegatedTo?: string;
  decidedBy?: string;
  decisionNote?: string;
  scheduledFor?: string;
  expiresAt?: string;
  decidedAt?: string;
  executedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const ALLOWED_TRANSITIONS: Record<RiDecisionStatus, RiDecisionStatus[]> = {
  PROPOSED: ["REVIEWING", "APPROVED", "REJECTED", "DELEGATED", "EXPIRED"],
  REVIEWING: ["APPROVED", "REJECTED", "DELEGATED", "EXPIRED"],
  APPROVED: ["EXECUTED", "FAILED", "EXPIRED"],
  REJECTED: [],
  DELEGATED: ["REVIEWING", "APPROVED", "REJECTED", "EXPIRED"],
  EXPIRED: [],
  EXECUTED: [],
  FAILED: [],
};

export function canTransitionRiDecision(
  from: RiDecisionStatus,
  to: RiDecisionStatus
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertRiDecisionTransition(
  from: RiDecisionStatus,
  to: RiDecisionStatus
): void {
  if (!canTransitionRiDecision(from, to)) {
    throw new Error(`Invalid RI decision transition: ${from} -> ${to}`);
  }
}

export function isRiDecisionTerminal(status: RiDecisionStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}
