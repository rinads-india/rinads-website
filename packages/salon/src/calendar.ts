import type { AppointmentStatus } from "./types";

export type CalendarView = "day" | "week" | "month" | "upcoming";

export type CalendarLegendKey = "done" | "in_chair" | "waiting" | "upcoming" | "other";

export const CALENDAR_LEGEND: { key: CalendarLegendKey; label: string; statuses: AppointmentStatus[] }[] = [
  { key: "done", label: "Done", statuses: ["completed"] },
  { key: "in_chair", label: "In chair", statuses: ["in_service"] },
  { key: "waiting", label: "Waiting", statuses: ["checked_in"] },
  { key: "upcoming", label: "Upcoming", statuses: ["pending", "confirmed"] },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseCalendarView(value?: string | null): CalendarView {
  if (value === "week" || value === "month" || value === "upcoming") return value;
  if (value === "today") return "day";
  return "day";
}

export function parseIsoDate(value?: string | null): string | null {
  if (!value || !ISO_DATE.test(value)) return null;
  return value;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Monday-start ISO week, matching the Salon OS prototype week grid. */
export function startOfIsoWeek(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dow = date.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return addDaysToIsoDate(isoDate, mondayOffset);
}

export function startOfIsoMonth(isoDate: string): string {
  return `${isoDate.slice(0, 8)}01`;
}

export function daysInIsoMonth(isoDate: string): number {
  const [year, month] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function nextIsoMonth(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

export function previousIsoMonth(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
}

export function isoWeekDays(isoDate: string): string[] {
  const start = startOfIsoWeek(isoDate);
  return Array.from({ length: 7 }, (_, index) => addDaysToIsoDate(start, index));
}

export type MonthCell =
  | { kind: "pad"; key: string }
  | { kind: "day"; key: string; date: string; dayOfMonth: number };

/** Sunday-start month grid, matching the Salon OS prototype month view. */
export function isoMonthCells(isoDate: string): MonthCell[] {
  const start = startOfIsoMonth(isoDate);
  const [year, month] = start.split("-").map(Number);
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = daysInIsoMonth(start);
  const cells: MonthCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ kind: "pad", key: `pad-${start}-${i}` });
  for (let day = 1; day <= days; day++) {
    const date = `${start.slice(0, 8)}${String(day).padStart(2, "0")}`;
    cells.push({ kind: "day", key: date, date, dayOfMonth: day });
  }
  return cells;
}

export function calendarLegendKey(status: AppointmentStatus): CalendarLegendKey {
  if (status === "completed") return "done";
  if (status === "in_service") return "in_chair";
  if (status === "checked_in") return "waiting";
  if (status === "pending" || status === "confirmed") return "upcoming";
  return "other";
}

export function calendarHref(input: {
  view?: CalendarView;
  date?: string | null;
  branch?: string | null;
  appointment?: string | null;
}): string {
  const params = new URLSearchParams();
  const view = input.view ?? "day";
  if (view !== "day") params.set("view", view);
  if (input.date) params.set("date", input.date);
  if (input.branch) params.set("branch", input.branch);
  if (input.appointment) params.set("appointment", input.appointment);
  const query = params.toString();
  return query ? `/calendar?${query}` : "/calendar";
}
