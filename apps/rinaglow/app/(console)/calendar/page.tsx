import { Card, EmptyState } from "@rinads/ui";
import {
  addDaysToIsoDate,
  calendarHref,
  daysInIsoMonth,
  parseCalendarView,
  parseIsoDate,
  startOfIsoMonth,
  startOfIsoWeek,
  type CalendarView,
  type SalonAppointment,
  type SalonNote,
} from "@rinads/salon";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { zonedDateKey, zonedDateRangeIso, zonedNowDate } from "@/lib/time";
import { AppointmentCard } from "./AppointmentCard";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { NewAppointmentForm } from "./NewAppointmentForm";

export const metadata = { title: "Calendar — R GLOW Console" };

const RANGE_PAD_MS = 14 * 60 * 60 * 1000;

function formatHeading(view: CalendarView, date: string): string {
  if (view === "upcoming") return "Upcoming appointments";
  if (view === "week") {
    const start = startOfIsoWeek(date);
    const end = addDaysToIsoDate(start, 6);
    return `${formatLong(start)} – ${formatLong(end)}`;
  }
  if (view === "month") {
    return new Date(`${startOfIsoMonth(date)}T00:00:00.000Z`).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return formatLong(date);
}

function formatLong(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00.000Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function padRange(range: { from: string; to: string }): { from: string; to: string } {
  return {
    from: new Date(new Date(range.from).getTime() - RANGE_PAD_MS).toISOString(),
    to: new Date(new Date(range.to).getTime() + RANGE_PAD_MS).toISOString(),
  };
}

function appointmentRange(view: CalendarView, date: string, timeZone: string): { from?: string; to?: string } {
  if (view === "upcoming") {
    const start = zonedDateRangeIso(date, timeZone, 1);
    return { from: start?.from };
  }
  if (view === "week") {
    const range = zonedDateRangeIso(startOfIsoWeek(date), timeZone, 7);
    return range ? padRange(range) : {};
  }
  if (view === "month") {
    const start = startOfIsoMonth(date);
    const range = zonedDateRangeIso(start, timeZone, daysInIsoMonth(start));
    return range ? padRange(range) : {};
  }
  const range = zonedDateRangeIso(date, timeZone, 1);
  return range ? padRange(range) : {};
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; view?: string; appointment?: string; date?: string }>;
}) {
  const tenancy = await requireTenancy();
  const { branch: branchFilter, view, date: dateParam } = await searchParams;
  const calendarView = parseCalendarView(view);
  const repo = await getSalonRepository();

  const [branchesResult, staffResult, servicesResult, customersResult] = await Promise.all([
    repo.listBranches(tenancy.organizationId),
    repo.listStaff(tenancy.organizationId),
    repo.listServices(tenancy.organizationId),
    repo.listCustomers(tenancy.organizationId),
  ]);

  const branches = branchesResult.ok ? branchesResult.data : [];
  const selectedBranch = branchFilter ? branches.find((branch) => branch.id === branchFilter) : undefined;
  const timeZone = selectedBranch?.timezone ?? branches.find((branch) => branch.isActive)?.timezone ?? "Asia/Kolkata";
  const today = zonedNowDate(timeZone);
  const selectedDate = parseIsoDate(dateParam) ?? today;
  const range = appointmentRange(calendarView, selectedDate, timeZone);

  const appointmentsResult = await repo.listAppointments(tenancy.organizationId, {
    branchId: branchFilter || undefined,
    from: range.from,
    to: range.to,
  });

  const staffById = new Map((staffResult.ok ? staffResult.data : []).map((staff) => [staff.id, staff]));
  const customersById = new Map((customersResult.ok ? customersResult.data : []).map((customer) => [customer.id, customer]));
  const branchesById = new Map(branches.map((branch) => [branch.id, branch]));
  const appointments = appointmentsResult.ok ? appointmentsResult.data : [];

  const appointmentsByDay = new Map<string, SalonAppointment[]>();
  for (const appointment of appointments) {
    const tz = branchesById.get(appointment.branchId)?.timezone ?? timeZone;
    const key = zonedDateKey(appointment.startsAt, tz);
    const bucket = appointmentsByDay.get(key) ?? [];
    bucket.push(appointment);
    appointmentsByDay.set(key, bucket);
  }

  const dayAppointments =
    calendarView === "upcoming"
      ? appointments
      : calendarView === "day"
        ? (appointmentsByDay.get(selectedDate) ?? [])
        : appointments;

  const notesByAppointment = new Map<string, SalonNote[]>();
  if (calendarView === "day" || calendarView === "upcoming") {
    const noteEntries = await Promise.all(
      dayAppointments.map(async (appointment) => {
        const result = await repo.listNotes("appointment", appointment.id);
        return [appointment.id, result.ok ? result.data : []] as const;
      })
    );
    for (const [id, notes] of noteEntries) notesByAppointment.set(id, notes);
  }

  const labels = new Map(
    appointments.map((appointment) => {
      const customer = customersById.get(appointment.customerId);
      const staff = staffById.get(appointment.staffId);
      const appointmentBranch = branchesById.get(appointment.branchId);
      return [
        appointment.id,
        {
          timeZone: appointmentBranch?.timezone ?? timeZone,
          customerLabel: customer?.name ?? customer?.phone ?? "Walk-in customer",
          customerHref: customer ? `/clients/${customer.id}` : undefined,
          staffLabel: staff?.displayName ?? "Unassigned staff",
          branchLabel: !branchFilter && branches.length > 1 ? appointmentBranch?.name : undefined,
        },
      ] as const;
    })
  );

  const emptyTitle =
    calendarView === "day"
      ? "No appointments this day"
      : calendarView === "upcoming"
        ? "No upcoming appointments"
        : calendarView === "week"
          ? "No appointments this week"
          : "No appointments this month";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Calendar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Day, week and month views with check-in, start service, and booking from the same board
          {branchFilter ? " for the selected store" : " across every store you can access"}.
        </p>
      </div>

      <CalendarToolbar
        view={calendarView}
        date={selectedDate}
        branch={branchFilter}
        heading={formatHeading(calendarView, selectedDate)}
      />

      {calendarView === "day" ? (
        <div className="today-checkin-banner">
          <p className="text-xs font-semibold uppercase tracking-wide text-rinads-primary">Check-in queue</p>
          <p className="mt-1 text-sm text-foreground">
            Use <span className="font-semibold">Check in</span> / <span className="font-semibold">Start service</span> on
            each appointment card. Walk-ins can be added with the form.
          </p>
        </div>
      ) : null}

      <NewAppointmentForm
        branches={branches.filter((branch) => branch.isActive)}
        services={(servicesResult.ok ? servicesResult.data : []).filter((service) => service.isActive)}
        staff={(staffResult.ok ? staffResult.data : []).filter((member) => member.isActive)}
        defaultStartsAtLocal={`${selectedDate}T10:00`}
      />

      {!appointmentsResult.ok ? (
        <Card>
          <p className="text-sm text-danger">Could not load appointments: {appointmentsResult.error.message}</p>
        </Card>
      ) : calendarView === "week" ? (
        <CalendarWeekGrid
          date={selectedDate}
          today={today}
          branch={branchFilter}
          appointmentsByDay={appointmentsByDay}
          labels={labels}
        />
      ) : calendarView === "month" ? (
        <CalendarMonthGrid
          date={selectedDate}
          today={today}
          branch={branchFilter}
          appointmentsByDay={appointmentsByDay}
          labels={labels}
        />
      ) : dayAppointments.length === 0 ? (
        <EmptyState title={emptyTitle} description="New bookings from your public booking page will appear here." />
      ) : (
        <div className="space-y-3">
          {dayAppointments.map((appointment) => {
            const meta = labels.get(appointment.id);
            return (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                timeZone={meta?.timeZone ?? timeZone}
                customerLabel={meta?.customerLabel ?? "Walk-in customer"}
                customerHref={meta?.customerHref}
                staffLabel={meta?.staffLabel ?? "Unassigned staff"}
                branchLabel={meta?.branchLabel}
                calendarHref={calendarHref({
                  view: calendarView,
                  date: calendarView === "upcoming" ? undefined : selectedDate,
                  branch: branchFilter,
                  appointment: appointment.id,
                })}
                notes={notesByAppointment.get(appointment.id) ?? []}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
