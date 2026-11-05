import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RINPO_TODAY_OPEN_TASK_STATUSES,
  buildRinpoTodayFromCounts,
  canReadRinpoToday,
} from "../lib/rinpo-phone/today";

const ok = (count: number) => ({ count, error: null });

describe("RINPO Phone Today - access boundary", () => {
  it("requires an active organization, owner/staff role and read permission", () => {
    assert.equal(canReadRinpoToday({
      organizationId: "org_a", roleKey: "manager", permissions: ["org.read"],
    }), true);
    assert.equal(canReadRinpoToday({
      organizationId: "org_a", roleKey: "founder", permissions: ["org.manage"],
    }), true);
    assert.equal(canReadRinpoToday({
      organizationId: null, roleKey: "founder", permissions: ["org.manage"],
    }), false);
    assert.equal(canReadRinpoToday({
      organizationId: "org_a", roleKey: "client", permissions: ["org.read"],
    }), false);
    assert.equal(canReadRinpoToday({
      organizationId: "org_a", roleKey: "viewer", permissions: ["org.read"],
    }), false);
    assert.equal(canReadRinpoToday({
      organizationId: "org_a", roleKey: "staff", permissions: [],
    }), false);
  });
});

describe("RINPO Phone Today - trusted data only", () => {
  it("reports genuine zero values, never illustrative totals", () => {
    assert.deepEqual(buildRinpoTodayFromCounts(ok(0), ok(0)), {
      status: "ready", source: "live", customerCount: 0, openTaskCount: 0,
    });
    assert.deepEqual(buildRinpoTodayFromCounts(ok(4), ok(2)), {
      status: "ready", source: "live", customerCount: 4, openTaskCount: 2,
    });
  });

  it("fails closed on null counts, RLS/query errors and malformed numbers", () => {
    const unavailable = { status: "unavailable", source: "none" };
    assert.deepEqual(buildRinpoTodayFromCounts({ count: null, error: null }, ok(1)), unavailable);
    assert.deepEqual(buildRinpoTodayFromCounts(ok(2), { count: null, error: { message: "permission denied" } }), unavailable);
    assert.deepEqual(buildRinpoTodayFromCounts(ok(-1), ok(2)), unavailable);
    assert.deepEqual(buildRinpoTodayFromCounts(ok(Number.NaN), ok(2)), unavailable);
  });

  it("matches only supported open task status values", () => {
    assert.deepEqual([...RINPO_TODAY_OPEN_TASK_STATUSES], [
      "todo", "in_progress", "waiting", "review",
    ]);
    assert.equal(RINPO_TODAY_OPEN_TASK_STATUSES.includes("done" as never), false);
  });
});
