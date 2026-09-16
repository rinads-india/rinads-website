"use client";

import type { LowRatingFollowUp } from "@rinads/salon-server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resolveLowRatingFollowUpAction } from "./actions";

export function LowRatingQueue({ items, canManage }: { items: LowRatingFollowUp[]; canManage: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const router = useRouter();
  if (!items.length) return <p className="mt-3 text-sm text-muted-foreground">No low-rating follow-ups are open.</p>;
  return (
    <>
    {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    <ul className="mt-3 space-y-2">
      {items.map(({ feedback, customer }) => (
        <li key={feedback.id} className="rounded-lg border border-rose-200 p-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{feedback.rating}/5 · {customer.name ?? customer.phone}</p>
              <p className="mt-1 text-muted-foreground">{feedback.comment ?? "No comment provided."}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {feedback.createdAt ? new Date(feedback.createdAt).toLocaleString("en-IN") : ""}
              </p>
              <Link href={`/clients/${customer.id}`} className="mt-1 inline-block text-xs text-rinads-primary underline">Open client</Link>
            </div>
            {canManage ? (
              <button
                type="button"
                disabled={pending}
                className="btn-secondary"
                onClick={() => startTransition(async () => {
                  setError(undefined);
                  const result = await resolveLowRatingFollowUpAction(feedback.id);
                  if (!result.ok) {
                    setError(result.message);
                    return;
                  }
                  router.refresh();
                })}
              >
                Mark resolved
              </button>
            ) : <span className="text-xs text-muted-foreground">Manager action required</span>}
          </div>
        </li>
      ))}
    </ul>
    </>
  );
}
