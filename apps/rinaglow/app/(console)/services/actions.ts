"use server";

import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export type FormActionState = { error?: string } | undefined;

export async function createServiceAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim() || "general";
  const durationMin = Number(formData.get("durationMin"));
  const price = Number(formData.get("price"));

  const result = await repo.createService(tenancy.organizationId, { name, category, durationMin, price });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/services");
  return undefined;
}
