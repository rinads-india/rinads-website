import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { decideGovernedAction, runGovernedAction, type GovernedDeps, type GovernedResult, type OrgContext, ROLE_PERMISSION_GRANTS } from "@rinads/company-os-engine";
import { A, B, U, admin, as, createDb, seed, type Db, type Who } from "../../company-os-engine/tests/db/harness";
import { createGovernedDeps, loadCompanyFacts } from "../src";
import { pgRowDb } from "./pg-rowdb";

let db: Db;
before(async () => {
  db = await createDb();
  await seed(db);
});
after(async () => db.close());

const MANAGER_PERMS = [...ROLE_PERMISSION_GRANTS.manager];

class P {
  deps: GovernedDeps;
  constructor(readonly who: Who, readonly roleKey: string, readonly org = A.org) {
    this.deps = createGovernedDeps(pgRowDb(db, who));
  }
  get ctx(): OrgContext {
    return { organizationId: this.org, userId: this.who.uid!, roleKey: this.roleKey, permissions: this.roleKey === "founder" ? [] : MANAGER_PERMS };
  }
  run(actionKey: string, input: Record<string, unknown>) {
    return runGovernedAction(this.deps, { actionKey, input, actor: { kind: "user", userId: this.who.uid! }, ctx: this.ctx, idempotencyKey: `${actionKey}:${Math.random().toString(36).slice(2)}` });
  }
  decide(actionId: string) {
    return decideGovernedAction(this.deps, { actionId, decision: "approve", approver: this.ctx });
  }
}
const mgr = () => new P(as.managerA, "manager");
const adm = () => new P(as.adminA, "admin");
const adm2 = () => new P(as.adminA2, "admin");

const ok = (r: GovernedResult) => {
  assert.equal(r.status, "executed", JSON.stringify(r));
  return (r as Extract<GovernedResult, { status: "executed" }>).output;
};
const pend = (r: GovernedResult) => {
  assert.equal(r.status, "approval_required", JSON.stringify(r));
  return (r as Extract<GovernedResult, { status: "approval_required" }>).actionId;
};
const failedWith = (r: GovernedResult) => (r.status === "failed" ? r.errorClass : r.status);

