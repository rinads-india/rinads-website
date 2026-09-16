"use server";

import { revalidatePath } from "next/cache";
import { resolveRinpoAction } from "@/lib/rinpo";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { isPrivilegedRoleKey } from "@rinads/permissions";

export async function resolveLowRatingFollowUpAction(
  feedbackId: string
): Promise<{ ok: boolean; message: string }> {
  const tenancy = await requireTenancy();
  const canManage = isPrivilegedRoleKey(tenancy.roleKey ?? "")
    || tenancy.permissions.includes("salon.reviews.manage");
  if (!canManage) return { ok: false, message: "You do not have permission to resolve feedback." };
  const repo = await getSalonRepository();
  const result = await repo.resolveLowRatingFollowUp(tenancy.organizationId, feedbackId);
  revalidatePath("/dashboard");
  revalidatePath("/growth");
  return result.ok
    ? { ok: true, message: "Follow-up resolved." }
    : { ok: false, message: result.error.message };
}

export async function resolvePendingActionAction(
  actionId: string,
  decision: "approve" | "reject"
): Promise<{ ok: boolean; message: string }> {
  const tenancy = await requireTenancy();
  const result = await resolveRinpoAction(tenancy, actionId, decision);
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  return { ok: result.ok, message: result.message };
}
