import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COMPANY_OS_EVENTS,
  capacityScore,
  computeClientHealth,
  isCompanyOsEvent,
  isCompanyOsOrg,
  mergeApprovalInbox,
  openApprovalsOnly,
  rankAssignees,
  scoreAssignee,
} from "../src/index";

describe("isCompanyOsOrg", () => {
  it("requires operator flag unless demo/feature forced", () => {
    assert.equal(isCompanyOsOrg({}), false);
    assert.equal(isCompanyOsOrg({ isPlatformOperator: true }), true);
    assert.equal(isCompanyOsOrg({ featureCompanyOs: true }), true);
    assert.equal(isCompanyOsOrg({ demoForced: true }), true);
  });
});

describe("events catalog", () => {
  it("includes core lifecycle events", () => {
    assert.ok(COMPANY_OS_EVENTS.includes("lead.created"));
    assert.ok(COMPANY_OS_EVENTS.includes("approval.requested"));
    assert.ok(isCompanyOsEvent("task.completed"));
    assert.equal(isCompanyOsEvent("random.event"), false);
  });
});

describe("assignment scoring", () => {
  it("multiplies clamped factors", () => {
    const score = scoreAssignee({
      skillMatch: 1,
      availability: 1,
      currentCapacity: 0.5,
      deadlineUrgency: 1,
      clientPriority: 1,
      historicalDeliveryQuality: 1,
      costEfficiency: 1,
      dependencyFit: 1,
    });
    assert.equal(score, 0.5);
  });

  it("ranks assignees by score", () => {
    const ranked = rankAssignees([
      {
        workerId: "a",
        displayName: "A",
        factors: {
          skillMatch: 0.5,
          availability: 1,
          currentCapacity: 1,
          deadlineUrgency: 1,
          clientPriority: 1,
          historicalDeliveryQuality: 1,
          costEfficiency: 1,
          dependencyFit: 1,
        },
      },
      {
        workerId: "b",
        displayName: "B",
        factors: {
          skillMatch: 1,
          availability: 1,
          currentCapacity: 1,
          deadlineUrgency: 1,
          clientPriority: 1,
          historicalDeliveryQuality: 1,
          costEfficiency: 1,
          dependencyFit: 1,
        },
      },
    ]);
    assert.equal(ranked[0]?.workerId, "b");
  });

  it("capacityScore falls as commitment rises", () => {
    assert.ok(capacityScore(40, 10) > capacityScore(40, 35));
  });
});

describe("approvals facade", () => {
  it("merges runtime + rinpo + company_os queues", () => {
    const inbox = mergeApprovalInbox({
      runtime: [
        {
          id: "r1",
          organization_id: "o",
          title: "Deploy",
          status: "pending",
          created_at: "2026-10-16T10:00:00Z",
        },
      ],
      rinpo: [
        {
          id: "x1",
          organization_id: "o",
          tool: "ops",
          action: "refund",
          status: "awaiting_approval",
          created_at: "2026-10-16T11:00:00Z",
          risk: "high",
        },
      ],
      companyOs: [
        {
          id: "c1",
          organization_id: "o",
          source: "company_os",
          source_id: "s1",
          title: "Proposal",
          reason: "threshold",
          risk: "high",
          requester_label: "Sales",
          company_id: null,
          project_id: null,
          financial_impact: 100,
          currency: "INR",
          rinpo_recommendation: "Review",
          status: "awaiting_approval",
          created_at: "2026-10-16T12:00:00Z",
        },
      ],
    });
    assert.equal(inbox.length, 3);
    assert.equal(openApprovalsOnly(inbox).length, 3);
    assert.equal(inbox[0]?.source, "company_os");
  });
});

describe("client health", () => {
  it("returns null without signals", () => {
    assert.equal(computeClientHealth({}), null);
  });

  it("computes transparent score from available signals only", () => {
    const result = computeClientHealth({
      overdueInvoiceCount: 1,
      openProjectAtRiskCount: 0,
    });
    assert.ok(result);
    assert.ok(result!.score <= 100);
    assert.match(result!.formula, /Missing signals are omitted/i);
  });
});
