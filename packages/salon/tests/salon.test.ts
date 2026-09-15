import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionAppointmentStatus,
  nextAppointmentStatuses,
  isTerminalAppointmentStatus,
  canRescheduleAppointment,
  canTransitionRefundStatus,
  generateDaySlots,
  rangesOverlap,
  intersectDayHours,
  intersectWeeklyHours,
  computeAttentionItems,
  DEFAULT_WEEKLY_HOURS,
} from "../src/index";

describe("Appointment state machine", () => {
  it("allows the happy path lifecycle", () => {
    assert.ok(canTransitionAppointmentStatus("pending", "confirmed"));
    assert.ok(canTransitionAppointmentStatus("confirmed", "checked_in"));
    assert.ok(canTransitionAppointmentStatus("checked_in", "in_service"));
    assert.ok(canTransitionAppointmentStatus("in_service", "completed"));
  });

  it("allows cancellation from non-terminal states", () => {
    assert.ok(canTransitionAppointmentStatus("pending", "cancelled"));
    assert.ok(canTransitionAppointmentStatus("confirmed", "cancelled"));
    assert.ok(canTransitionAppointmentStatus("checked_in", "cancelled"));
  });

  it("rejects invalid transitions", () => {
    assert.ok(!canTransitionAppointmentStatus("pending", "completed"));
    assert.ok(!canTransitionAppointmentStatus("completed", "pending"));
    assert.ok(!canTransitionAppointmentStatus("cancelled", "confirmed"));
    assert.ok(!canTransitionAppointmentStatus("pending", "pending"));
  });

  it("reports terminal states with no further transitions", () => {
    assert.ok(isTerminalAppointmentStatus("completed"));
    assert.ok(isTerminalAppointmentStatus("cancelled"));
    assert.ok(isTerminalAppointmentStatus("no_show"));
    assert.equal(nextAppointmentStatuses("completed").length, 0);
    assert.ok(nextAppointmentStatuses("pending").includes("confirmed"));
  });
});

describe("Slot availability", () => {
  it("generates slots within working hours respecting service duration", () => {
    const monday = new Date("2026-09-07T00:00:00.000Z"); // a Monday, UTC midnight
    const slots = generateDaySlots({
      dayStartUtc: monday,
      workingHours: DEFAULT_WEEKLY_HOURS,
      serviceDurationMin: 60,
      stepMin: 30,
    });
    assert.ok(slots.length > 0);
    assert.equal(slots[0].start, "2026-09-07T10:00:00.000Z");
    // Last slot must still fit before closing (20:00).
    const last = slots[slots.length - 1];
    assert.ok(new Date(last.end).getTime() <= new Date("2026-09-07T20:00:00.000Z").getTime());
  });

  it("returns no slots on a closed day", () => {
    const sunday = new Date("2026-09-06T00:00:00.000Z");
    const slots = generateDaySlots({
      dayStartUtc: sunday,
      workingHours: DEFAULT_WEEKLY_HOURS,
      serviceDurationMin: 60,
    });
    assert.equal(slots.length, 0);
  });

  it("excludes slots that overlap a busy range", () => {
    const monday = new Date("2026-09-07T00:00:00.000Z");
    const slots = generateDaySlots({
      dayStartUtc: monday,
      workingHours: DEFAULT_WEEKLY_HOURS,
      serviceDurationMin: 60,
      stepMin: 60,
      busy: [{ start: "2026-09-07T10:00:00.000Z", end: "2026-09-07T11:00:00.000Z" }],
    });
    assert.ok(!slots.some((s) => s.start === "2026-09-07T10:00:00.000Z"));
    assert.ok(slots.some((s) => s.start === "2026-09-07T11:00:00.000Z"));
  });

  it("excludes slots before `now`", () => {
    const monday = new Date("2026-09-07T00:00:00.000Z");
    const slots = generateDaySlots({
      dayStartUtc: monday,
      workingHours: DEFAULT_WEEKLY_HOURS,
      serviceDurationMin: 60,
      stepMin: 60,
      now: new Date("2026-09-07T12:30:00.000Z"),
    });
    assert.ok(slots.every((s) => new Date(s.start).getTime() >= new Date("2026-09-07T12:30:00.000Z").getTime()));
  });

  it("detects overlapping ranges consistently with the DB exclusion constraint", () => {
    assert.ok(
      rangesOverlap(
        { start: "2026-09-07T10:00:00.000Z", end: "2026-09-07T11:00:00.000Z" },
        { start: "2026-09-07T10:30:00.000Z", end: "2026-09-07T11:30:00.000Z" }
      )
    );
    assert.ok(
      !rangesOverlap(
        { start: "2026-09-07T10:00:00.000Z", end: "2026-09-07T11:00:00.000Z" },
        { start: "2026-09-07T11:00:00.000Z", end: "2026-09-07T12:00:00.000Z" }
      )
    );
  });

  it("intersects staff hours with branch hours, never exceeding either", () => {
    const branchHours = { open: "10:00", close: "20:00" };
    const staffHours = { open: "12:00", close: "18:00" };
    assert.deepEqual(intersectDayHours(branchHours, staffHours), { open: "12:00", close: "18:00" });
    assert.equal(intersectDayHours(branchHours, null), null);
    // No overlap at all -> no bookable window, not a negative-length range.
    assert.equal(intersectDayHours({ open: "09:00", close: "10:00" }, { open: "18:00", close: "20:00" }), null);
  });

  it("respects staff-specific working hours narrower than the branch's", () => {
    const monday = new Date("2026-09-07T00:00:00.000Z");
    const staffWorkingHours = { ...DEFAULT_WEEKLY_HOURS, mon: { open: "14:00", close: "16:00" } };
    const slots = generateDaySlots({
      dayStartUtc: monday,
      workingHours: DEFAULT_WEEKLY_HOURS,
      staffWorkingHours,
      serviceDurationMin: 60,
      stepMin: 60,
    });
    assert.ok(slots.every((s) => new Date(s.start).getUTCHours() >= 14 && new Date(s.end).getUTCHours() <= 16));
  });

  it("blocks the buffer window after a service even though it isn't shown as service time", () => {
    const monday = new Date("2026-09-07T00:00:00.000Z");
    const slotsWithBuffer = generateDaySlots({
      dayStartUtc: monday,
      workingHours: DEFAULT_WEEKLY_HOURS,
      serviceDurationMin: 30,
      bufferMin: 30,
      stepMin: 30,
      busy: [{ start: "2026-09-07T11:00:00.000Z", end: "2026-09-07T11:30:00.000Z" }],
    });
    // A 10:30 slot would only *look* free (service ends 11:00) but its
    // buffer (11:00-11:30) collides with the busy range, so it must be excluded.
    assert.ok(!slotsWithBuffer.some((s) => s.start === "2026-09-07T10:30:00.000Z"));
  });
});

