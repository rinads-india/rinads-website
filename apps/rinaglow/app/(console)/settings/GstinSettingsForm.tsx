"use client";

import type { SalonBillingSettings, SalonBranch } from "@rinads/salon";
import { useActionState } from "react";
import { saveBillingSettingsAction, saveBranchGstinAction, type FormActionState } from "./actions";

export function GstinSettingsForm({
  billing,
  branches,
}: {
  billing: SalonBillingSettings;
  branches: SalonBranch[];
}) {
  const [orgState, orgAction, orgPending] = useActionState<FormActionState, FormData>(saveBillingSettingsAction, undefined);
  const [branchState, branchAction, branchPending] = useActionState<FormActionState, FormData>(saveBranchGstinAction, undefined);

  return (
    <div className="space-y-4">
      <form action={orgAction} className="grid gap-3 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm text-muted-foreground">
          Used on GST tax invoices printed from POS. Leave GSTIN blank until the founder has the salon&rsquo;s registration.
        </p>
        <label className="field-label">
          Legal name
          <input name="legalName" className="field-input mt-1" defaultValue={billing.legalName} placeholder="Registered salon name" />
        </label>
        <label className="field-label">
          GSTIN
          <input name="gstin" className="field-input mt-1 font-mono uppercase" defaultValue={billing.gstin} placeholder="32AABCK1234A1Z5" maxLength={15} />
        </label>
        <label className="field-label">
          State
          <input name="stateName" className="field-input mt-1" defaultValue={billing.stateName} placeholder="Kerala" />
        </label>
        <label className="field-label">
          State code
          <input name="stateCode" className="field-input mt-1" defaultValue={billing.stateCode} placeholder="32" maxLength={2} />
        </label>
        <label className="field-label">
          SAC code
          <input name="sacCode" className="field-input mt-1" defaultValue={billing.sacCode} placeholder="9997" />
        </label>
        <label className="field-label">
          PAN (optional)
          <input name="pan" className="field-input mt-1 uppercase" defaultValue={billing.pan ?? ""} />
        </label>
        <label className="field-label sm:col-span-2">
          Registered address
          <input name="address" className="field-input mt-1" defaultValue={billing.address ?? ""} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={orgPending}>
            {orgPending ? "Saving…" : "Save GST details"}
          </button>
          {orgState?.error ? <p className="mt-2 text-xs text-danger">{orgState.error}</p> : null}
          {orgState && !orgState.error ? <p className="mt-2 text-xs text-emerald-700">GST details saved.</p> : null}
        </div>
      </form>

      {branches.length ? (
        <form action={branchAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <p className="sm:col-span-2 lg:col-span-4 text-sm font-semibold text-foreground">Branch GSTIN (optional)</p>
          <label className="field-label">
            Branch
            <select name="branchId" className="field-input mt-1" defaultValue={branches[0]?.id}>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            GSTIN
            <input name="gstin" className="field-input mt-1 font-mono uppercase" placeholder="Leave blank to use salon GSTIN" maxLength={15} />
          </label>
          <label className="field-label">
            State
            <input name="stateName" className="field-input mt-1" placeholder="Kerala" />
          </label>
          <label className="field-label">
            State code
            <input name="stateCode" className="field-input mt-1" placeholder="32" maxLength={2} />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-secondary" disabled={branchPending}>
              {branchPending ? "Saving…" : "Save branch GSTIN"}
            </button>
            {branchState?.error ? <p className="mt-2 text-xs text-danger">{branchState.error}</p> : null}
            {branchState && !branchState.error ? <p className="mt-2 text-xs text-emerald-700">Branch GSTIN saved.</p> : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
