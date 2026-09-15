"use server";

import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import type { FormActionState } from "../services/actions";

export async function createBranchAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || undefined;
  const city = String(formData.get("city") ?? "").trim() || undefined;
  const phone = String(formData.get("phone") ?? "").trim() || undefined;
  const timezone = String(formData.get("timezone") ?? "").trim() || undefined;

  const result = await repo.createBranch(tenancy.organizationId, { name, address, city, phone, timezone });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/settings");
  revalidatePath("/calendar");
  return undefined;
}
