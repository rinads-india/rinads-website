import { Badge, Card } from "@rinads/ui";
import { canRescheduleAppointment, calendarLegendKey, type AppointmentStatus, type SalonAppointment, type SalonNote } from "@rinads/salon";
import Link from "next/link";
import { AppointmentActions } from "./AppointmentActions";
import { AppointmentNotes } from "./AppointmentNotes";
import { AppointmentReschedule } from "./AppointmentReschedule";

const STATUS_TONE: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-purple-100 text-purple-800",
  in_service: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-200 text-gray-600",
  no_show: "bg-red-100 text-red-700",
};

export function formatAppointmentTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { timeZone, hour: "2-digit", minute: "2-digit" });
}

export function AppointmentCard({
  appointment,
  timeZone,
  customerLabel,
  customerHref,
  staffLabel,
  branchLabel,
  calendarHref,
  notes,
  variant = "full",
}: {
  appointment: SalonAppointment;
  timeZone: string;
  customerLabel: string;
  customerHref?: string;
  staffLabel: string;
  branchLabel?: string;
  calendarHref: string;
  notes?: SalonNote[];
  variant?: "full" | "compact";
}) {
  const legend = calendarLegendKey(appointment.status);
  const time = formatAppointmentTime(appointment.startsAt, timeZone);
  const customer = customerHref ? (
    <Link href={customerHref} className="text-rinads-primary underline">
      {customerLabel}
    </Link>
  ) : (
    customerLabel
  );

  if (variant === "compact") {
    return (
      <article className={`cal-event cal-event-${legend}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-foreground">{time}</p>
            <p className="text-[11px] text-muted-foreground">{customerLabel}</p>
            <p className="text-[10px] text-muted-foreground">{staffLabel}</p>
          </div>
          <Badge className={STATUS_TONE[appointment.status]}>{appointment.status.replace("_", " ")}</Badge>
        </div>
        <div className="mt-2">
          <AppointmentActions appointmentId={appointment.id} status={appointment.status} />
        </div>
      </article>
    );
  }

  return (
    <Card className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between cal-event-${legend}`}>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{time}</span>
          <Badge className={STATUS_TONE[appointment.status]}>{appointment.status.replace("_", " ")}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {customer} · {staffLabel}
          {branchLabel ? ` · ${branchLabel}` : ""}
        </p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Link href={calendarHref} className="text-xs text-rinads-primary underline">
          Use in RINPO
        </Link>
        <AppointmentActions appointmentId={appointment.id} status={appointment.status} />
        <AppointmentReschedule
          appointmentId={appointment.id}
          status={appointment.status}
          startsAt={appointment.startsAt}
          canReschedule={canRescheduleAppointment(appointment.status)}
        />
        <AppointmentNotes appointmentId={appointment.id} notes={notes ?? []} />
      </div>
    </Card>
  );
}
