"use server";

import { revalidatePath } from "next/cache";
import { operations, opsContext } from "@/lib/commerce";

export type ApprovalActionState = {
  ok: boolean;
  message?: string;
};

export async function approveRuntimeAction(
  _prev: ApprovalActionState,
  formData: FormData
): Promise<ApprovalActionState> {
  const approvalId = String(formData.get("approvalId") ?? "");
  const ctx = opsContext();
  const result = operations.runtime.approve(approvalId, ctx.userId ?? "user_owner_001");
  if (!result) {
    return { ok: false, message: "Approval not found or expired." };
  }
  await operations.runtime.processQueue({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    roleKey: "founder",
    permissions: ["org.manage"],
  });
  revalidatePath("/approvals");
  revalidatePath("/runtime");
  return { ok: true, message: "Approved." };
}

export async function rejectRuntimeAction(
  _prev: ApprovalActionState,
  formData: FormData
): Promise<ApprovalActionState> {
  const approvalId = String(formData.get("approvalId") ?? "");
  const ctx = opsContext();
  const result = operations.runtime.reject(approvalId, ctx.userId ?? "user_owner_001");
  if (!result) {
    return { ok: false, message: "Approval not found or expired." };
  }
  revalidatePath("/approvals");
  return { ok: true, message: "Rejected." };
}
