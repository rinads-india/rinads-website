import { calendarHref, isoWeekDays, type SalonAppointment } from "@rinads/salon";
import Link from "next/link";
import { AppointmentCard } from "./AppointmentCard";

const WEEKDAY = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });
const DAY_NUM = new Intl.DateTimeFormat("en-IN", { day: "2-digit", timeZone: "UTC" });

function utcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export function CalendarWeekGrid({
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
  labels: Map<
    string,
    { timeZone: string; customerLabel: string; customerHref?: string; staffLabel: string; branchLabel?: string }
  >;
}) {
  const days = isoWeekDays(date);

  return (
    <div className="cal-week-wrap">
      <div className="cal-week">
        {days.map((day) => {
          const items = appointmentsByDay.get(day) ?? [];
          const isToday = day === today;
          return (
            <section key={day} className={`cal-week-col${isToday ? " cal-today" : ""}`}>
              <Link href={calendarHref({ view: "day", date: day, branch })} className="cal-week-head">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{WEEKDAY.format(utcDay(day))}</span>
                <span className="text-base font-semibold text-foreground">{DAY_NUM.format(utcDay(day))}</span>
              </Link>
              <div className="space-y-2 p-2">
                {items.length === 0 ? (
                  <p className="px-1 py-6 text-center text-[11px] text-muted-foreground">No bookings</p>
                ) : (
                  items.map((appointment) => {
                    const meta = labels.get(appointment.id);
                    return (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        timeZone={meta?.timeZone ?? "Asia/Kolkata"}
                        customerLabel={meta?.customerLabel ?? "Walk-in customer"}
                        customerHref={meta?.customerHref}
                        staffLabel={meta?.staffLabel ?? "Unassigned staff"}
                        branchLabel={meta?.branchLabel}
                        calendarHref={calendarHref({ view: "week", date: day, branch, appointment: appointment.id })}
                        variant="compact"
                      />
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
