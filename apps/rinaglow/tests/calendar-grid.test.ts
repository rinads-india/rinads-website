import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import { zonedDateKey, zonedDateRangeIso, zonedNowDate } from "../lib/time";
import { calendarHref, isoWeekDays, parseCalendarView } from "@rinads/salon";

const root = process.cwd();

describe("R GLOW calendar week/month grids", () => {
  it("keeps day, week, month, and upcoming views with existing check-in and booking actions", () => {
    const page = readFileSync(join(root, "app/(console)/calendar/page.tsx"), "utf8");
    const card = readFileSync(join(root, "app/(console)/calendar/AppointmentCard.tsx"), "utf8");
    const week = readFileSync(join(root, "app/(console)/calendar/CalendarWeekGrid.tsx"), "utf8");
    const month = readFileSync(join(root, "app/(console)/calendar/CalendarMonthGrid.tsx"), "utf8");
    assert.match(page, /parseCalendarView/);
    assert.match(page, /CalendarWeekGrid/);
    assert.match(page, /CalendarMonthGrid/);
    assert.match(page, /NewAppointmentForm/);
    assert.match(page, /AppointmentCard/);
    assert.match(page, /view === "week"/);
    assert.match(page, /view === "month"/);
    assert.match(card, /AppointmentActions/);
    assert.match(card, /AppointmentReschedule/);
    assert.match(card, /Check in|AppointmentActions/);
    assert.match(week, /isoWeekDays/);
    assert.match(month, /isoMonthCells/);
    assert.doesNotMatch(page, /demoContext|USE_DEMO_STORE|Ringlow/);
  });

  it("preserves branch and date on calendar hrefs", () => {
    assert.equal(parseCalendarView("week"), "week");
    assert.equal(calendarHref({ view: "month", date: "2026-06-16", branch: "b1" }), "/calendar?view=month&date=2026-06-16&branch=b1");
    assert.deepEqual(isoWeekDays("2026-06-17")[0], "2026-06-15");
  });

  it("computes zoned day keys and ranges in Asia/Kolkata", () => {
    assert.equal(zonedDateKey("2026-06-16T18:30:00.000Z", "Asia/Kolkata"), "2026-06-17");
    assert.equal(zonedNowDate("UTC", new Date("2026-06-16T08:00:00.000Z")), "2026-06-16");
    const range = zonedDateRangeIso("2026-06-16", "Asia/Kolkata", 1);
    assert.ok(range);
    assert.equal(range.from, "2026-06-15T18:30:00.000Z");
    assert.equal(range.to, "2026-06-16T18:30:00.000Z");
  });
});
