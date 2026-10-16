/**
 * RINADS Studio — one shared production workflow plus creative-asset provenance.
 *
 * Request → Brief → Strategy → Creative Direction → Copy/Script → Storyboard → Design → Image
 * → Video → Animation → VFX → Audio/Voice → Edit → QA → Approval → Master → Channel Variants
 * → Publish → Performance
 *
 * Production stages in the middle are optional per job type (a blog graphic has no VFX), but the
 * gates are not: nothing reaches Approval without QA, no Master without Approval, and nothing is
 * Published without an approved Master and — for client content — an explicit approval decision.
 */

export const STUDIO_STAGES = [
  "request",
  "brief",
  "strategy",
  "creative_direction",
  "copy_script",
  "storyboard",
  "design",
  "image",
  "video",
  "animation",
  "vfx",
  "audio_voice",
  "edit",
  "qa",
  "approval",
  "master",
  "variants",
  "publish",
  "performance",
] as const;

export type StudioStage = (typeof STUDIO_STAGES)[number];

export const STUDIO_STAGE_LABEL: Record<StudioStage, string> = {
  request: "Request",
  brief: "Brief",
  strategy: "Strategy",
  creative_direction: "Creative direction",
  copy_script: "Copy / script",
  storyboard: "Storyboard",
  design: "Design",
  image: "Image production",
  video: "Video",
  animation: "Animation",
  vfx: "VFX",
  audio_voice: "Audio / voice",
  edit: "Editing",
  qa: "QA",
  approval: "Approval",
  master: "Master",
  variants: "Platform variations",
  publish: "Publishing",
  performance: "Performance",
};

/** Stages that may be skipped depending on the job. */
export const OPTIONAL_STAGES: readonly StudioStage[] = [
  "strategy",
  "storyboard",
  "design",
  "image",
  "video",
  "animation",
  "vfx",
  "audio_voice",
  "edit",
];

export type StudioJobState = {
  stage: StudioStage;
  /** Stages already completed or explicitly skipped. */
  completed: readonly StudioStage[];
  briefComplete: boolean;
  qaPassed: boolean;
  approved: boolean;
  hasMasterAsset: boolean;
  /** Publishing client-facing content requires an explicit approval decision. */
  clientFacing: boolean;
  /** Provenance problems on assets attached to the job (from `assetProblems`). */
  openProvenanceProblems: number;
};

export type GateResult = { ok: true } | { ok: false; reason: string };

export function stageIndex(stage: StudioStage): number {
  return STUDIO_STAGES.indexOf(stage);
}

export function canAdvanceStage(job: StudioJobState, to: StudioStage): GateResult {
  const from = stageIndex(job.stage);
  const target = stageIndex(to);
  if (target < 0) return { ok: false, reason: `Unknown stage ${to}` };
  if (target === from) return { ok: false, reason: `Job is already in ${STUDIO_STAGE_LABEL[to]}` };

  // Rework: moving backwards is always allowed (e.g. QA failed → edit), but clears downstream gates in the caller.
  if (target < from) return { ok: true };

  // Forward: only skip optional stages.
  for (let i = from + 1; i < target; i++) {
    const s = STUDIO_STAGES[i];
    if (!OPTIONAL_STAGES.includes(s) && !job.completed.includes(s) && s !== "performance") {
      return { ok: false, reason: `Cannot skip required stage: ${STUDIO_STAGE_LABEL[s]}` };
    }
  }

  if (target > stageIndex("brief") && !job.briefComplete) {
    return { ok: false, reason: "A complete brief is required before production work." };
  }
  if (target >= stageIndex("approval") && !job.qaPassed) {
    return { ok: false, reason: "QA must pass before approval." };
  }
  if (target >= stageIndex("master") && !job.approved) {
    return { ok: false, reason: "An approval decision is required before a master can be created." };
  }
  if (target >= stageIndex("variants") && !job.hasMasterAsset) {
    return { ok: false, reason: "A master asset must be registered before channel variants." };
  }
  if (to === "publish") {
    if (!job.hasMasterAsset || !job.approved) {
      return { ok: false, reason: "Only an approved master can be published." };
    }
    if (job.openProvenanceProblems > 0) {
      return { ok: false, reason: `${job.openProvenanceProblems} asset(s) have incomplete provenance or licensing.` };
    }
  }
  return { ok: true };
}

/** Publishing is consequential: client-facing publish ALWAYS needs an approval decision; internal publish is MEDIUM. */
export function publishRequiresApproval(job: Pick<StudioJobState, "clientFacing">): boolean {
  return job.clientFacing;
}

