"use server";

import { revalidatePath } from "next/cache";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export type LoyaltyActionState = { error?: string; success?: string } | undefined;

export async function saveLoyaltyProgramAction(_state: LoyaltyActionState, formData: FormData): Promise<LoyaltyActionState> {
  const tenancy = await requireTenancy();
  const { loyalty } = await getSalonDeps();
  const result = await loyalty.upsertProgram(tenancy.organizationId, {
    name: String(formData.get("name") ?? "").trim(),
    currency: String(formData.get("currency") ?? "INR"),
    earnCurrencyUnits: Number(formData.get("earnCurrencyUnits")),
    earnPoints: Number(formData.get("earnPoints")),
    pointsPerCurrencyUnit: Number(formData.get("pointsPerCurrencyUnit")),
    pointsExpiryDays: (() => {
      const raw = String(formData.get("pointsExpiryDays") ?? "").trim();
      if (!raw) return null;
      return Number(raw);
    })(),
  });
  revalidatePath("/loyalty");
  return result.ok ? { success: "Loyalty program saved." } : { error: result.error.message };
}

export async function adjustLoyaltyAction(_state: LoyaltyActionState, formData: FormData): Promise<LoyaltyActionState> {
  const tenancy = await requireTenancy();
  const { loyalty } = await getSalonDeps();
  const customerId = String(formData.get("customerId") ?? "");
  const points = Number(formData.get("points"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!customerId || !Number.isInteger(points) || points === 0 || !reason) return { error: "Customer, non-zero whole points, and reason are required." };
  const result = await loyalty.adjust(tenancy.organizationId, customerId, points, reason, `console-adjust:${crypto.randomUUID()}`);
  revalidatePath("/loyalty");
  revalidatePath(`/clients/${customerId}`);
  return result.ok ? { success: "Adjustment posted." } : { error: result.error.message };
}
