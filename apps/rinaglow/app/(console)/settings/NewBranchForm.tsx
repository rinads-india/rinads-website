"use client";

import { Input } from "@rinads/ui";
import { useActionState, useEffect, useRef } from "react";
import { createBranchAction } from "./actions";

export function NewBranchForm() {
  const [state, formAction, isPending] = useActionState(createBranchAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="field-label" htmlFor="name">
          Branch name
        </label>
        <Input id="name" name="name" placeholder="MG Road" required />
      </div>
      <div>
        <label className="field-label" htmlFor="city">
          City
        </label>
        <Input id="city" name="city" placeholder="Bengaluru" />
      </div>
      <div>
        <label className="field-label" htmlFor="phone">
          Phone
        </label>
        <Input id="phone" name="phone" placeholder="+91 90000 00000" />
      </div>
      <div>
        <label className="field-label" htmlFor="timezone">
          Timezone
        </label>
        <Input id="timezone" name="timezone" placeholder="Asia/Kolkata" defaultValue="Asia/Kolkata" />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="field-label" htmlFor="address">
          Address
        </label>
        <Input id="address" name="address" placeholder="123 MG Road, Bengaluru" />
      </div>
      <div className="flex items-end">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Adding…" : "Add branch"}
        </button>
      </div>
      {state?.error ? <p className="text-xs text-danger sm:col-span-2 lg:col-span-4">{state.error}</p> : null}
    </form>
  );
}