// ── Asset provenance ──────────────────────────────────────────────────────────

export type AssetKind =
  | "image"
  | "video"
  | "audio"
  | "voice"
  | "animation"
  | "vfx"
  | "design"
  | "copy"
  | "script"
  | "storyboard"
  | "document";

export type CreatorKind = "human" | "ai" | "hybrid";

export type SourceKind = "original" | "client_supplied" | "stock" | "ai_generated" | "third_party";

export type AssetRecord = {
  id: string;
  kind: AssetKind;
  title: string;
  version: number;
  role: "working" | "master" | "variant";
  parentAssetId: string | null;
  creatorKind: CreatorKind;
  creatorUserId: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  /** Reference (id/URL) to the stored prompt/version that produced the asset; never the secret prompt itself. */
  promptRef: string | null;
  sourceKind: SourceKind;
  licenseTerms: string | null;
  licenseRef: string | null;
  companyId: string | null;
  campaignId: string | null;
  projectId: string | null;
  approvalStatus: "draft" | "submitted" | "approved" | "rejected";
  channel: string | null;
  storagePath: string | null;
};

export type AssetProblem = { code: string; message: string; blocking: boolean };

export function assetProblems(asset: AssetRecord): AssetProblem[] {
  const problems: AssetProblem[] = [];
  const add = (code: string, message: string, blocking = true) => problems.push({ code, message, blocking });

  if (asset.creatorKind === "human" || asset.creatorKind === "hybrid") {
    if (!asset.creatorUserId) add("creator_missing", "A human creator must be recorded.");
  }
  if (asset.creatorKind === "ai" || asset.creatorKind === "hybrid" || asset.sourceKind === "ai_generated") {
    if (!asset.aiProvider || !asset.aiModel) add("ai_model_missing", "AI-created assets must record provider and model.");
    if (!asset.promptRef) add("prompt_ref_missing", "Record a prompt/version reference for AI-created assets.", false);
  }
  if (asset.creatorKind === "human" && (asset.aiProvider || asset.aiModel)) {
    add("creator_mismatch", "A human-only asset must not carry AI provider/model.", false);
  }
  if (asset.sourceKind !== "original" && !asset.licenseTerms && !asset.licenseRef) {
    add("license_missing", `Source "${asset.sourceKind}" requires licence terms or a licence reference.`);
  }
  if (asset.role === "variant" && !asset.parentAssetId) add("parent_missing", "A variant must reference its master.");
  if (asset.role === "master" && asset.parentAssetId) add("master_has_parent", "A master must not have a parent.", false);
  if (asset.role === "variant" && !asset.channel) add("channel_missing", "A variant must name its channel.");
  if (!asset.companyId && !asset.campaignId && !asset.projectId) {
    add("no_context", "Link the asset to a client, campaign or project.", false);
  }
  if (asset.version < 1) add("bad_version", "Version must be 1 or higher.");
  return problems;
}

export function hasBlockingProblems(asset: AssetRecord): boolean {
  return assetProblems(asset).some((p) => p.blocking);
}

/** Detects parent cycles / dangling parents in a lineage graph. Returns the offending asset ids. */
export function findLineageProblems(assets: readonly Pick<AssetRecord, "id" | "parentAssetId">[]): { cycles: string[]; dangling: string[] } {
  const byId = new Map(assets.map((a) => [a.id, a]));
  const cycles: string[] = [];
  const dangling: string[] = [];
  for (const asset of assets) {
    if (asset.parentAssetId && !byId.has(asset.parentAssetId)) dangling.push(asset.id);
    const seen = new Set<string>([asset.id]);
    let cursor = asset.parentAssetId ? byId.get(asset.parentAssetId) : undefined;
    while (cursor) {
      if (seen.has(cursor.id)) {
        cycles.push(asset.id);
        break;
      }
      seen.add(cursor.id);
      cursor = cursor.parentAssetId ? byId.get(cursor.parentAssetId) : undefined;
    }
  }
  return { cycles: [...new Set(cycles)], dangling: [...new Set(dangling)] };
}

/** Can this asset be published? Requires approval, no blocking provenance problem. */
export function canPublishAsset(asset: AssetRecord): GateResult {
  if (asset.approvalStatus !== "approved") return { ok: false, reason: "Asset is not approved." };
  const blocking = assetProblems(asset).filter((p) => p.blocking);
  if (blocking.length > 0) return { ok: false, reason: blocking.map((p) => p.message).join(" ") };
  return { ok: true };
}
