"use server";

import type { BusyRange } from "@rinads/salon";
import { getPublicSalonRepository } from "@/lib/salon-booking";

export type GetBusySlotsResult = { ok: true; busy: BusyRange[] } | { ok: false; error: string };

export async function getBusySlotsAction(
  organizationId: string,
  staffId: string,
  dayFromIso: string,
  dayToIso: string
): Promise<GetBusySlotsResult> {
  const repo = await getPublicSalonRepository();
  const result = await repo.getPublicBusySlots(organizationId, staffId, dayFromIso, dayToIso);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, busy: result.data };
}

export type CreateBookingInput = {
  organizationId: string;
  branchId: string;
  staffId: string;
  serviceIds: string[];
  startsAt: string;
  customerPhone: string;
  customerName: string;
  customerEmail?: string;
  notes?: string;
};

export type CreateBookingResult =
  | { ok: true; appointmentId: string; startsAt: string; endsAt: string }
  | { ok: false; error: string };

export async function createBookingAction(input: CreateBookingInput): Promise<CreateBookingResult> {
  const repo = await getPublicSalonRepository();
  const result = await repo.createPublicBooking({
    organizationId: input.organizationId,
    branchId: input.branchId,
    staffId: input.staffId,
    serviceIds: input.serviceIds,
    startsAt: input.startsAt,
    customerPhone: input.customerPhone,
    customerName: input.customerName || undefined,
    customerEmail: input.customerEmail || undefined,
    notes: input.notes || undefined,
  });
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, appointmentId: result.data.appointmentId, startsAt: result.data.startsAt, endsAt: result.data.endsAt };
}
