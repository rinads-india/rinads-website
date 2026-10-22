import {
  CALENDAR_LEGEND,
  addDaysToIsoDate,
  calendarHref,
  nextIsoMonth,
  previousIsoMonth,
  startOfIsoWeek,
  type CalendarView,
} from "@rinads/salon";
import Link from "next/link";

const VIEWS: { view: CalendarView; label: string }[] = [
  { view: "day", label: "Day" },
  { view: "week", label: "Week" },
  { view: "month", label: "Month" },
  { view: "upcoming", label: "Upcoming" },
];

export function CalendarToolbar({
  view,
  date,
  branch,
  heading,
}: {
  view: CalendarView;
  date: string;
  branch?: string;
  heading: string;
}) {
  const prevDate =
    view === "month" ? previousIsoMonth(date) : view === "week" ? addDaysToIsoDate(startOfIsoWeek(date), -7) : addDaysToIsoDate(date, -1);
  const nextDate =
    view === "month" ? nextIsoMonth(date) : view === "week" ? addDaysToIsoDate(startOfIsoWeek(date), 7) : addDaysToIsoDate(date, 1);

  return (
    <div className="space-y-3 rounded-2xl border border-rinads-primary/10 bg-surface/70 p-3 shadow-sm backdrop-blur sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {view !== "upcoming" ? (
          <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 sm:flex sm:w-auto">
            <Link
              href={calendarHref({ view, date: prevDate, branch })}
              className="btn-secondary grid h-11 w-11 place-items-center p-0 text-xl"
              aria-label="Previous"
            >
              ‹
            </Link>
            <div className="min-w-0 text-center sm:text-left">
              <p className="truncate text-sm font-semibold text-foreground sm:min-w-[9rem]">{heading}</p>
              <Link
                href={calendarHref({ view, branch })}
                className="mt-0.5 inline-flex min-h-6 items-center text-xs font-semibold text-rinads-primary"
              >
                Jump to today
              </Link>
            </div>
            <Link
              href={calendarHref({ view, date: nextDate, branch })}
              className="btn-secondary grid h-11 w-11 place-items-center p-0 text-xl"
              aria-label="Next"
            >
              ›
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-foreground">{heading}</p>
            <Link href={calendarHref({ view: "day", branch })} className="mt-0.5 inline-flex min-h-6 items-center text-xs font-semibold text-rinads-primary">
              Back to today
            </Link>
          </div>
        )}

        <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface-muted p-1 sm:min-w-[22rem]">
          {VIEWS.map((item) => (
            <Link
              key={item.view}
              href={calendarHref({ view: item.view, date: item.view === "upcoming" ? undefined : date, branch })}
              className={`flex min-h-10 items-center justify-center rounded-lg px-2 text-xs font-semibold transition sm:text-sm ${
                view === item.view
                  ? "bg-rinads-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
              aria-current={view === item.view ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
        <div className="flex min-w-max gap-1.5">
          {CALENDAR_LEGEND.map((item) => (
            <span key={item.key} className={`cal-legend cal-legend-${item.key} min-h-8`}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
