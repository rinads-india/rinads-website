"use client";

import { nextAppointmentStatuses, type AppointmentStatus } from "@rinads/salon";
import { useState, useTransition } from "react";
import { updateAppointmentStatusAction } from "./actions";

/** Labels the action button by the status it moves the appointment *to*. */
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Reopen",
  confirmed: "Confirm",
  checked_in: "Check in",
  in_service: "Start service",
  completed: "Complete",
  cancelled: "Cancel",
  no_show: "Mark no-show",
};

export function AppointmentActions({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const next = nextAppointmentStatuses(current);
  if (!next.length) return <span className="text-xs text-muted-foreground">No further actions</span>;

  function transitionTo(to: AppointmentStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateAppointmentStatusAction(appointmentId, current, to);
      if (!result.ok) {
        setError(result.error ?? "Could not update appointment.");
        return;
      }
      setCurrent(to);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next.map((to) => (
        <button
          key={to}
          type="button"
          disabled={isPending}
          onClick={() => transitionTo(to)}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
            to === "cancelled" || to === "no_show"
              ? "border border-danger/40 text-danger hover:bg-danger/10"
              : "bg-rinads-primary text-white hover:opacity-90"
          }`}
        >
          {STATUS_LABEL[to] ?? to}
        </button>
      ))}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
