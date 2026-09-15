"use server";

import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import type { FormActionState } from "../../services/actions";

export async function addCustomerNoteAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const customerId = String(formData.get("customerId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!customerId || !body) return { error: "A note body is required." };

  const result = await repo.createNote(tenancy.organizationId, {
    entityType: "customer",
    entityId: customerId,
    body,
    createdBy: tenancy.userId,
  });
  if (!result.ok) return { error: result.error.message };
  revalidatePath(`/clients/${customerId}`);
  return undefined;
}
