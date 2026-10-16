"use client";

import { useActionState } from "react";
import { decideOsAction } from "@/lib/company-os/actions";
import { IDLE } from "@/lib/company-os/action-state";

export function ApprovalControls({ actionId, canDecide, reason }: { actionId: string; canDecide: boolean; reason?: string }) {
  const [state, action, pending] = useActionState(decideOsAction, IDLE);
  if (!canDecide) {
    return <p className="text-xs text-gray-500">{reason ?? "You cannot decide this request."}</p>;
  }
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="actionId" value={actionId} />
      <label className="text-xs font-medium text-gray-700" htmlFor={`reason-${actionId}`}>Reason (required to reject)</label>
      <input id={`reason-${actionId}`} name="reason" maxLength={500} className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm" />
      <div className="flex flex-wrap gap-2">
        <button name="decision" value="approve" disabled={pending} className="min-h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-60">Approve</button>
        <button name="decision" value="reject" disabled={pending} className="min-h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 disabled:opacity-60">Reject</button>
      </div>
      <p role="status" aria-live="polite" className={`text-xs ${state.status === "executed" ? "text-emerald-800" : state.status === "idle" ? "" : "text-red-800"}`}>{state.message}</p>
    </form>
  );
}
