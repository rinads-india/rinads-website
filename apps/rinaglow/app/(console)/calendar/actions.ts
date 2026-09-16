"use server";

import type { AppointmentStatus } from "@rinads/salon";
import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { zonedLocalDateTimeToIso } from "@/lib/time";
import { requireTenancy } from "@/lib/tenancy";
import type { FormActionState } from "../services/actions";

export type FrontDeskBookingState = {
  error?: string;
  success?: boolean;
  appointmentId?: string;
  customerId?: string;
};

export async function createFrontDeskBookingAction(
  _previous: FrontDeskBookingState,
  formData: FormData
): Promise<FrontDeskBookingState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const branchId = String(formData.get("branchId") ?? "");
  const branches = await repo.listBranches(tenancy.organizationId);
  if (!branches.ok) return { error: branches.error.message };
  const branch = branches.data.find((item) => item.id === branchId);
  if (!branch) return { error: "Choose a branch in this organization." };
  const startsAt = zonedLocalDateTimeToIso(String(formData.get("startsAtLocal") ?? ""), branch.timezone);
  if (!startsAt) return { error: "Choose a valid date and time." };

  const result = await repo.createFrontDeskBooking(tenancy.organizationId, {
    branchId,
    staffId: String(formData.get("staffId") ?? ""),
    serviceIds: formData.getAll("serviceIds").map(String),
    startsAt,
    customerPhone: String(formData.get("customerPhone") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    createdBy: tenancy.userId,
  });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/calendar");
  revalidatePath("/clients");
  return {
    success: true,
    appointmentId: result.data.id,
    customerId: result.data.customerId,
  };
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  fromStatus: AppointmentStatus,
  toStatus: AppointmentStatus,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.updateAppointmentStatus(appointmentId, fromStatus, toStatus, reason);
  revalidatePath("/calendar");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  currentStatus: AppointmentStatus,
  newStartsAt: string
): Promise<{ ok: boolean; error?: string }> {
  await requireTenancy();
  const repo = await getSalonRepository();
  const apptResult = await repo.getAppointment(appointmentId);
  if (!apptResult.ok) return { ok: false, error: apptResult.error.message };
  const durationMs = new Date(apptResult.data.endsAt).getTime() - new Date(apptResult.data.startsAt).getTime();
  const newEndsAt = new Date(new Date(newStartsAt).getTime() + durationMs).toISOString();
  const result = await repo.rescheduleAppointment(appointmentId, currentStatus, newStartsAt, newEndsAt);
  revalidatePath("/calendar");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function addAppointmentNoteAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!appointmentId || !body) return { error: "A note body is required." };
  const result = await repo.createNote(tenancy.organizationId, {
    entityType: "appointment",
    entityId: appointmentId,
    body,
    createdBy: tenancy.userId,
  });
  revalidatePath("/calendar");
  if (!result.ok) return { error: result.error.message };
  return undefined;
}
