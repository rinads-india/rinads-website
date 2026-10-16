"use client";

import { useActionState } from "react";
import { submitOsAction } from "@/lib/company-os/actions";
import { IDLE } from "@/lib/company-os/action-state";

/** One-click governed action (e.g. “Complete”). Risky actions respond with “sent for approval”. */
export function QuickAction({ actionKey, input, label, tone = "default" }: { actionKey: string; input: Record<string, unknown>; label: string; tone?: "default" | "primary" }) {
  const [state, dispatch, pending] = useActionState(submitOsAction, IDLE);
  function formAction(data: FormData) {
    data.set("input", JSON.stringify(input));
    data.set("idempotencyKey", globalThis.crypto.randomUUID());
    dispatch(data);
  }
  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="actionKey" value={actionKey} />
      <button
        type="submit"
        disabled={pending || state.status === "executed" || state.status === "approval_required"}
        className={`min-h-9 rounded-lg px-3 text-xs font-semibold disabled:opacity-60 ${tone === "primary" ? "bg-black text-white" : "border border-gray-300 bg-white text-gray-900"}`}
      >
        {pending ? "…" : state.status === "executed" ? "Done" : state.status === "approval_required" ? "Awaiting approval" : label}
      </button>
      {state.message && state.status !== "executed" && (
        <span role="status" aria-live="polite" className={`max-w-xs text-[11px] ${state.status === "approval_required" ? "text-sky-800" : "text-red-800"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
