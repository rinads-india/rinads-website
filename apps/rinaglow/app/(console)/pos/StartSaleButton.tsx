"use client";

import { useState, useTransition } from "react";
import { createSaleFromAppointmentAction } from "./actions";

export function StartSaleButton({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return <span className="text-xs text-muted-foreground">Sale started</span>;

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await createSaleFromAppointmentAction(appointmentId);
            if (!res.ok) setError(res.error ?? "Could not start sale.");
            else setDone(true);
          })
        }
        className="btn-primary text-xs disabled:opacity-50"
      >
        {isPending ? "Starting…" : "Start checkout"}
      </button>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
