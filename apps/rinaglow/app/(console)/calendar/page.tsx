import { Badge, Card, EmptyState } from "@rinads/ui";
import { canRescheduleAppointment, type AppointmentStatus } from "@rinads/salon";
import Link from "next/link";
import { getSalonRepository } from "@/lib/salon";
import { oneDayAgoIso } from "@/lib/time";
import { requireTenancy } from "@/lib/tenancy";
import { AppointmentActions } from "./AppointmentActions";
import { AppointmentNotes } from "./AppointmentNotes";
import { AppointmentReschedule } from "./AppointmentReschedule";

export const metadata = { title: "Calendar — R GLOW Console" };

const STATUS_TONE: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-purple-100 text-purple-800",
  in_service: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-200 text-gray-600",
  no_show: "bg-red-100 text-red-700",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayHeading(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Groups a flat, already-sorted appointment list into day buckets — a lightweight day/week calendar view without a full grid widget. */
function groupByDay<T extends { startsAt: string }>(items: T[]): { key: string; heading: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKey(item.startsAt);
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupItems]) => ({ key, heading: formatDayHeading(groupItems[0].startsAt), items: groupItems }));
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const tenancy = await requireTenancy();
  const { branch: branchFilter } = await searchParams;
  const repo = await getSalonRepository();

  const [branchesResult, staffResult, customersResult, appointmentsResult] = await Promise.all([
    repo.listBranches(tenancy.organizationId),
    repo.listStaff(tenancy.organizationId),
    repo.listCustomers(tenancy.organizationId),
    repo.listAppointments(tenancy.organizationId, {
      branchId: branchFilter || undefined,
      from: oneDayAgoIso(),
    }),
  ]);

  const branches = branchesResult.ok ? branchesResult.data : [];
  const staffById = new Map((staffResult.ok ? staffResult.data : []).map((s) => [s.id, s]));
  const customersById = new Map((customersResult.ok ? customersResult.data : []).map((c) => [c.id, c]));
  const branchesById = new Map(branches.map((b) => [b.id, b]));
  const appointments = appointmentsResult.ok ? appointmentsResult.data : [];

  const notesByAppointment = new Map(
    await Promise.all(
      appointments.map(async (a) => {
        const result = await repo.listNotes("appointment", a.id);
        return [a.id, result.ok ? result.data : []] as const;
      })
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Calendar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upcoming appointments{branchFilter ? " for the selected branch" : " across every branch you can access"}.
          </p>
        </div>
        {branches.length > 1 ? (
          <div className="flex flex-wrap gap-1">
            <Link
              href="/calendar"
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                !branchFilter ? "bg-rinads-primary text-white" : "bg-surface-muted text-foreground"
              }`}
            >
              All branches
            </Link>
            {branches.map((b) => (
              <Link
                key={b.id}
                href={`/calendar?branch=${b.id}`}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  branchFilter === b.id ? "bg-rinads-primary text-white" : "bg-surface-muted text-foreground"
                }`}
              >
                {b.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {!appointmentsResult.ok ? (
        <Card>
          <p className="text-sm text-danger">Could not load appointments: {appointmentsResult.error.message}</p>
        </Card>
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No upcoming appointments"
          description="New bookings from your public booking page will appear here."
        />
      ) : (
        <div className="space-y-6">
          {groupByDay(appointments).map((day) => (
            <div key={day.key}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{day.heading}</h3>
              <div className="space-y-3">
                {day.items.map((appt) => {
                  const staff = staffById.get(appt.staffId);
                  const customer = customersById.get(appt.customerId);
                  const appointmentBranch = branchesById.get(appt.branchId);
                  return (
                    <Card key={appt.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{formatTime(appt.startsAt)}</span>
                          <Badge className={STATUS_TONE[appt.status]}>{appt.status.replace("_", " ")}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {customer?.name ?? customer?.phone ?? "Walk-in customer"} · {staff?.displayName ?? "Unassigned staff"}
                          {branches.length > 1 && appointmentBranch ? ` · ${appointmentBranch.name}` : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(appt.startsAt)}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <AppointmentActions appointmentId={appt.id} status={appt.status} />
                        <AppointmentReschedule
                          appointmentId={appt.id}
                          status={appt.status}
                          startsAt={appt.startsAt}
                          canReschedule={canRescheduleAppointment(appt.status)}
                        />
                        <AppointmentNotes appointmentId={appt.id} notes={notesByAppointment.get(appt.id) ?? []} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
