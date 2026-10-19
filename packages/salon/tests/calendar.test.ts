import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDaysToIsoDate,
  calendarHref,
  calendarLegendKey,
  isoMonthCells,
  isoWeekDays,
  parseCalendarView,
  parseIsoDate,
  previousIsoMonth,
  startOfIsoMonth,
  startOfIsoWeek,
  nextIsoMonth,
} from "../src/calendar";

describe("calendar view helpers", () => {
  it("normalizes today to day and rejects unknown views", () => {
    assert.equal(parseCalendarView("today"), "day");
    assert.equal(parseCalendarView("week"), "week");
    assert.equal(parseCalendarView("month"), "month");
    assert.equal(parseCalendarView("upcoming"), "upcoming");
    assert.equal(parseCalendarView("agenda"), "day");
    assert.equal(parseCalendarView(undefined), "day");
  });

  it("parses ISO dates strictly", () => {
    assert.equal(parseIsoDate("2026-06-15"), "2026-06-15");
    assert.equal(parseIsoDate("15/06/2026"), null);
    assert.equal(parseIsoDate(""), null);
  });

  it("starts weeks on Monday and months on the 1st", () => {
    assert.equal(startOfIsoWeek("2026-06-17"), "2026-06-15");
    assert.equal(startOfIsoWeek("2026-06-21"), "2026-06-15");
    assert.equal(startOfIsoWeek("2026-06-14"), "2026-06-08");
    assert.equal(startOfIsoMonth("2026-06-19"), "2026-06-01");
    assert.deepEqual(isoWeekDays("2026-06-17"), [
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
    ]);
    assert.equal(nextIsoMonth("2026-06-15"), "2026-07-01");
    assert.equal(previousIsoMonth("2026-06-15"), "2026-05-01");
    assert.equal(addDaysToIsoDate("2026-06-30", 1), "2026-07-01");
  });

  it("builds a Sunday-leading June 2026 month grid", () => {
    const cells = isoMonthCells("2026-06-16");
    const pads = cells.filter((cell) => cell.kind === "pad");
    const days = cells.filter((cell) => cell.kind === "day");
    assert.equal(pads.length, 1);
    assert.equal(days.length, 30);
    assert.equal(days[0]?.date, "2026-06-01");
    assert.equal(days[15]?.date, "2026-06-16");
  });

  it("maps prototype legend keys from appointment statuses", () => {
    assert.equal(calendarLegendKey("completed"), "done");
    assert.equal(calendarLegendKey("in_service"), "in_chair");
    assert.equal(calendarLegendKey("checked_in"), "waiting");
    assert.equal(calendarLegendKey("confirmed"), "upcoming");
    assert.equal(calendarLegendKey("cancelled"), "other");
  });

  it("builds calendar hrefs without dropping the branch", () => {
    assert.equal(calendarHref({}), "/calendar");
    assert.equal(calendarHref({ view: "week", date: "2026-06-15", branch: "b1" }), "/calendar?view=week&date=2026-06-15&branch=b1");
    assert.equal(calendarHref({ view: "day", date: "2026-06-16" }), "/calendar?date=2026-06-16");
  });
});