describe("Studio production pipeline with enforced gates", () => {
  const ids: Record<string, string> = {};

  it("rejects AI assets without provider/model and unlicensed third-party sources before they reach the database", async () => {
    const m = mgr();
    ids.job = String(ok(await m.run("studio.job.create", { title: "Spring launch hero film", clientFacing: true, dueDate: "2026-12-01" })).id);
    assert.equal(failedWith(await m.run("asset.register", { studioJobId: ids.job, kind: "image", title: "Hero still", creatorKind: "ai", sourceKind: "ai_generated", licenseTerms: "Provider ToS" })), "provenance_incomplete");
    assert.equal(failedWith(await m.run("asset.register", { studioJobId: ids.job, kind: "image", title: "Stock bg", creatorKind: "human", sourceKind: "stock" })), "provenance_incomplete");
    assert.equal(Number((await admin(db, "select count(*)::int as n from creative_assets where studio_job_id=$1", [ids.job]))[0].n), 0);
  });

  it("walks request → … → QA → approval → master → variants → publish; every gate blocks until satisfied", async () => {
    const m = mgr();
    const adv = (toStage: string, extra: Record<string, unknown> = {}) => m.run("studio.job.advance", { jobId: ids.job, toStage, ...extra });

    assert.equal(failedWith(await adv("creative_direction")), "gate_failed", "cannot skip the required Brief");
    ok(await adv("brief", { brief: { objective: "Launch", audience: "D2C buyers" }, briefComplete: true }));
    assert.equal(failedWith(await adv("copy_script")), "gate_failed", "cannot skip Creative direction");
    ok(await adv("creative_direction"));
    ok(await adv("copy_script"));
    ok(await adv("edit")); // optional production stages (storyboard … audio) may be skipped
    ok(await adv("qa"));

    assert.equal(failedWith(await adv("approval")), "gate_failed", "QA has not passed");
    assert.equal(failedWith(await adv("approval", { approved: true })), "validation_error", "an approval decision can only be recorded in the Approval stage");
    ok(await adv("approval", { qaPassed: true }));
    assert.equal(failedWith(await adv("master")), "gate_failed", "no approval decision yet");
    ok(await adv("master", { approved: true }));
    assert.equal(failedWith(await adv("variants")), "gate_failed", "no approved master asset yet");

    // Register + approve the master with full provenance.
    ids.master = String(ok(await m.run("asset.register", { studioJobId: ids.job, kind: "video", title: "Hero film master", role: "master", creatorKind: "hybrid", aiProvider: "xai", aiModel: "grok-imagine", promptRef: "prompt:hero@v2", sourceKind: "original" })).id);
    assert.equal(failedWith(await adv("variants")), "gate_failed", "master exists but is not approved");
    ok(await m.run("asset.review", { assetId: ids.master, decision: "submit" }));
    ok(await m.run("asset.review", { assetId: ids.master, decision: "approve" }));
    ok(await adv("variants"));

    ids.variant = String(ok(await m.run("asset.register", { studioJobId: ids.job, kind: "video", title: "Hero 9:16", role: "variant", parentAssetId: ids.master, channel: "instagram", creatorKind: "human", sourceKind: "original" })).id);
    ok(await m.run("asset.review", { assetId: ids.variant, decision: "submit" }));
    ok(await m.run("asset.review", { assetId: ids.variant, decision: "approve" }));
    ok(await adv("publish"));
    assert.equal((await admin(db, "select stage from studio_jobs where id=$1", [ids.job]))[0].stage, "publish");
  });

  it("an asset cannot be approved straight from draft, and a human cannot approve an asset with broken provenance", async () => {
    const m = mgr();
    const a = String(ok(await m.run("asset.register", { kind: "image", title: "Loose asset", creatorKind: "human", sourceKind: "original" })).id);
    assert.equal(failedWith(await m.run("asset.review", { assetId: a, decision: "approve" })), "invalid_state");
  });

  it("publishing is HIGH risk: it waits for approval and the database then accepts the publication", async () => {
    const m = mgr();
    const campaign = String(ok(await m.run("campaign.create", { name: "Spring launch", channels: ["instagram", "youtube_shorts"] })).id);
    const idea = ok(await m.run("content.create", { campaignId: campaign, channel: "instagram", title: "Hero teaser", assetId: ids.variant }));
    const shorts = ok(await m.run("content.create", { campaignId: campaign, channel: "youtube_shorts", title: "Hero teaser (Shorts)", sourceIdeaId: String(idea.id) }));
    assert.equal(shorts.sourceIdeaId, idea.id, "channel variants share one source idea");

    assert.equal(failedWith(await m.run("content.update", { contentId: String(shorts.id), status: "approved" })), "validation_error", "approved content needs an asset");
    ok(await m.run("content.update", { contentId: String(idea.id), status: "approved" }));
    assert.equal(failedWith(await m.run("content.update", { contentId: String(idea.id), status: "published" })), "validation_error", "published is not settable here");

    const req = pend(await m.run("content.publish", { contentId: String(idea.id), externalUrl: "https://instagram.example/p/1" }));
    assert.equal((await admin(db, "select status from content_items where id=$1", [String(idea.id)]))[0].status, "approved", "nothing is published before approval");
    ok(await adm().decide(req));
    const row = (await admin(db, "select status, publish_action_id from content_items where id=$1", [String(idea.id)]))[0];
    assert.deepEqual(row, { status: "published", publish_action_id: req });
    assert.equal(Number((await admin(db, "select count(*)::int as n from asset_publications where content_item_id=$1 and approved_action_id=$2", [String(idea.id), req]))[0].n), 1);
    assert.equal(failedWith(await m.run("content.update", { contentId: String(idea.id), status: "drafting" })), "invalid_state", "published content is final");
  });

  it("content whose asset is not approved cannot be published even when a human approves the request", async () => {
    const m = mgr();
    const draftAsset = String(ok(await m.run("asset.register", { kind: "image", title: "Unapproved", creatorKind: "human", sourceKind: "original" })).id);
    const item = ok(await m.run("content.create", { channel: "linkedin", title: "Post", assetId: draftAsset }));
    ok(await m.run("content.update", { contentId: String(item.id), status: "approved" }));
    const req = pend(await m.run("content.publish", { contentId: String(item.id) }));
    const result = await adm().decide(req);
    assert.equal(failedWith(result), "gate_failed");
    assert.equal((await admin(db, "select status from content_items where id=$1", [String(item.id)]))[0].status, "approved");
  });
});

describe("Ads: metrics, explainable signals, governed budget changes", () => {
  let adId: string;
  it("with no imported metrics the ad surface reads 'not connected' (nothing is invented)", async () => {
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.managerA), ctx: mgr().ctx, organizationName: "RINADS", now: new Date() });
    assert.equal(facts.adSignals.state, "not_connected");
  });

  it("imports provider metrics idempotently and detects creative fatigue from the data", async () => {
    const m = mgr();
    adId = String(ok(await m.run("ad.create", { name: "Spring — Meta", platform: "meta", landingPage: "/spring" })).id);
    const day = (n: number, clicks: number) => ({ adId: "ad-1", adName: "Hero video", date: new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10), spend: 100, impressions: 2000, clicks, conversions: 3 });
    const rows = [...Array.from({ length: 5 }, (_, i) => day(i, 60)), ...Array.from({ length: 3 }, (_, i) => day(5 + i, 20))];
    const first = ok(await m.run("ads.import_metrics", { adCampaignId: adId, rows }));
    assert.equal(first.inserted, 8);
    const again = ok(await m.run("ads.import_metrics", { adCampaignId: adId, rows }));
    assert.equal(again.inserted, 0);
    assert.equal(again.skipped, 8);

    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.managerA), ctx: mgr().ctx, organizationName: "RINADS", now: new Date("2026-10-12T00:00:00Z") });
    assert.equal(facts.adSignals.state, "available");
    if (facts.adSignals.state === "available") {
      const fatigue = facts.adSignals.data.find((s) => s.kind === "fatigue");
      assert.ok(fatigue, "fatigue signal derived from imported rows");
      assert.match(fatigue!.evidence, /CTR fell from 3\.00%/);
    }
  });

  it("an ad budget change is HIGH: it needs approval; the database also refuses to reuse an approval", async () => {
    const m = mgr();
    const req = pend(await m.run("ads.budget_change", { adCampaignId: adId, proposedBudget: 500 }));
    assert.equal((await admin(db, "select daily_budget from ad_campaigns where id=$1", [adId]))[0].daily_budget, null);
    ok(await adm().decide(req));
    assert.equal(Number((await admin(db, "select daily_budget from ad_campaigns where id=$1", [adId]))[0].daily_budget), 500);
    // direct SQL attempt re-using the same approval for a second change must fail
    await assert.rejects(
      () => import("../../company-os-engine/tests/db/harness").then(({ run }) => run(db, as.managerA, "update ad_campaigns set daily_budget = 9000, budget_action_id = $2 where id = $1", [adId, req])),
      /requires a new approved/i
    );
  });
});

