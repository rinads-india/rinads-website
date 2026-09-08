import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localMidnightUtc } from "@/lib/salon-booking-tz";

describe("salon booking timezone helper", () => {
  it("converts a local calendar date to the UTC instant of local midnight (Asia/Kolkata, UTC+5:30)", () => {
    const result = localMidnightUtc("2026-01-15", "Asia/Kolkata");
    // Local midnight IST (UTC+5:30) is 18:30 UTC the previous day.
    assert.equal(result.toISOString(), "2026-01-14T18:30:00.000Z");
  });

  it("is a no-op offset for UTC itself", () => {
    const result = localMidnightUtc("2026-06-01", "UTC");
    assert.equal(result.toISOString(), "2026-06-01T00:00:00.000Z");
  });

  it("handles a positive whole-hour offset (Asia/Tokyo, UTC+9)", () => {
    const result = localMidnightUtc("2026-03-10", "Asia/Tokyo");
    assert.equal(result.toISOString(), "2026-03-09T15:00:00.000Z");
  });

  it("handles a negative offset (America/New_York) across DST", () => {
    // Mid-January: EST is UTC-5.
    const winter = localMidnightUtc("2026-01-15", "America/New_York");
    assert.equal(winter.toISOString(), "2026-01-15T05:00:00.000Z");

    // Mid-July: EDT is UTC-4.
    const summer = localMidnightUtc("2026-07-15", "America/New_York");
    assert.equal(summer.toISOString(), "2026-07-15T04:00:00.000Z");
  });
});
