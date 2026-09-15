"use client";

import { Input } from "@rinads/ui";
import type { SalonBranch } from "@rinads/salon";
import { useActionState, useEffect, useRef } from "react";
import { createStaffAction } from "./actions";

export function NewStaffForm({ branches }: { branches: SalonBranch[] }) {
  const [state, formAction, isPending] = useActionState(createStaffAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="field-label" htmlFor="displayName">
          Name
        </label>
        <Input id="displayName" name="displayName" placeholder="Asha Menon" required />
      </div>
      <div>
        <label className="field-label" htmlFor="branchId">
          Branch
        </label>
        <select id="branchId" name="branchId" className="field-input" defaultValue="">
          <option value="">Unassigned</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="specialties">
          Specialties
        </label>
        <Input id="specialties" name="specialties" placeholder="Haircut, Colour" />
      </div>
      <div className="flex items-end">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Adding…" : "Add staff"}
        </button>
      </div>
      {state?.error ? <p className="text-xs text-danger sm:col-span-2 lg:col-span-4">{state.error}</p> : null}
    </form>
  );
}