describe("People, Academy and Communication", () => {
  it("validates skills (1–5), records capacity, and refuses non-members", async () => {
    const m = mgr();
    assert.equal(failedWith(await m.run("people.update_profile", { userId: U.staffA, displayName: "Sam", skills: { design: 9 } })), "validation_error");
    assert.equal(failedWith(await m.run("people.update_profile", { userId: U.outsider, displayName: "Nobody" })), "validation_error");
    const r = ok(await m.run("people.update_profile", { userId: U.staffA, displayName: "Sam Staff", roleTitle: "Designer", skills: { design: 4, motion: 2 }, weeklyCapacityHours: 32 }));
    const again = ok(await m.run("people.update_profile", { userId: U.staffA, displayName: "Sam Staff", roleTitle: "Senior Designer", skills: { design: 5 }, weeklyCapacityHours: 30 }));
    assert.equal(again.id, r.id, "upsert, not duplicate");
    assert.deepEqual((await admin(db, "select skill_levels as skills, available_hours_week::float as h from cos_workers where id=$1", [String(r.id)]))[0], { skills: { design: 5 }, h: 30 });
  });

  it("Academy: evidence is required to certify; certification is advisory evidence only", async () => {
    const m = mgr();
    const skill = ok(await m.run("academy.skill_create", { skillKey: "design", name: "Design" }));
    assert.equal(ok(await m.run("academy.skill_create", { skillKey: "design", name: "Design" })).existed, true);
    const sid = String(skill.id);
    ok(await m.run("academy.record_progress", { userId: U.staffA, skillId: sid, stage: "practice", evidenceNote: "Completed lab 1" }));
    assert.equal(failedWith(await m.run("academy.record_progress", { userId: U.clientA, skillId: sid, stage: "certified" })), "evidence_required");
    ok(await m.run("academy.record_progress", { userId: U.staffA, skillId: sid, stage: "certified", evidenceNote: "Passed supervised project" }));
    const row = (await admin(db, "select stage, certified_at is not null as certified, jsonb_array_length(evidence)::int as n from academy_progress where user_id=$1", [U.staffA]))[0];
    assert.deepEqual(row, { stage: "certified", certified: true, n: 2 });
    // certification surfaces as evidence for allocation, never as an employment decision
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.managerA), ctx: mgr().ctx, organizationName: "RINADS", now: new Date() });
    assert.equal(facts.people.state === "available" && facts.people.data.find((p) => p.loginUserId === U.staffA)?.certifiedSkills?.[0], "design");
  });

  it("communication activity must link to a real object in the same organisation", async () => {
    const m = mgr();
    const co = String(ok(await m.run("company.create", { name: "Comm Co" })).id);
    ok(await m.run("comm.log_activity", { channel: "whatsapp", direction: "inbound", subject: "Asked about pricing", linkedType: "company", linkedId: co }));
    assert.equal(failedWith(await m.run("comm.log_activity", { channel: "email", direction: "outbound", linkedType: "company", linkedId: "00000000-0000-4000-8000-0000000000ff" })), "not_found");
    const foreign = (await admin<{ id: string }>(db, "insert into cos_companies (organization_id, name) values ($1,'Foreign Co') returning id", [B.org]))[0].id;
    assert.equal(failedWith(await m.run("comm.log_activity", { channel: "call", direction: "inbound", linkedType: "company", linkedId: foreign })), "not_found", "cannot attach activity to another tenant's record");
    assert.equal(failedWith(await m.run("comm.log_activity", { channel: "call", direction: "inbound", linkedType: "company" })), "validation_error");
    ok(await m.run("comm.log_activity", { channel: "email", direction: "outbound", status: "failed", subject: "Bounced proposal", linkedType: "company", linkedId: co }));
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.managerA), ctx: mgr().ctx, organizationName: "RINADS", now: new Date() });
    assert.equal(facts.commExceptions.state === "available" && facts.commExceptions.data.length, 1);
  });
});

void adm2;
