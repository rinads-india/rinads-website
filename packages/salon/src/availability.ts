import type { TimeRange, WeeklyHours } from "./types";

export type BusyRange = TimeRange;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type DayKey = (typeof DAY_KEYS)[number];

function dayKeyForDate(date: Date): DayKey {
  return DAY_KEYS[date.getUTCDay()];
}

function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(":").map((n) => Number(n));
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * Builds an absolute Date for a given day (its UTC midnight) plus a minute
 * offset. Callers are responsible for passing a `date` that already
 * represents midnight in the branch's local day — this function does not
 * perform timezone conversion itself (kept as a pure, dependency-free
 * calendar-minutes helper; timezone-aware wall-clock conversion happens at
 * the call site, e.g. in the server layer using the branch's `timezone`).
 */
function atMinutesUTC(dayStartUtc: Date, minutes: number): Date {
  return new Date(dayStartUtc.getTime() + minutes * 60_000);
}

export type GenerateDaySlotsInput = {
  /** Midnight (UTC) of the calendar day being scheduled, in the branch's local day. */
  dayStartUtc: Date;
  workingHours: WeeklyHours;
  serviceDurationMin: number;
  /** Slot grid granularity in minutes. Defaults to 15. */
  stepMin?: number;
  /** Existing bookings for the staff member that block overlapping slots. */
  busy?: BusyRange[];
  /** Slots starting before `now` are excluded (defaults to no lower bound). */
  now?: Date;
};

/**
 * Generates candidate appointment slots for one staff member on one day,
 * given the branch/staff working hours, a fixed service duration, and
 * already-booked ranges to avoid. This is a pure scheduling function —
 * the caller supplies busy ranges (e.g. from
 * `get_public_salon_busy_slots`) and this never talks to a database.
 */
export function generateDaySlots(input: GenerateDaySlotsInput): TimeRange[] {
  const { dayStartUtc, workingHours, serviceDurationMin, stepMin = 15, busy = [], now } = input;
  if (serviceDurationMin <= 0 || stepMin <= 0) return [];

  const hours = workingHours[dayKeyForDate(dayStartUtc)];
  if (!hours) return [];

  const openMin = parseTimeToMinutes(hours.open);
  const closeMin = parseTimeToMinutes(hours.close);
  if (closeMin <= openMin) return [];

  const busyMs = busy.map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));

  const slots: TimeRange[] = [];
  for (let start = openMin; start + serviceDurationMin <= closeMin; start += stepMin) {
    const slotStart = atMinutesUTC(dayStartUtc, start);
    const slotEnd = atMinutesUTC(dayStartUtc, start + serviceDurationMin);

    if (now && slotStart.getTime() < now.getTime()) continue;

    const overlapsBusy = busyMs.some((b) => slotStart.getTime() < b.end && slotEnd.getTime() > b.start);
    if (overlapsBusy) continue;

    slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
  }

  return slots;
}

/** True if two [start, end) ranges overlap. Mirrors the DB EXCLUDE constraint semantics. */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return new Date(a.start).getTime() < new Date(b.end).getTime() && new Date(a.end).getTime() > new Date(b.start).getTime();
}
