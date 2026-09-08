import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionCampaignStatus,
  nextCampaignStatuses,
  isTerminalCampaignStatus,
  matchesSegment,
  computeAttentionItems,
  type SegmentMatchInput,
} from "../src/index";

describe("Campaign state machine", () => {
  it("allows the happy path lifecycle", () => {
    assert.ok(canTransitionCampaignStatus("draft", "approved"));
    assert.ok(canTransitionCampaignStatus("approved", "sending"));
    assert.ok(canTransitionCampaignStatus("sending", "completed"));
  });

  it("allows cancellation before sending starts, not after", () => {
    assert.ok(canTransitionCampaignStatus("draft", "cancelled"));
    assert.ok(canTransitionCampaignStatus("approved", "cancelled"));
    assert.ok(!canTransitionCampaignStatus("sending", "cancelled"));
  });

  it("rejects invalid transitions", () => {
    assert.ok(!canTransitionCampaignStatus("draft", "sending"));
    assert.ok(!canTransitionCampaignStatus("draft", "completed"));
    assert.ok(!canTransitionCampaignStatus("completed", "draft"));
    assert.ok(!canTransitionCampaignStatus("draft", "draft"));
  });

  it("reports terminal states with no further transitions", () => {
    assert.ok(isTerminalCampaignStatus("completed"));
    assert.ok(isTerminalCampaignStatus("partially_failed"));
    assert.ok(isTerminalCampaignStatus("failed"));
    assert.ok(isTerminalCampaignStatus("cancelled"));
    assert.equal(nextCampaignStatuses("completed").length, 0);
    assert.ok(nextCampaignStatuses("draft").includes("approved"));
  });
});

const BASE_INPUT: SegmentMatchInput = {
  visitCount: 5,
  lifetimeSpend: 5000,
  lastVisitAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
  preferredStaffId: "staff_1",
  preferredServiceId: "svc_1",
  branchId: "branch_1",
  preferredChannel: "whatsapp",
};

describe("matchesSegment", () => {
  it("matches everyone when criteria is empty", () => {
    const result = matchesSegment(BASE_INPUT, {});
    assert.equal(result.matches, true);
  });

  it("excludes a customer who opted out, by default", () => {
    const result = matchesSegment({ ...BASE_INPUT, optedOutAt: new Date().toISOString() }, {});
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /opted out/i);
  });

  it("excludes a customer with no communication channel", () => {
    const result = matchesSegment({ ...BASE_INPUT, preferredChannel: "none" }, {});
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /no preferred communication channel/i);
  });

  it("includes an opted-out customer only when communicationOptIn is explicitly false", () => {
    const result = matchesSegment(
      { ...BASE_INPUT, optedOutAt: new Date().toISOString() },
      { communicationOptIn: false }
    );
    assert.equal(result.matches, true);
  });

  it("excludes customers who never visited when lastVisitBeforeDays is set", () => {
    const result = matchesSegment({ ...BASE_INPUT, lastVisitAt: undefined }, { lastVisitBeforeDays: 30 });
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /never visited/i);
  });

  it("excludes customers whose last visit is too recent", () => {
    const result = matchesSegment({ ...BASE_INPUT, lastVisitAt: new Date().toISOString() }, { lastVisitBeforeDays: 30 });
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /last visit was only/i);
  });

  it("includes customers inactive for longer than the threshold", () => {
    const result = matchesSegment(BASE_INPUT, { lastVisitBeforeDays: 30 });
    assert.equal(result.matches, true);
  });

  it("excludes customers below minVisits", () => {
    const result = matchesSegment({ ...BASE_INPUT, visitCount: 1 }, { minVisits: 3 });
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /fewer than the required/i);
  });

  it("excludes customers below minLifetimeSpend", () => {
    const result = matchesSegment({ ...BASE_INPUT, lifetimeSpend: 100 }, { minLifetimeSpend: 1000 });
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /below the required/i);
  });

  it("excludes customers above maxLifetimeSpend", () => {
    const result = matchesSegment({ ...BASE_INPUT, lifetimeSpend: 100000 }, { maxLifetimeSpend: 10000 });
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /above the maximum/i);
  });

  it("excludes on preferredServiceId mismatch", () => {
    const result = matchesSegment(BASE_INPUT, { preferredServiceId: "svc_other" });
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /preferred service/i);
  });

  it("excludes on preferredStaffId mismatch", () => {
    const result = matchesSegment(BASE_INPUT, { preferredStaffId: "staff_other" });
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /preferred staff/i);
  });

  it("excludes on branchId mismatch", () => {
    const result = matchesSegment(BASE_INPUT, { branchId: "branch_other" });
    assert.equal(result.matches, false);
    if (!result.matches) assert.match(result.excludeReason, /branch/i);
  });

  it("combines every criterion with AND", () => {
    const result = matchesSegment(BASE_INPUT, {
      lastVisitBeforeDays: 30,
      minVisits: 3,
      minLifetimeSpend: 1000,
      branchId: "branch_1",
    });
    assert.equal(result.matches, true);
  });
});

describe("Growth attention signals", () => {
  it("never fabricates a signal with zero evidence", () => {
    const items = computeAttentionItems([
      { kind: "message_failures", count: 0 },
      { kind: "pending_campaign_approvals", count: 2 },
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "pending_campaign_approvals");
  });

  it("surfaces message failures and low repeat rate with real descriptions", () => {
    const items = computeAttentionItems([
      { kind: "message_failures", count: 4 },
      { kind: "low_repeat_rate", count: 15 },
    ]);
    const failures = items.find((i) => i.kind === "message_failures");
    const repeatRate = items.find((i) => i.kind === "low_repeat_rate");
    assert.ok(failures);
    assert.match(failures!.description, /4 outbound message/i);
    assert.ok(repeatRate);
    assert.match(repeatRate!.description, /15%/);
  });
});
