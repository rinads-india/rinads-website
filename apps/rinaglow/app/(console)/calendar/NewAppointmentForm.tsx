"use client";

import type { SalonBranch, SalonService, SalonStaff } from "@rinads/salon";
import { useActionState, useRef, useState } from "react";
import { createFrontDeskBookingAction, type FrontDeskBookingState } from "./actions";

const INITIAL_STATE: FrontDeskBookingState = {};

function bookingKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `front-desk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function NewAppointmentForm({
  branches,
  services,
  staff,
}: {
  branches: SalonBranch[];
  services: SalonService[];
  staff: SalonStaff[];
}) {
  const [state, action, pending] = useActionState(createFrontDeskBookingAction, INITIAL_STATE);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const idempotencyInput = useRef<HTMLInputElement | null>(null);
  const branch = branches.find((item) => item.id === branchId);
  const availableStaff = staff.filter((member) => member.branchId === branchId);

  return (
    <details className="rounded-xl border border-rinads-primary/20 bg-surface p-4">
      <summary className="cursor-pointer text-sm font-semibold text-rinads-primary">+ New appointment</summary>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          ref={(node) => {
            idempotencyInput.current = node;
            if (node && !node.value) node.value = bookingKey();
          }}
          type="hidden"
          name="idempotencyKey"
          defaultValue=""
        />
        <label className="text-xs font-medium text-muted-foreground">
          Branch
          <select name="branchId" required value={branchId} onChange={(event) => setBranchId(event.target.value)} className="mt-1 w-full">
            {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Staff
          <select name="staffId" required className="mt-1 w-full" key={branchId}>
            <option value="">Choose staff</option>
            {availableStaff.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
          </select>
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-xs font-medium text-muted-foreground">Services</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <label key={service.id} className="flex items-center gap-2 rounded-lg border border-rinads-primary/10 p-2 text-sm">
                <input type="checkbox" name="serviceIds" value={service.id} />
                <span>{service.name} · {service.durationMin + service.bufferMin} min blocked</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-xs font-medium text-muted-foreground">
          Date and time
          <input name="startsAtLocal" type="datetime-local" required step={900} className="mt-1 w-full" />
          <span className="mt-1 block font-normal">Enter time in {branch?.timezone ?? "the branch timezone"}.</span>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Customer phone
          <input name="customerPhone" type="tel" required inputMode="tel" pattern="\+?[0-9]{8,15}" className="mt-1 w-full" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Customer name
          <input name="customerName" className="mt-1 w-full" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Notes (optional)
          <input name="notes" className="mt-1 w-full" />
        </label>
        <div className="sm:col-span-2">
          {state.error ? <p className="mb-2 text-sm text-danger">{state.error}</p> : null}
          {state.success ? (
            <p className="mb-2 text-sm text-emerald-700">
              Appointment booked. <a href={`/clients/${state.customerId}`} className="underline">Open client profile</a>
            </p>
          ) : null}
          <button type="submit" disabled={pending || state.success || !branches.length || !services.length || !availableStaff.length} className="btn-primary">
            {pending ? "Booking…" : "Book appointment"}
          </button>
        </div>
      </form>
    </details>
  );
}
