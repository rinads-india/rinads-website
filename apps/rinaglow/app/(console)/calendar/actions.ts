"use server";

import type { AppointmentStatus } from "@rinads/salon";
import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import type { FormActionState } from "../services/actions";

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
