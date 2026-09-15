"use server";

import { revalidatePath } from "next/cache";
import { resolveRinpoAction } from "@/lib/rinpo";
import { requireTenancy } from "@/lib/tenancy";

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
