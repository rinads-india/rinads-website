export type StudioJobStatus =
  | "draft"
  | "generating"
  | "review"
  | "changes_requested"
  | "approved"
  | "published"
  | "cancelled";

export type StudioRightsRecord = {
  assetId: string;
  ownerOrLicensee: string;
  usageApproved: boolean;
  recordedAt: string;
};

export type StudioCreativeJob = {
  id: string;
  organizationId: string;
  title: string;
  status: StudioJobStatus;
  sourceAssetIds: string[];
  rights: StudioRightsRecord[];
  deliverables: Array<{
    id: string;
    kind: "image" | "video" | "copy" | "layout" | "export";
    uri?: string;
  }>;
  qaPassed: boolean;
  approvedBy?: string;
  approvedAt?: string;
  publishTarget?: string;
};

export type StudioPublishDecision = {
  allowed: boolean;
  reasons: string[];
};

export function evaluateStudioPublish(job: StudioCreativeJob): StudioPublishDecision {
  const reasons: string[] = [];
  if (job.status !== "approved") reasons.push("job_not_approved");
  if (!job.qaPassed) reasons.push("qa_not_passed");
  if (!job.approvedBy || !job.approvedAt) reasons.push("human_approval_missing");
  if (job.deliverables.length === 0) reasons.push("deliverable_missing");

  const coveredAssets = new Set(job.rights.filter((record) => record.usageApproved).map((record) => record.assetId));
  if (job.sourceAssetIds.some((assetId) => !coveredAssets.has(assetId))) reasons.push("rights_or_consent_missing");

  return { allowed: reasons.length === 0, reasons };
}

export type StudioGenerationRequest = {
  organizationId: string;
  jobId: string;
  prompt: string;
  sourceAssetIds: string[];
  provider: string;
  requestedBy: string;
};

/** Provider calls are job-scoped; raw provider output is always a draft until reviewed. */
export function generationOutputStatus(): StudioJobStatus {
  return "review";
}

export function assertStudioPublishable(job: StudioCreativeJob): void {
  const decision = evaluateStudioPublish(job);
  if (!decision.allowed) throw new Error(`STUDIO_PUBLISH_BLOCKED:${decision.reasons.join(",")}`);
}
