import type { DayHours, SalonBranch, SalonService, SalonStaff, TimeRange, WeeklyHours } from "./types";

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

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Intersects two open/close windows for the same day. Returns `null` if
 * either side is closed, or if the intersection is empty (e.g. staff hours
 * fall entirely outside branch hours) — both are treated the same way by
 * callers: no bookable time that day.
 */
export function intersectDayHours(a: DayHours, b: DayHours): DayHours {
  if (!a || !b) return null;
  const openMin = Math.max(parseTimeToMinutes(a.open), parseTimeToMinutes(b.open));
  const closeMin = Math.min(parseTimeToMinutes(a.close), parseTimeToMinutes(b.close));
  if (closeMin <= openMin) return null;
  return { open: minutesToTime(openMin), close: minutesToTime(closeMin) };
}

/** Intersects two full weekly schedules, day by day. */
export function intersectWeeklyHours(a: WeeklyHours, b: WeeklyHours): WeeklyHours {
  const result: WeeklyHours = {};
  for (const day of DAY_KEYS) {
    result[day] = intersectDayHours(a[day] ?? null, b[day] ?? null);
  }
  return result;
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
  /** Optional staff-specific hours. When provided, the effective bookable window on
   * each day is the intersection of `workingHours` (the branch) and this. */
  staffWorkingHours?: WeeklyHours;
  serviceDurationMin: number;
  /** Minutes blocked after the service (cleanup/prep) — occupies the staff
   * member's calendar but is never presented to the customer as service time. */
  bufferMin?: number;
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
  const {
    dayStartUtc,
    workingHours,
    staffWorkingHours,
    serviceDurationMin,
    bufferMin = 0,
    stepMin = 15,
    busy = [],
    now,
  } = input;
  if (serviceDurationMin <= 0 || stepMin <= 0) return [];

  const dayKey = dayKeyForDate(dayStartUtc);
  const hours = staffWorkingHours ? intersectDayHours(workingHours[dayKey] ?? null, staffWorkingHours[dayKey] ?? null) : workingHours[dayKey];
  if (!hours) return [];

  const openMin = parseTimeToMinutes(hours.open);
  const closeMin = parseTimeToMinutes(hours.close);
  if (closeMin <= openMin) return [];

  const blockedMin = serviceDurationMin + Math.max(0, bufferMin);
  const busyMs = busy.map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));

  const slots: TimeRange[] = [];
  for (let start = openMin; start + blockedMin <= closeMin; start += stepMin) {
    const slotStart = atMinutesUTC(dayStartUtc, start);
    const slotEnd = atMinutesUTC(dayStartUtc, start + serviceDurationMin);
    const blockedEnd = atMinutesUTC(dayStartUtc, start + blockedMin);

    if (now && slotStart.getTime() < now.getTime()) continue;

    const overlapsBusy = busyMs.some((b) => slotStart.getTime() < b.end && blockedEnd.getTime() > b.start);
    if (overlapsBusy) continue;

    slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
  }

  return slots;
}

/** True if two [start, end) ranges overlap. Mirrors the DB EXCLUDE constraint semantics. */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return new Date(a.start).getTime() < new Date(b.end).getTime() && new Date(a.end).getTime() > new Date(b.start).getTime();
}

export type BookingReadiness = {
  ready: boolean;
  activeBranch: boolean;
  activeService: boolean;
  activeStaff: boolean;
};

/** Truthful public-booking readiness: all three independently persisted prerequisites must exist. */
export function getBookingReadiness(
  branches: SalonBranch[],
  services: SalonService[],
  staff: SalonStaff[]
): BookingReadiness {
  const activeBranchIds = new Set(branches.filter((branch) => branch.isActive).map((branch) => branch.id));
  const activeBranch = activeBranchIds.size > 0;
  const activeService = services.some((service) => service.isActive);
  const activeStaff = staff.some(
    (member) => member.isActive && Boolean(member.branchId) && activeBranchIds.has(member.branchId!)
  );
  return { ready: activeBranch && activeService && activeStaff, activeBranch, activeService, activeStaff };
}

type ZonedParts = { weekday: DayKey; minutes: number; date: string };

function zonedParts(iso: string, timeZone: string): ZonedParts | null {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  const weekday = parts.weekday?.slice(0, 3).toLowerCase() as DayKey;
  if (!DAY_KEYS.includes(weekday)) return null;
  return {
    weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export type ValidateBookingAvailabilityInput = {
  startsAt: string;
  durationMin: number;
  bufferMin?: number;
  timeZone: string;
  branchHours: WeeklyHours;
  staffHours: WeeklyHours;
  busy?: BusyRange[];
  stepMin?: number;
  now?: Date;
};

/**
 * Server-side availability gate for operator-created bookings. It checks the
 * branch-local wall clock, branch/staff hours, slot grid, buffers, and current
 * busy ranges. The database exclusion constraint remains the final race guard.
 */
export function validateBookingAvailability(input: ValidateBookingAvailabilityInput): string | null {
  const start = new Date(input.startsAt);
  if (!Number.isFinite(start.getTime())) return "Choose a valid start time.";
  if (input.now && start.getTime() < input.now.getTime()) return "Choose a future start time.";
  if (input.durationMin <= 0) return "Selected services have no bookable duration.";
  const localStart = zonedParts(input.startsAt, input.timeZone);
  if (!localStart) return "Choose a valid start time.";
  const hours = intersectDayHours(
    input.branchHours[localStart.weekday] ?? null,
    input.staffHours[localStart.weekday] ?? null
  );
  if (!hours) return "The branch or staff member is closed at that time.";
  const step = input.stepMin ?? 15;
  if (step <= 0 || localStart.minutes % step !== 0) return `Start time must be on a ${step}-minute interval.`;
  const blockedMin = input.durationMin + Math.max(0, input.bufferMin ?? 0);
  const closeMin = parseTimeToMinutes(hours.close);
  if (localStart.minutes < parseTimeToMinutes(hours.open) || localStart.minutes + blockedMin > closeMin) {
    return "The appointment and its buffer must fit within branch and staff hours.";
  }
  const blockedEnd = new Date(start.getTime() + blockedMin * 60_000);
  const localEnd = zonedParts(blockedEnd.toISOString(), input.timeZone);
  if (!localEnd || localEnd.date !== localStart.date) return "The appointment must finish on the selected local day.";
  if ((input.busy ?? []).some((range) => rangesOverlap(
    { start: input.startsAt, end: blockedEnd.toISOString() },
    range
  ))) {
    return "This staff member already has an appointment overlapping this time.";
  }
  return null;
}
