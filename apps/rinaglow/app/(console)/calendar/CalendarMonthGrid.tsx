import { calendarHref, isoMonthCells, type SalonAppointment } from "@rinads/salon";
import Link from "next/link";

const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthGrid({
  date,
  today,
  branch,
  appointmentsByDay,
  labels,
}: {
  date: string;
  today: string;
  branch?: string;
  appointmentsByDay: Map<string, SalonAppointment[]>;
  labels: Map<string, { customerLabel: string }>;
}) {
  const cells = isoMonthCells(date);

  return (
    <div className="cal-month">
      <div className="cal-month-head">
        {DOWS.map((dow) => (
          <div key={dow} className="cal-month-dow">
            {dow}
          </div>
        ))}
      </div>
      <div className="cal-month-grid">
        {cells.map((cell) => {
          if (cell.kind === "pad") return <div key={cell.key} className="cal-month-cell cal-month-pad" />;
          const items = appointmentsByDay.get(cell.date) ?? [];
          const isToday = cell.date === today;
          return (
            <Link
              key={cell.key}
              href={calendarHref({ view: "day", date: cell.date, branch })}
              className={`cal-month-cell${isToday ? " cal-today" : ""}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs ${isToday ? "font-semibold text-rinads-primary" : "text-foreground"}`}>{cell.dayOfMonth}</span>
                {items.length ? <span className="cal-month-count">{items.length}</span> : null}
              </div>
              <ul className="mt-1 space-y-0.5">
                {items.slice(0, 3).map((appointment) => (
                  <li key={appointment.id} className="truncate text-[10px] text-muted-foreground">
                    {labels.get(appointment.id)?.customerLabel ?? "Booking"}
                  </li>
                ))}
                {items.length > 3 ? <li className="text-[10px] text-rinads-primary">+{items.length - 3} more</li> : null}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
