"use client";

import { DEFAULT_WEEKLY_HOURS, type DayHours, type WeeklyHours } from "@rinads/salon";
import { useState, useTransition } from "react";
import { updateWorkingHoursAction } from "@/app/(console)/working-hours-actions";

const DAYS: { key: keyof WeeklyHours; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export function WorkingHoursEditor({
  kind,
  entityId,
  initialHours,
}: {
  kind: "branch" | "staff";
  entityId: string;
  initialHours: WeeklyHours;
}) {
  const [hours, setHours] = useState<WeeklyHours>(
    Object.keys(initialHours ?? {}).length ? initialHours : DEFAULT_WEEKLY_HOURS
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function setDay(day: keyof WeeklyHours, value: DayHours) {
    setHours((prev) => ({ ...prev, [day]: value }));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateWorkingHoursAction(kind, entityId, hours);
      setMessage(res.ok ? "Saved." : res.error ?? "Could not save hours.");
    });
  }

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const day = hours[key] ?? null;
        return (
          <div key={key} className="flex items-center gap-2 text-xs">
            <label className="flex w-20 items-center gap-1.5">
              <input
                type="checkbox"
                checked={day !== null}
                onChange={(e) => setDay(key, e.target.checked ? { open: "10:00", close: "20:00" } : null)}
              />
              {label}
            </label>
            {day ? (
              <>
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => setDay(key, { ...day, open: e.target.value })}
                  className="field-input w-28 py-1"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => setDay(key, { ...day, close: e.target.value })}
                  className="field-input w-28 py-1"
                />
              </>
            ) : (
              <span className="text-muted-foreground">Closed</span>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-2">
        <button type="button" onClick={save} disabled={isPending} className="btn-primary text-xs">
          {isPending ? "Saving…" : "Save hours"}
        </button>
        {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
      </div>
    </div>
  );
}
