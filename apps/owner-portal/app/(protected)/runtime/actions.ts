"use server";

import { revalidatePath } from "next/cache";
import { operations, opsContext } from "@/lib/commerce";

export async function replayRuntimeDeadLetterAction(formData: FormData): Promise<void> {
  const deadLetterId = String(formData.get("deadLetterId") ?? "");
  if (!deadLetterId) return;

  const ctx = opsContext();
  const result = operations.runtime.replayDeadLetter(
    {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      roleKey: ctx.roleKey,
      // Owner portal is founder-scoped in the current control-plane wiring.
      // Production tenancy must continue deriving this permission server-side.
      permissions: ["org.manage"],
    },
    deadLetterId,
    "Replayed from owner runtime control plane"
  );

  if (!result.ok) {
    throw new Error(result.error);
  }

  revalidatePath("/runtime");
}
