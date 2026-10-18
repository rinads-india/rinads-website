import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const calendarSource = fs.readFileSync(path.join(process.cwd(), "app/(console)/calendar/page.tsx"), "utf8");

describe("R GLOW calendar production contract", () => {
  it("bounds the Upcoming appointment horizon", () => {
    expect(calendarSource).toContain("const UPCOMING_HORIZON_DAYS = 90");
    expect(calendarSource).toContain("to: calendarView === \"today\" ? today.to : upcomingTo");
  });

  it("uses branch-timezone helpers for grouping and presentation", () => {
    expect(calendarSource).toContain("zonedCalendarDateKey(item.startsAt, timeZone)");
    expect(calendarSource).toContain("zonedTimeLabel(appt.startsAt, timeZone)");
    expect(calendarSource).toContain("zonedDateTimeLabel(appt.startsAt, timeZone)");
  });
});
