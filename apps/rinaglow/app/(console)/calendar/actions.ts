"use server";

import type { AppointmentStatus } from "@rinads/salon";
import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export async function updateAppointmentStatusAction(
  appointmentId: string,
  fromStatus: AppointmentStatus,
  toStatus: AppointmentStatus
): Promise<{ ok: boolean; error?: string }> {
  await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.updateAppointmentStatus(appointmentId, fromStatus, toStatus);
  revalidatePath("/calendar");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}
