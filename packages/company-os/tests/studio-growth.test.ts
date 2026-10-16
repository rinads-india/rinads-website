import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assetProblems,
  canAdvanceStage,
  canPublishAsset,
  classifyBudgetChange,
  detectAdSignals,
  findLineageProblems,
  groupByIdea,
  publishRequiresApproval,
  validateContentItem,
  DEFAULT_AD_THRESHOLDS,
  STUDIO_STAGES,
  type AdDay,
  type AssetRecord,
  type ContentItem,
  type StudioJobState,
} from "../src";

const job = (j: Partial<StudioJobState> = {}): StudioJobState => ({
  stage: "request",
  completed: [],
  briefComplete: true,
  qaPassed: false,
  approved: false,
  hasMasterAsset: false,
  clientFacing: true,
  openProvenanceProblems: 0,
  ...j,
});

describe("studio pipeline gates", () => {
  it("has the full 19-stage workflow in order", () => {
    assert.equal(STUDIO_STAGES.length, 19);
    assert.equal(STUDIO_STAGES[0], "request");
    assert.equal(STUDIO_STAGES[STUDIO_STAGES.length - 1], "performance");
  });

  it("allows skipping optional production stages but not required ones", () => {
    assert.equal(canAdvanceStage(job({ stage: "brief", completed: ["request"] }), "copy_script").ok, false, "creative_direction required");
    assert.equal(canAdvanceStage(job({ stage: "creative_direction", completed: ["request", "brief"] }), "copy_script").ok, true);
    assert.equal(canAdvanceStage(job({ stage: "copy_script", completed: ["request", "brief", "creative_direction"] }), "qa").ok, true, "optional design/image/video… may be skipped");
  });

  it("requires a complete brief before production", () => {
    assert.equal(canAdvanceStage(job({ stage: "brief", briefComplete: false, completed: ["request"] }), "creative_direction").ok, false);
  });

  it("QA before approval, approval before master, master before variants, approved master before publish", () => {
    const base = job({ stage: "edit", completed: ["request", "brief", "creative_direction", "copy_script"] });
    assert.equal(canAdvanceStage(base, "qa").ok, true);
    const qa = job({ ...base, stage: "qa", completed: [...base.completed, "edit"] });
    assert.equal(canAdvanceStage(qa, "approval").ok, false, "QA not passed");
    const ap = job({ ...qa, stage: "approval", completed: [...qa.completed, "qa"], qaPassed: true });
    assert.equal(canAdvanceStage(ap, "master").ok, false, "no approval decision");
    const m = job({ ...ap, stage: "master", completed: [...ap.completed, "approval"], qaPassed: true, approved: true });
    assert.equal(canAdvanceStage(m, "variants").ok, false, "no master asset");
    const v = job({ ...m, stage: "variants", completed: [...m.completed, "master"], hasMasterAsset: true });
    assert.equal(canAdvanceStage(v, "publish").ok, true);
    assert.equal(canAdvanceStage({ ...v, openProvenanceProblems: 2 }, "publish").ok, false, "provenance blocks publish");
    assert.equal(canAdvanceStage({ ...v, approved: false }, "publish").ok, false);
  });

  it("rework (moving backwards) is allowed; no-op is not", () => {
    assert.equal(canAdvanceStage(job({ stage: "qa" }), "edit").ok, true);
    assert.equal(canAdvanceStage(job({ stage: "qa" }), "qa").ok, false);
  });

  it("client-facing publish always needs an approval decision", () => {
    assert.equal(publishRequiresApproval({ clientFacing: true }), true);
    assert.equal(publishRequiresApproval({ clientFacing: false }), false);
  });
});

const asset = (a: Partial<AssetRecord> = {}): AssetRecord => ({
  id: "a1",
  kind: "image",
  title: "Hero",
  version: 1,
  role: "master",
  parentAssetId: null,
  creatorKind: "human",
  creatorUserId: "u1",
  aiProvider: null,
  aiModel: null,
  promptRef: null,
  sourceKind: "original",
  licenseTerms: null,
  licenseRef: null,
  companyId: "c1",
  campaignId: null,
  projectId: null,
  approvalStatus: "approved",
  channel: null,
  storagePath: "assets/a1.png",
  ...a,
});

