"use server";

import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export type FormActionState = { error?: string; success?: string } | undefined;

export async function createProductAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.createProduct(tenancy.organizationId, {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || "retail",
    sku: String(formData.get("sku") ?? "").trim() || undefined,
    reorderAt: Number(formData.get("reorderAt") ?? 0),
  });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: "Product added." };
}

export async function adjustStockAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.adjustStock(tenancy.organizationId, {
    branchId: String(formData.get("branchId") ?? ""),
    productId: String(formData.get("productId") ?? ""),
    delta: Number(formData.get("delta") ?? 0),
    reason: "adjustment",
    note: String(formData.get("note") ?? "").trim() || undefined,
  });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/inventory");
  return { success: "Stock updated." };
}

export async function transferStockAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const rawLines = String(formData.get("lines") ?? "[]");
  let lines: { productId: string; quantity: number }[] = [];
  try {
    const parsed = JSON.parse(rawLines) as unknown;
    if (Array.isArray(parsed)) {
      lines = parsed.map((item) => {
        const row = item as { productId?: string; quantity?: number };
        return { productId: String(row.productId ?? ""), quantity: Number(row.quantity ?? 0) };
      });
    }
  } catch {
    return { error: "Could not read transfer quantities." };
  }
  const result = await repo.transferStock(tenancy.organizationId, {
    fromBranchId: String(formData.get("fromBranchId") ?? ""),
    toBranchId: String(formData.get("toBranchId") ?? ""),
    lines,
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/inventory");
  return { success: result.data.idempotentReplay ? "Transfer already recorded." : "Transfer complete." };
}
