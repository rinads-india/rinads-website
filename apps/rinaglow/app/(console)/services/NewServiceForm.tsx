"use client";

import { Input } from "@rinads/ui";
import { useActionState, useEffect, useRef } from "react";
import { createServiceAction } from "./actions";

export function NewServiceForm() {
  const [state, formAction, isPending] = useActionState(createServiceAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <label className="field-label" htmlFor="name">
          Service name
        </label>
        <Input id="name" name="name" placeholder="Haircut & style" required />
      </div>
      <div>
        <label className="field-label" htmlFor="category">
          Category
        </label>
        <Input id="category" name="category" placeholder="hair" />
      </div>
      <div>
        <label className="field-label" htmlFor="durationMin">
          Duration (min)
        </label>
        <Input id="durationMin" name="durationMin" type="number" min={5} step={5} required placeholder="45" />
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="field-label" htmlFor="price">
            Price (INR)
          </label>
          <Input id="price" name="price" type="number" min={0} step={1} required placeholder="600" />
        </div>
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Adding…" : "Add service"}
        </button>
      </div>
      {state?.error ? <p className="text-xs text-danger sm:col-span-2 lg:col-span-4">{state.error}</p> : null}
    </form>
  );
}
