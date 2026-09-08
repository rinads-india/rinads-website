"use client";

import type { SalonNote } from "@rinads/salon";
import { useActionState, useEffect, useRef } from "react";
import { addAppointmentNoteAction } from "./actions";

export function AppointmentNotes({ appointmentId, notes }: { appointmentId: string; notes: SalonNote[] }) {
  const [state, formAction, isPending] = useActionState(addAppointmentNoteAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-rinads-primary">Notes ({notes.length})</summary>
      <div className="mt-2 space-y-2">
        {notes.map((n) => (
          <p key={n.id} className="rounded-lg bg-surface-muted p-2 text-foreground">
            {n.body}
          </p>
        ))}
        <form ref={formRef} action={formAction} className="flex items-end gap-2">
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input name="body" placeholder="Add a note…" className="field-input flex-1 py-1" required />
          <button type="submit" disabled={isPending} className="btn-primary text-xs">
            {isPending ? "Adding…" : "Add"}
          </button>
        </form>
        {state?.error ? <p className="text-danger">{state.error}</p> : null}
      </div>
    </details>
  );
}
