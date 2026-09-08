"use server";

import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import type { FormActionState } from "../services/actions";

export async function createStaffAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();

  const displayName = String(formData.get("displayName") ?? "").trim();
  const branchId = String(formData.get("branchId") ?? "").trim() || undefined;
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim();
  const specialties = specialtiesRaw
    ? specialtiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const result = await repo.createStaff(tenancy.organizationId, { displayName, branchId, specialties });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/staff");
  return undefined;
}
