"use server";

import type { PaymentMethod } from "@rinads/salon";
import { revalidatePath } from "next/cache";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export type FormActionState = { error?: string } | undefined;

function randomIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function createSaleFromAppointmentAction(appointmentId: string): Promise<{ ok: boolean; error?: string }> {
  const tenancy = await requireTenancy();
  const { repo } = await getSalonDeps();
  const apptResult = await repo.getAppointment(appointmentId);
  if (!apptResult.ok) return { ok: false, error: apptResult.error.message };
  const result = await repo.createSaleFromAppointment(tenancy.organizationId, apptResult.data, tenancy.userId);
  revalidatePath("/pos");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function addSaleLineAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const { repo } = await getSalonDeps();
  const saleId = String(formData.get("saleId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const unitPrice = Number(formData.get("unitPrice") ?? 0);
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!saleId || !description || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: "A description and a non-negative price are required." };
  }
  const result = await repo.addSaleLine(tenancy.organizationId, saleId, { description, unitPrice, quantity });
  revalidatePath("/pos");
  if (!result.ok) return { error: result.error.message };
  return undefined;
}

export async function finalizeSaleAction(saleId: string): Promise<{ ok: boolean; error?: string }> {
  const tenancy = await requireTenancy();
  const { repo } = await getSalonDeps();
  const result = await repo.finalizeSale(tenancy.organizationId, saleId);
  revalidatePath("/pos");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function recordPaymentAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const { repo } = await getSalonDeps();
  const saleId = String(formData.get("saleId") ?? "");
  const method = String(formData.get("method") ?? "cash") as PaymentMethod;
  const amount = Number(formData.get("amount") ?? 0);
  if (!saleId || !Number.isFinite(amount) || amount <= 0) {
    return { error: "A positive amount is required." };
  }
  const result = await repo.recordPayment(tenancy.organizationId, saleId, {
    method,
    amount,
    idempotencyKey: randomIdempotencyKey(`pos-payment-${saleId}`),
    recordedBy: tenancy.userId,
  });
  revalidatePath("/pos");
  if (!result.ok) return { error: result.error.message };
  return undefined;
}

export async function requestRefundAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const { repo } = await getSalonDeps();
  const saleId = String(formData.get("saleId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();
  if (!saleId || !Number.isFinite(amount) || amount <= 0 || !reason) {
    return { error: "A sale, positive amount, and reason are required." };
  }
  const result = await repo.requestRefund(tenancy.organizationId, { saleId, amount, reason, requestedBy: tenancy.userId });
  revalidatePath("/pos");
  if (!result.ok) return { error: result.error.message };
  return undefined;
}

export async function resolveRefundAction(
  refundId: string,
  currentStatus: "pending" | "approved" | "processed" | "rejected",
  decision: "approve" | "process" | "reject"
): Promise<{ ok: boolean; error?: string }> {
  const tenancy = await requireTenancy();
  const { repo } = await getSalonDeps();
  const result =
    decision === "approve"
      ? await repo.approveRefund(refundId, currentStatus, tenancy.userId)
      : decision === "process"
        ? await repo.processRefund(refundId, currentStatus)
        : await repo.rejectRefund(refundId, currentStatus);
  revalidatePath("/pos");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}
