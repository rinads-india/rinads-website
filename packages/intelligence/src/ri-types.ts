export type RiStage =
  | "OBSERVE"
  | "UNDERSTAND"
  | "RECOMMEND"
  | "AUTHORIZE"
  | "ACT"
  | "AUDIT";

export type RiRiskLevel = "low" | "medium" | "high" | "critical";

/** Mirrors the public RINPO tool registry categories. */
export type RiToolCategory = "READ" | "DRAFT" | "WRITE" | "ACTION" | "SENSITIVE";

/**
 * 0 Observe
 * 1 Advise
 * 2 Draft
 * 3 Approve-to-act
 * 4 Autonomous low-risk actions
 * 5 Autonomous low/medium-risk actions with escalation
 */
export type RiAutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type RiScope = {
  organizationId: string;
  userId?: string;
  roleKey?: string;
  industryKey?: string;
  locationId?: string;
  route?: string;
};

export type RiEvidenceRef = {
  source: string;
  entityType?: string;
  entityId?: string;
  metricKey?: string;
  eventId?: string;
  observedAt?: string;
  summary?: string;
};

export type RiSignal = {
  id: string;
  key: string;
  title: string;
  value?: string | number | boolean;
  severity?: RiRiskLevel;
  evidence: RiEvidenceRef[];
};

export type RiFinding = {
  id: string;
  title: string;
  explanation: string;
  confidence: number;
  risk: RiRiskLevel;
  evidence: RiEvidenceRef[];
  signalIds?: string[];
};

export type RiActionIntent = {
  toolKey?: string;
  category: RiToolCategory;
  externalSideEffect?: boolean;
  financialSideEffect?: boolean;
  pricingMutation?: boolean;
  refundOrPayout?: boolean;
  inventoryMutation?: boolean;
  hardBlocked?: boolean;
};

export type RiRecommendation = {
  id: string;
  key?: string;
  title: string;
  rationale: string;
  expectedImpact?: string;
  impactScore: number;
  urgencyScore: number;
  confidence: number;
  risk: RiRiskLevel;
  ownerRole?: string;
  rinpoRole?: string;
  findingIds?: string[];
  evidence: RiEvidenceRef[];
  action?: RiActionIntent;
  dedupeKey?: string;
};

export type RiAuthorization = {
  allowed: boolean;
  requiresApproval: boolean;
  stage: RiStage;
  reason: string;
};

export type RiDecisionItem = {
  id: string;
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
};

export type RiIntelligenceFrame = {
  scope: RiScope;
  generatedAt: string;
  signals: RiSignal[];
  findings: RiFinding[];
  recommendations: RiRecommendation[];
  decisions: RiDecisionItem[];
};
