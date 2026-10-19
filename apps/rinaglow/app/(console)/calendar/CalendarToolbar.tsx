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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {view !== "upcoming" ? (
          <>
            <Link href={calendarHref({ view, date: prevDate, branch })} className="btn-secondary px-2.5 py-1.5 text-sm" aria-label="Previous">
              ‹
            </Link>
            <p className="min-w-[10rem] text-sm font-semibold text-foreground">{heading}</p>
            <Link href={calendarHref({ view, date: nextDate, branch })} className="btn-secondary px-2.5 py-1.5 text-sm" aria-label="Next">
              ›
            </Link>
          </>
        ) : (
          <p className="text-sm font-semibold text-foreground">{heading}</p>
        )}
        <Link href={calendarHref({ view: view === "upcoming" ? "day" : view, branch })} className="text-xs text-rinads-primary underline">
          Today
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {CALENDAR_LEGEND.map((item) => (
            <span key={item.key} className={`cal-legend cal-legend-${item.key}`}>
              {item.label}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {VIEWS.map((item) => (
            <Link
              key={item.view}
              href={calendarHref({ view: item.view, date: item.view === "upcoming" ? undefined : date, branch })}
              className={view === item.view ? "btn-primary text-xs" : "btn-secondary text-xs"}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