describe("asset provenance", () => {
  it("accepts a clean human original", () => {
    assert.deepEqual(assetProblems(asset()), []);
    assert.equal(canPublishAsset(asset()).ok, true);
  });

  it("requires provider + model for AI-created assets and recommends a prompt reference", () => {
    const p = assetProblems(asset({ creatorKind: "ai", creatorUserId: null, sourceKind: "ai_generated", licenseTerms: "Provider ToS" }));
    assert.ok(p.some((x) => x.code === "ai_model_missing" && x.blocking));
    assert.ok(p.some((x) => x.code === "prompt_ref_missing" && !x.blocking));
    const ok = assetProblems(asset({ creatorKind: "ai", creatorUserId: null, sourceKind: "ai_generated", licenseTerms: "Provider ToS", aiProvider: "xai", aiModel: "grok-imagine", promptRef: "prompt:42@v3" }));
    assert.deepEqual(ok, []);
  });

  it("requires licensing for every non-original source", () => {
    for (const sourceKind of ["client_supplied", "stock", "third_party"] as const) {
      assert.ok(assetProblems(asset({ sourceKind })).some((x) => x.code === "license_missing"), sourceKind);
    }
    assert.deepEqual(assetProblems(asset({ sourceKind: "stock", licenseRef: "getty:123" })), []);
  });

  it("requires a human creator for human/hybrid work and a parent+channel for variants", () => {
    assert.ok(assetProblems(asset({ creatorUserId: null })).some((x) => x.code === "creator_missing"));
    const variant = assetProblems(asset({ role: "variant" }));
    assert.ok(variant.some((x) => x.code === "parent_missing"));
    assert.ok(variant.some((x) => x.code === "channel_missing"));
    assert.deepEqual(assetProblems(asset({ role: "variant", parentAssetId: "m1", channel: "instagram" })), []);
  });

  it("blocks publishing unapproved or provenance-broken assets", () => {
    assert.equal(canPublishAsset(asset({ approvalStatus: "submitted" })).ok, false);
    assert.equal(canPublishAsset(asset({ sourceKind: "stock" })).ok, false);
  });

  it("detects lineage cycles and dangling parents", () => {
    const r = findLineageProblems([
      { id: "a", parentAssetId: "b" },
      { id: "b", parentAssetId: "a" },
      { id: "c", parentAssetId: "ghost" },
      { id: "d", parentAssetId: null },
      { id: "e", parentAssetId: "d" },
    ]);
    assert.deepEqual(r.cycles.sort(), ["a", "b"]);
    assert.deepEqual(r.dangling, ["c"]);
  });
});

const item = (i: Partial<ContentItem> = {}): ContentItem => ({
  id: "i1",
  campaignId: "camp",
  sourceIdeaId: "idea1",
  channel: "instagram",
  status: "idea",
  title: "Launch teaser",
  assetId: null,
  scheduledAt: null,
  publishedAt: null,
  externalUrl: null,
  ...i,
});

describe("content model", () => {
  it("groups channel variants under one source idea", () => {
    const groups = groupByIdea([item({ id: "idea1" }), item({ id: "v2", channel: "youtube_shorts" }), item({ id: "v3", channel: "linkedin" }), item({ id: "other", sourceIdeaId: "idea2", channel: "email", title: "Other" })]);
    assert.equal(groups.length, 2);
    assert.equal(groups.find((g) => g.sourceIdeaId === "idea1")!.variants.length, 3);
  });

  it("validates scheduling, publishing and asset requirements", () => {
    assert.ok(validateContentItem(item({ status: "scheduled" })).some((p) => p.code === "no_schedule"));
    assert.ok(validateContentItem(item({ status: "published" })).some((p) => p.code === "no_publish_time"));
    assert.ok(validateContentItem(item({ status: "approved" })).some((p) => p.code === "no_asset"));
    assert.deepEqual(validateContentItem(item({ status: "approved", channel: "paid_ads" })), []);
    assert.deepEqual(validateContentItem(item({ status: "approved", assetId: "a1" })), []);
  });
});

