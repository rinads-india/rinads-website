"use server";

import type { AttentionItem } from "@rinads/salon";
import { revalidatePath } from "next/cache";
import { resolveRinpoAction, runRinpoCommand } from "@/lib/rinpo";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import type { RinpoPageContext } from "@/lib/rinpo-page-context";

export type RinpoCommandOutcome =
  | { kind: "clarify"; question: string }
  | { kind: "results"; summary: string; results: { tool: string; ok: boolean; message: string; data?: unknown }[] };

function revalidateConsole() {
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/pos");
  revalidatePath("/clients");
  revalidatePath("/growth");
  revalidatePath("/campaigns");
  revalidatePath("/communications");
  revalidatePath("/loyalty");
}

export async function runRinpoCommandAction(
  text: string,
  lastAttentionItems: AttentionItem[] | undefined,
  lastCampaignDraftId?: string,
  pageContext: RinpoPageContext = {}
): Promise<RinpoCommandOutcome> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const safeContext: RinpoPageContext = {};
  if (pageContext.defaultBranchId) {
    const branches = await repo.listBranches(tenancy.organizationId);
    if (branches.ok && branches.data.some((branch) => branch.id === pageContext.defaultBranchId)) {
      safeContext.defaultBranchId = pageContext.defaultBranchId;
    }
  }
  if (pageContext.selectedCustomerId) {
    const customer = await repo.getCustomer(pageContext.selectedCustomerId);
    if (customer.ok && customer.data.organizationId === tenancy.organizationId) {
      safeContext.selectedCustomerId = customer.data.id;
    }
  }
  if (pageContext.selectedAppointmentId) {
    const appointment = await repo.getAppointment(pageContext.selectedAppointmentId);
    if (appointment.ok && appointment.data.organizationId === tenancy.organizationId) {
      safeContext.selectedAppointmentId = appointment.data.id;
      safeContext.selectedCustomerId ??= appointment.data.customerId;
      safeContext.defaultBranchId ??= appointment.data.branchId;
    }
  }
  if (pageContext.selectedSaleId) {
    const sale = await repo.getSale(pageContext.selectedSaleId);
    if (sale.ok && sale.data.organizationId === tenancy.organizationId) {
      safeContext.selectedSaleId = sale.data.id;
      safeContext.selectedCustomerId ??= sale.data.customerId;
      safeContext.defaultBranchId ??= sale.data.branchId;
    }
  }
  const result = await runRinpoCommand(tenancy, text, {
    lastAttentionItems,
    lastCampaignDraftId,
    ...safeContext,
  });
  revalidateConsole();
  return result;
}

export async function resolveRinpoActionAction(
  actionId: string,
  decision: "approve" | "reject"
): Promise<{ ok: boolean; message: string }> {
  const tenancy = await requireTenancy();
  const result = await resolveRinpoAction(tenancy, actionId, decision);
  revalidateConsole();
  return { ok: result.ok, message: result.message };
}
