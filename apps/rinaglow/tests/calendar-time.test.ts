import { describe, expect, it } from "vitest";
import { zonedCalendarDateKey, zonedDateHeading, zonedDateTimeLabel, zonedTimeLabel } from "@/lib/time";

describe("R GLOW calendar timezone presentation", () => {
  it("uses the branch-local date rather than the UTC date", () => {
    const instant = "2026-10-18T20:00:00.000Z"; // 19 Oct 01:30 in Kerala
    expect(zonedCalendarDateKey(instant, "Asia/Kolkata")).toBe("2026-10-19");
    expect(zonedCalendarDateKey(instant, "UTC")).toBe("2026-10-18");
  });

  it("formats time in the branch timezone", () => {
    const instant = "2026-10-18T20:00:00.000Z";
    expect(zonedTimeLabel(instant, "Asia/Kolkata")).toMatch(/01:30/);
  });

  it("formats headings and date-time labels in the branch timezone", () => {
    const instant = "2026-10-18T20:00:00.000Z";
    expect(zonedDateHeading(instant, "Asia/Kolkata")).toContain("19");
    expect(zonedDateTimeLabel(instant, "Asia/Kolkata")).toMatch(/19/);
  });
});
