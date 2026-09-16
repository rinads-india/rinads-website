"use client";

import type { SalonCustomer, SalonLoyaltyProgram } from "@rinads/salon";
import { useActionState } from "react";
import { adjustLoyaltyAction, saveLoyaltyProgramAction, type LoyaltyActionState } from "./actions";

function Message({ state }: { state: LoyaltyActionState }) {
  if (state?.error) return <p className="mt-2 text-xs text-danger">{state.error}</p>;
  if (state?.success) return <p className="mt-2 text-xs text-emerald-700">{state.success}</p>;
  return null;
}

export function ProgramForm({ program }: { program?: SalonLoyaltyProgram }) {
  const [state, action, pending] = useActionState(saveLoyaltyProgramAction, undefined);
  return (
    <form action={action} className="mt-3 grid gap-2 sm:grid-cols-5">
      <input name="name" defaultValue={program?.name ?? "R GLOW Rewards"} className="field-input" required />
      <input name="currency" defaultValue={program?.currency ?? "INR"} className="field-input" required />
      <input name="earnCurrencyUnits" type="number" min="1" defaultValue={program?.earnCurrencyUnits ?? 100} className="field-input" required />
      <input name="earnPoints" type="number" min="1" defaultValue={program?.earnPoints ?? 1} className="field-input" required />
      <input name="pointsPerCurrencyUnit" type="number" min="1" defaultValue={program?.pointsPerCurrencyUnit ?? 10} className="field-input" required />
      <button className="btn-primary text-xs" disabled={pending}>{pending ? "Saving…" : "Save program"}</button>
      <div className="sm:col-span-4"><Message state={state} /></div>
    </form>
  );
}

export function AdjustmentForm({ customers }: { customers: SalonCustomer[] }) {
  const [state, action, pending] = useActionState(adjustLoyaltyAction, undefined);
  return (
    <form action={action} className="mt-3 flex flex-wrap gap-2">
      <select name="customerId" className="field-input" required>
        <option value="">Select customer</option>
        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name ?? customer.phone}</option>)}
      </select>
      <input name="points" type="number" step="1" placeholder="+/- points" className="field-input w-28" required />
      <input name="reason" placeholder="Required reason" className="field-input flex-1" required />
      <button className="btn-primary text-xs" disabled={pending}>{pending ? "Posting…" : "Post adjustment"}</button>
      <div className="w-full"><Message state={state} /></div>
    </form>
  );
}
