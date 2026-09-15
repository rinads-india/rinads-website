/**
 * Returns the UTC offset (in minutes) of an IANA timezone at a given
 * instant, using only `Intl` (no extra dependency). Works for DST zones
 * too, since it reads the actual local wall-clock time at that instant.
 */
function timezoneOffsetMinutes(timeZone: string, at: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(at).reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asIfUtc - at.getTime()) / 60_000;
}

/**
 * Converts a calendar date string ("YYYY-MM-DD") into the UTC instant that
 * represents local midnight of that day in `timeZone`. Used to feed
 * `@rinads/salon`'s `generateDaySlots`, which operates on a UTC "day start"
 * and pure minute offsets from there.
 */
export function localMidnightUtc(dateStr: string, timeZone: string): Date {
  const naiveUtc = new Date(`${dateStr}T00:00:00.000Z`);
  const offsetMin = timezoneOffsetMinutes(timeZone, naiveUtc);
  return new Date(naiveUtc.getTime() - offsetMin * 60_000);
}
