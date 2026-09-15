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

export type GetEligibleStaffResult = { ok: true; staffIds: string[] | null } | { ok: false; error: string };

/**
 * Intersects `get_public_salon_staff_for_service` across every selected
 * service. `staffIds: null` means "no restriction configured for any
 * selected service" — the wizard should fall back to branch staff as-is.
 */
export async function getEligibleStaffAction(serviceIds: string[]): Promise<GetEligibleStaffResult> {
  if (!serviceIds.length) return { ok: true, staffIds: null };
  const repo = await getPublicSalonRepository();
  let intersection: Set<string> | null = null;

  for (const serviceId of serviceIds) {
    const result = await repo.getPublicStaffIdsForService(serviceId);
    if (!result.ok) return { ok: false, error: result.error.message };
    if (!result.data.length) continue; // no restriction for this service
    intersection = intersection === null ? new Set(result.data) : new Set(result.data.filter((id) => intersection!.has(id)));
  }

  return { ok: true, staffIds: intersection ? [...intersection] : null };
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
  /** Client-generated once per booking attempt — a resubmit (double-click, network retry) replays the same booking instead of double-booking. */
  idempotencyKey: string;
};

export type CreateBookingResult =
  | { ok: true; appointmentId: string; startsAt: string; endsAt: string; bookingNumber?: string }
  | { ok: false; error: string };

export async function createBookingAction(input: CreateBookingInput): Promise<CreateBookingResult> {
  const repo = await getPublicSalonRepository();

  // Pre-submit revalidation: re-check the slot is still free right before
  // writing, so a stale slot list (someone else booked it moments ago)
  // fails fast with a clear message instead of relying solely on the DB's
  // exclusion-constraint error text (which still applies as the final guard).
  const startsAtMs = new Date(input.startsAt).getTime();
  const windowFrom = new Date(startsAtMs - 60 * 60_000).toISOString();
  const windowTo = new Date(startsAtMs + 60 * 60_000).toISOString();
  const busyResult = await repo.getPublicBusySlots(input.organizationId, input.staffId, windowFrom, windowTo);
  if (busyResult.ok) {
    const stillBusy = busyResult.data.some(
      (b) => startsAtMs < new Date(b.end).getTime() && startsAtMs + 60_000 > new Date(b.start).getTime()
    );
    if (stillBusy) {
      return { ok: false, error: "This slot was just booked by someone else. Please choose another time." };
    }
  }

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
    idempotencyKey: input.idempotencyKey,
  });
  if (!result.ok) return { ok: false, error: result.error.message };
  return {
    ok: true,
    appointmentId: result.data.appointmentId,
    startsAt: result.data.startsAt,
    endsAt: result.data.endsAt,
    bookingNumber: result.data.bookingNumber,
  };
}
