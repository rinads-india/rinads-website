"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCustomerNoteAction } from "./actions";

export function AddCustomerNoteForm({ customerId }: { customerId: string }) {
  const [state, formAction, isPending] = useActionState(addCustomerNoteAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="customerId" value={customerId} />
      <input name="body" placeholder="Add a note about this client…" className="field-input flex-1" required />
      <button type="submit" disabled={isPending} className="btn-primary text-xs">
        {isPending ? "Adding…" : "Add note"}
      </button>
      {state?.error ? <p className="w-full text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}
