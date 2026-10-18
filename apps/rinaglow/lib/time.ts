/** Returns an ISO timestamp for "one day ago from now". Kept out of Server Component bodies to avoid impure-call lint findings there. */
export function oneDayAgoIso(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

/** Converts a branch-local `YYYY-MM-DDTHH:mm` value to its UTC instant without a timezone dependency. */
export function zonedLocalDateTimeToIso(value: string, timeZone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = desiredAsUtc;
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate)).reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    const representedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute)
    );
    candidate += desiredAsUtc - representedAsUtc;
  }
  const result = new Date(candidate);
  return Number.isFinite(result.getTime()) ? result.toISOString() : null;
}

export function broadTodayRangeIso(): { from: string; to: string; now: string } {
  const now = new Date();
  return {
    from: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
    to: new Date(now.getTime() + 38 * 60 * 60 * 1000).toISOString(),
    now: now.toISOString(),
  };
}

/** A stable YYYY-MM-DD key in the salon branch's local timezone. */
export function zonedCalendarDateKey(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function zonedDateHeading(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(iso));
}

export function zonedTimeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function zonedDateTimeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function isSameZonedCalendarDate(a: string, b: string, timeZone: string): boolean {
  return zonedCalendarDateKey(a, timeZone) === zonedCalendarDateKey(b, timeZone);
}
