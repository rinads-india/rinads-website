"use client";

import { Badge } from "@rinads/ui";
import { useState, useTransition } from "react";
import { resolvePendingActionAction } from "./actions";

export type PendingActionRow = {
  id: string;
  actionType: string;
  input: Record<string, unknown>;
  createdAt?: string;
};

function ActionRow({ action }: { action: PendingActionRow }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function resolve(decision: "approve" | "reject") {
    startTransition(async () => {
      const res = await resolvePendingActionAction(action.id, decision);
      setMessage(res.message);
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-rinads-primary/15 bg-surface-muted p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-100 text-amber-800">Pending approval</Badge>
          <span className="text-sm font-medium text-foreground">{action.actionType}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{JSON.stringify(action.input)}</p>
        {message ? <p className="mt-1 text-xs text-muted-foreground">{message}</p> : null}
      </div>
      {!message ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => resolve("approve")}
            className="rounded-lg bg-rinads-primary px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => resolve("reject")}
            className="rounded-lg border border-danger/40 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function PendingActionsList({ actions }: { actions: PendingActionRow[] }) {
  if (!actions.length) {
    return <p className="text-sm text-muted-foreground">No sensitive actions are waiting on approval.</p>;
  }
  return (
    <ul className="space-y-2">
      {actions.map((a) => (
        <ActionRow key={a.id} action={a} />
      ))}
    </ul>
  );
}
