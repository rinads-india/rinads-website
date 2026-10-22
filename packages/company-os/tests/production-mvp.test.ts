import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canActorAccessProductionSecrets,
  canContactGrowthLead,
  canPublishFunnel,
  evaluateStudioPublish,
  evaluateWorkAssignment,
  growthLeadIdempotencyKey,
  issueRinadsVerification,
  normalizeGrowthLead,
  type StudioCreativeJob,
  type WorkActorProfile,
  type WorkUnit,
} from "../src/index";

describe("production MVP governance contracts", () => {
  it("blocks cross-tenant work allocation and missing permissions", () => {
    const unit: WorkUnit = {
      id: "work_1",
      organizationId: "org_a",
      title: "Campaign QA",
      status: "ready",
      requiredSkills: ["performance-marketing"],
      requiredPermissions: ["growth.write"],
      evidence: [],
      approvalRequired: true,
    };
    const actor: WorkActorProfile = {
      actorId: "intern_1",
      kind: "human",
      organizationId: "org_b",
      skills: ["performance-marketing"],
      available: true,
      workload: 0.2,
      permissions: [],
    };
    const decision = evaluateWorkAssignment(unit, actor);
    assert.equal(decision.allowed, false);
    assert.ok(decision.reasons.includes("tenant_mismatch"));
    assert.ok(decision.reasons.includes("missing_permission"));
  });

  it("never gives agents or unprivileged interns production-secret access", () => {
    assert.equal(canActorAccessProductionSecrets({
      actorId: "rinpo",
      kind: "agent",
      organizationId: "org_a",
      skills: [],
      available: true,
      workload: 0,
      permissions: ["production.secrets.read"],
    }), false);
    assert.equal(canActorAccessProductionSecrets({
      actorId: "intern",
      kind: "human",
      organizationId: "org_a",
      skills: [],
      available: true,
      workload: 0,
      permissions: [],
    }), false);
  });

  it("issues RINADS Verified only from approved work with evidence", () => {
    const unit: WorkUnit = {
      id: "work_verified",
      organizationId: "org_a",
      title: "Deploy verified change",
      status: "approved",
      requiredSkills: [],
      requiredPermissions: [],
      approvalRequired: true,
      approvedBy: "founder_1",
      approvedAt: "2026-10-22T01:00:00Z",
      evidence: [{
        id: "evidence_1",
        kind: "commit",
        uri: "github:sha",
        createdAt: "2026-10-22T00:59:00Z",
        submittedBy: "developer_1",
      }],
    };
    assert.equal(issueRinadsVerification(unit).status, "verified");
    assert.throws(() => issueRinadsVerification({ ...unit, evidence: [] }), /WORK_EVIDENCE_REQUIRED/);
  });

  it("deduplicates leads per tenant/source/identity and honors consent", () => {
    const input = {
      organizationId: "org_a",
      source: "form" as const,
      phone: "+919876543210",
      consentToContact: true,
      receivedAt: "2026-10-22T01:00:00Z",
    };
    assert.equal(growthLeadIdempotencyKey(input), "org_a:form:+919876543210");
    assert.equal(normalizeGrowthLead(input).stage, "received");
    assert.deepEqual(canContactGrowthLead({ consentToContact: false }), { allowed: false, reason: "consent_required" });
    assert.deepEqual(canContactGrowthLead({ consentToContact: true, suppressed: true }), { allowed: false, reason: "suppressed" });
  });

  it("requires human approval before funnel publish", () => {
    assert.equal(canPublishFunnel({ id: "f1", organizationId: "org_a", version: 1, status: "approved" }), false);
    assert.equal(canPublishFunnel({
      id: "f1",
      organizationId: "org_a",
      version: 1,
      status: "approved",
      approvedBy: "owner_1",
      approvedAt: "2026-10-22T01:00:00Z",
    }), true);
  });

  it("blocks Studios publish without rights, QA and human approval", () => {
    const job: StudioCreativeJob = {
      id: "studio_1",
      organizationId: "org_a",
      title: "Product reel",
      status: "approved",
      sourceAssetIds: ["asset_1"],
      rights: [{ assetId: "asset_1", ownerOrLicensee: "client", usageApproved: true, recordedAt: "2026-10-22T01:00:00Z" }],
      deliverables: [{ id: "render_1", kind: "video", uri: "asset://render_1" }],
      qaPassed: true,
      approvedBy: "client_1",
      approvedAt: "2026-10-22T01:02:00Z",
    };
    assert.equal(evaluateStudioPublish(job).allowed, true);
    assert.equal(evaluateStudioPublish({ ...job, rights: [] }).allowed, false);
    assert.equal(evaluateStudioPublish({ ...job, qaPassed: false }).allowed, false);
  });
});
