"use client";

import type { AppointmentStatus } from "@rinads/salon";
import { useState, useTransition } from "react";
import { rescheduleAppointmentAction } from "./actions";

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentReschedule({
  appointmentId,
  status,
  startsAt,
  canReschedule,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  startsAt: string;
  canReschedule: boolean;
}) {
  const [value, setValue] = useState(toLocalInputValue(startsAt));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!canReschedule) return null;

  return (
    <div className="flex items-center gap-2">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="field-input py-1 text-xs"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const res = await rescheduleAppointmentAction(appointmentId, status, new Date(value).toISOString());
            setMessage(res.ok ? "Rescheduled." : res.error ?? "Could not reschedule.");
          })
        }
        className="rounded-lg border border-rinads-primary/30 px-2.5 py-1 text-xs font-medium text-rinads-primary hover:bg-rinads-primary/10 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Reschedule"}
      </button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