describe("intersectWeeklyHours", () => {
  it("intersects every day of the week independently", () => {
    const branch = DEFAULT_WEEKLY_HOURS; // closed on sun, 10-20 otherwise
    const staff = { ...DEFAULT_WEEKLY_HOURS, sat: null };
    const result = intersectWeeklyHours(branch, staff);
    assert.equal(result.sun, null);
    assert.equal(result.sat, null);
    assert.deepEqual(result.mon, { open: "10:00", close: "20:00" });
  });
});

describe("Appointment reschedule + refund transitions", () => {
  it("only allows rescheduling before an appointment has started", () => {
    assert.ok(canRescheduleAppointment("pending"));
    assert.ok(canRescheduleAppointment("confirmed"));
    assert.ok(!canRescheduleAppointment("checked_in"));
    assert.ok(!canRescheduleAppointment("completed"));
    assert.ok(!canRescheduleAppointment("cancelled"));
  });

  it("mirrors RefundService's pending -> approved -> processed chain", () => {
    assert.ok(canTransitionRefundStatus("pending", "approved"));
    assert.ok(canTransitionRefundStatus("pending", "rejected"));
    assert.ok(canTransitionRefundStatus("approved", "processed"));
    assert.ok(!canTransitionRefundStatus("approved", "pending"));
    assert.ok(!canTransitionRefundStatus("processed", "approved"));
    assert.ok(!canTransitionRefundStatus("rejected", "approved"));
    assert.ok(!canTransitionRefundStatus("pending", "pending"));
  });
});

describe("computeAttentionItems", () => {
  it("never fabricates a signal with zero evidence", () => {
    const items = computeAttentionItems([
      { kind: "pending_payments", count: 0 },
      { kind: "empty_slots_today", count: 3 },
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "empty_slots_today");
  });

  it("ranks higher-impact, higher-urgency signals first", () => {
    const items = computeAttentionItems([
      { kind: "low_staff_utilization", count: 2 },
      { kind: "pending_payments", count: 5 },
    ]);
    assert.equal(items[0].kind, "pending_payments");
  });

  it("drops unregistered signal kinds instead of throwing", () => {
    const items = computeAttentionItems([{ kind: "not_a_real_signal" as never, count: 5 }]);
    assert.equal(items.length, 0);
  });
});
