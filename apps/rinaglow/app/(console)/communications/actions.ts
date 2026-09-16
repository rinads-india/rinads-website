"use server";

import { isPrivilegedRoleKey } from "@rinads/permissions";
import { revalidatePath } from "next/cache";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

function canRetry(roleKey: string | undefined, permissions: string[]) {
  return isPrivilegedRoleKey(roleKey ?? "") || permissions.includes("salon.communications.retry");
}

export async function retryCommunicationAction(outboxId: string): Promise<{ ok: boolean; error?: string }> {
  const tenancy = await requireTenancy();
  if (!canRetry(tenancy.roleKey, tenancy.permissions)) return { ok: false, error: "Insufficient permissions." };
  const { communications } = await getSalonDeps();
  const result = await communications.retryOne(tenancy.organizationId, outboxId);
  revalidatePath("/communications");
  revalidatePath(`/communications/${outboxId}`);
  revalidatePath("/growth");
  if (!result.ok) return { ok: false, error: result.error.message };
  return result.data.count === 1 ? { ok: true } : { ok: false, error: "Message is no longer retryable." };
}

export async function retryCommunicationFormAction(formData: FormData): Promise<void> {
  await retryCommunicationAction(String(formData.get("outboxId") ?? ""));
}
