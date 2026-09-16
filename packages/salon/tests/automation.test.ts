import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  automationDueAt,
  automationIdempotencyKey,
  decideAutomation,
  isLowRating,
  type SalonAppointment,
} from "../src";

const appointment: SalonAppointment = {
  id: "appointment-1",
  organizationId: "org-1",
  branchId: "branch-1",
  staffId: "staff-1",
  customerId: "customer-1",
  status: "completed",
  startsAt: "2026-09-16T08:00:00.000Z",
  endsAt: "2026-09-16T09:00:00.000Z",
};

describe("salon automation decisions", () => {
  it("uses the default review and unconfirmed timing anchors", () => {
    assert.equal(automationDueAt("review_request", appointment), "2026-09-16T11:00:00.000Z");
    assert.equal(automationDueAt("no_show_recovery", appointment), "2026-09-16T11:00:00.000Z");
    assert.equal(automationDueAt("unconfirmed_booking_recovery", appointment), "2026-09-15T08:00:00.000Z");
  });

  it("stops when appointment state changed and blocks opted-out customers", () => {
    assert.deepEqual(decideAutomation({
      kind: "review_request",
      appointment: { ...appointment, status: "cancelled" },
      now: new Date("2026-09-16T12:00:00.000Z"),
    }), { due: false, reason: "stopped" });
    assert.deepEqual(decideAutomation({
      kind: "review_request",
      appointment,
      now: new Date("2026-09-16T12:00:00.000Z"),
      optedOutAt: "2026-09-01T00:00:00.000Z",
    }), { due: false, reason: "opted_out" });
    assert.deepEqual(decideAutomation({
      kind: "unconfirmed_booking_recovery",
      appointment: { ...appointment, status: "pending" },
      now: new Date("2026-09-16T09:00:00.000Z"),
    }), { due: false, reason: "stopped" });
  });

  it("creates stable keys and treats only ratings <=3 as low", () => {
    assert.equal(
      automationIdempotencyKey("no_show_recovery", "appointment-1"),
      "salon-automation:no_show_recovery:appointment:appointment-1"
    );
    assert.equal(isLowRating(3), true);
    assert.equal(isLowRating(4), false);
  });
});