function days(adId: string, rows: Partial<AdDay>[], extra: Partial<AdDay> = {}): AdDay[] {
  return rows.map((r, i) => ({
    adId,
    adName: `Ad ${adId}`,
    campaignId: "camp",
    platform: "meta",
    date: `2026-10-${String(1 + i).padStart(2, "0")}`,
    spend: 100,
    impressions: 2000,
    clicks: 40,
    conversions: 4,
    ...extra,
    ...r,
  }));
}

describe("ad signals", () => {
  it("returns nothing when no metrics were imported (never invents performance)", () => {
    assert.deepEqual(detectAdSignals([]), []);
  });

  it("detects fatigue from a CTR decline with enough volume", () => {
    const rows = days("a", [
      ...Array.from({ length: 5 }, () => ({ clicks: 60 })), // 3.0% CTR
      ...Array.from({ length: 3 }, () => ({ clicks: 20 })), // 1.0% CTR
    ]);
    const s = detectAdSignals(rows);
    const f = s.find((x) => x.kind === "fatigue");
    assert.ok(f, "fatigue signal expected");
    assert.match(f!.evidence, /CTR fell from 3\.00%/);
    assert.equal(f!.requiresApproval, false);
  });

  it("does not flag fatigue on tiny volume", () => {
    const rows = days("a", [...Array.from({ length: 5 }, () => ({ impressions: 50, clicks: 5 })), ...Array.from({ length: 3 }, () => ({ impressions: 50, clicks: 0 }))]);
    assert.equal(detectAdSignals(rows).filter((x) => x.kind === "fatigue").length, 0);
  });

  it("only applies CTR / cost thresholds when the operator configured them", () => {
    const rows = days("a", Array.from({ length: 4 }, () => ({ clicks: 4, conversions: 0, spend: 500 })));
    assert.equal(detectAdSignals(rows).filter((x) => x.kind === "low_ctr" || x.kind === "high_cost_per_conversion").length, 0, "no default thresholds");
    const configured = detectAdSignals(rows, { ...DEFAULT_AD_THRESHOLDS, minCtrPct: 1, maxCostPerConversion: 200, minClicks: 10 });
    assert.ok(configured.some((x) => x.kind === "low_ctr" && x.basis === "configured_threshold"));
    const spend = configured.find((x) => x.kind === "high_cost_per_conversion");
    assert.equal(spend?.severity, "critical", "spend with zero conversions");
    assert.equal(spend?.requiresApproval, true, "budget changes always need approval");
  });

  it("detects a winning hook only with enough clicks per group and a clear lead", () => {
    const rows = [
      ...days("h1", Array.from({ length: 3 }, () => ({ clicks: 40, conversions: 8 })), { hook: "Before/after" }),
      ...days("h2", Array.from({ length: 3 }, () => ({ clicks: 40, conversions: 1 })), { hook: "Feature list" }),
    ];
    const w = detectAdSignals(rows).find((s) => s.kind === "winning_hook");
    assert.ok(w);
    assert.match(w!.title, /Before\/after/);
  });

  it("flags landing mismatch: good CTR, poor click→conversion vs portfolio", () => {
    const rows = [
      ...days("good", Array.from({ length: 3 }, () => ({ clicks: 40, conversions: 10 }))),
      ...days("bad", Array.from({ length: 3 }, () => ({ clicks: 60, conversions: 1 })), { landingPage: "/pricing" }),
    ];
    const s = detectAdSignals(rows).find((x) => x.kind === "landing_mismatch" && x.adId === "bad");
    assert.ok(s);
    assert.match(s!.evidence, /\/pricing/);
  });

  it("budget changes are classified by size and absolute threshold", () => {
    assert.equal(classifyBudgetChange(100, 110).risk, "MEDIUM");
    assert.equal(classifyBudgetChange(100, 150).risk, "HIGH");
    assert.equal(classifyBudgetChange(0, 50).risk, "HIGH");
    assert.equal(classifyBudgetChange(100, 5000, { maxAutoChangePct: 20, highBudgetThreshold: 1000 }).risk, "CRITICAL");
  });
});
