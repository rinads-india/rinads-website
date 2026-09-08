"use server";

import type { WeeklyHours } from "@rinads/salon";
import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export async function updateWorkingHoursAction(
  kind: "branch" | "staff",
  entityId: string,
  hours: WeeklyHours
): Promise<{ ok: boolean; error?: string }> {
  await requireTenancy();
  const repo = await getSalonRepository();
  const result =
    kind === "branch" ? await repo.updateBranchWorkingHours(entityId, hours) : await repo.updateStaffWorkingHours(entityId, hours);
  revalidatePath("/settings");
  revalidatePath("/staff");
  revalidatePath("/calendar");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}
