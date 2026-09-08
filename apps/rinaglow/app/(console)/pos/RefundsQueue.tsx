"use client";

import { Badge } from "@rinads/ui";
import type { SalonRefund } from "@rinads/salon";
import { useState, useTransition } from "react";
import { resolveRefundAction } from "./actions";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  processed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-gray-200 text-gray-600",
};

function RefundRow({ refund, canApprove }: { refund: SalonRefund; canApprove: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function resolve(decision: "approve" | "process" | "reject") {
    setError(null);
    startTransition(async () => {
      const res = await resolveRefundAction(refund.id, refund.status, decision);
      if (!res.ok) setError(res.error ?? "Could not update refund.");
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rinads-primary/10 p-2.5 text-xs">
      <div>
        <div className="flex items-center gap-2">
          <Badge className={STATUS_TONE[refund.status]}>{refund.status}</Badge>
          <span className="font-medium text-foreground">
            {refund.amount.toLocaleString("en-IN")} · {refund.reason}
          </span>
        </div>
        {error ? <p className="mt-1 text-danger">{error}</p> : null}
      </div>
      {canApprove ? (
        <div className="flex gap-1.5">
          {refund.status === "pending" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => resolve("approve")}
              className="rounded-lg bg-rinads-primary px-2 py-1 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Approve
            </button>
          ) : null}
          {refund.status === "approved" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => resolve("process")}
              className="rounded-lg bg-rinads-primary px-2 py-1 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Mark processed
            </button>
          ) : null}
          {refund.status === "pending" || refund.status === "approved" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => resolve("reject")}
              className="rounded-lg border border-danger/40 px-2 py-1 font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              Reject
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function RefundsQueue({ refunds, canApprove }: { refunds: SalonRefund[]; canApprove: boolean }) {
  if (!refunds.length) return <p className="text-sm text-muted-foreground">No refund requests.</p>;
  return (
    <ul className="space-y-2">
      {refunds.map((r) => (
        <RefundRow key={r.id} refund={r} canApprove={canApprove} />
      ))}
    </ul>
  );
}
