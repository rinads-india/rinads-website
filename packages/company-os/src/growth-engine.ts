export type GrowthLeadSource = "ads" | "social" | "seo" | "form" | "whatsapp" | "call" | "landing" | "import" | "other";
export type GrowthLeadStage = "received" | "qualified" | "contacted" | "demo" | "proposal" | "won" | "lost";

export type GrowthLeadInput = {
  organizationId: string;
  source: GrowthLeadSource;
  externalId?: string;
  name?: string;
  email?: string;
  phone?: string;
  campaign?: string;
  medium?: string;
  referrer?: string;
  consentToContact: boolean;
  suppressed?: boolean;
  receivedAt: string;
};

export type CanonicalGrowthLead = GrowthLeadInput & {
  idempotencyKey: string;
  stage: GrowthLeadStage;
  score: number;
};

function normalizeIdentity(value?: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

export function growthLeadIdempotencyKey(input: GrowthLeadInput): string {
  const identity = input.externalId || normalizeIdentity(input.phone) || normalizeIdentity(input.email);
  if (!identity) throw new Error("LEAD_IDENTITY_REQUIRED");
  return [input.organizationId, input.source, identity].join(":");
}

export function normalizeGrowthLead(input: GrowthLeadInput): CanonicalGrowthLead {
  const score = [input.phone, input.email, input.campaign, input.referrer].filter(Boolean).length / 4;
  return {
    ...input,
    email: input.email?.trim().toLowerCase(),
    phone: input.phone?.trim(),
    idempotencyKey: growthLeadIdempotencyKey(input),
    stage: "received",
    score: Number(score.toFixed(2)),
  };
}

export type OutreachDecision = { allowed: true } | { allowed: false; reason: "suppressed" | "consent_required" };

export function canContactGrowthLead(lead: Pick<GrowthLeadInput, "consentToContact" | "suppressed">): OutreachDecision {
  if (lead.suppressed) return { allowed: false, reason: "suppressed" };
  if (!lead.consentToContact) return { allowed: false, reason: "consent_required" };
  return { allowed: true };
}

export type FunnelVersion = {
  id: string;
  organizationId: string;
  version: number;
  status: "draft" | "awaiting_approval" | "approved" | "published" | "retired";
  approvedBy?: string;
  approvedAt?: string;
};

/** RINPO may author a funnel draft, but publishing always requires recorded human approval. */
export function canPublishFunnel(funnel: FunnelVersion): boolean {
  return funnel.status === "approved" && Boolean(funnel.approvedBy && funnel.approvedAt);
}

export function nextBestGrowthAction(lead: CanonicalGrowthLead): "suppress" | "request_consent" | "qualify" | "follow_up" {
  const outreach = canContactGrowthLead(lead);
  if (!outreach.allowed) return outreach.reason === "suppressed" ? "suppress" : "request_consent";
  return lead.score >= 0.5 ? "follow_up" : "qualify";
}
