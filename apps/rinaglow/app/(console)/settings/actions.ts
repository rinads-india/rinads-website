"use server";

import { isPrivilegedRoleKey } from "@rinads/permissions";
import { revalidatePath } from "next/cache";
import { getSalonDeps, getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import type { FormActionState } from "../services/actions";

export type { FormActionState };

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

function canManageWhatsApp(roleKey: string | undefined, permissions: string[]): boolean {
  return isPrivilegedRoleKey(roleKey ?? "") || permissions.includes("org.manage");
}

export async function saveWhatsAppSettingsAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  if (!canManageWhatsApp(tenancy.roleKey, tenancy.permissions)) {
    return { error: "You do not have permission to change WhatsApp settings." };
  }

  const modeRaw = String(formData.get("mode") ?? "off").trim().toLowerCase();
  const mode = modeRaw === "sandbox" || modeRaw === "live" ? modeRaw : "off";
  const sendEnabled = formData.get("sendEnabled") === "1";
  const sandboxAllowlist = String(formData.get("sandboxAllowlist") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const { client } = await getSalonDeps();
  const settingsResult = await client.rpc("update_salon_whatsapp_settings", {
    p_organization_id: tenancy.organizationId,
    p_mode: mode,
    p_sandbox_allowlist: sandboxAllowlist,
  });
  if (settingsResult.error) return { error: settingsResult.error.message };

  const flagResult = await client.rpc("set_salon_whatsapp_send_enabled", {
    p_organization_id: tenancy.organizationId,
    p_enabled: sendEnabled,
  });
  if (flagResult.error) return { error: flagResult.error.message };

  revalidatePath("/settings");
  revalidatePath("/communications");
  return {};
}

export async function saveBillingSettingsAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.updateBillingSettings(tenancy.organizationId, {
    legalName: String(formData.get("legalName") ?? "").trim(),
    gstin: String(formData.get("gstin") ?? "").trim(),
    stateName: String(formData.get("stateName") ?? "").trim(),
    stateCode: String(formData.get("stateCode") ?? "").trim(),
    sacCode: String(formData.get("sacCode") ?? "9997").trim() || "9997",
    address: String(formData.get("address") ?? "").trim() || undefined,
    pan: String(formData.get("pan") ?? "").trim() || undefined,
  });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/settings");
  revalidatePath("/pos");
  return {};
}

export async function saveBranchGstinAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const branchId = String(formData.get("branchId") ?? "").trim();
  if (!branchId) return { error: "Choose a branch." };
  const branches = await repo.listBranches(tenancy.organizationId);
  if (!branches.ok || !branches.data.some((branch) => branch.id === branchId)) {
    return { error: "Branch not found in this salon." };
  }
  const result = await repo.updateBranchGstin(branchId, {
    gstin: String(formData.get("gstin") ?? "").trim() || undefined,
    stateName: String(formData.get("stateName") ?? "").trim() || undefined,
    stateCode: String(formData.get("stateCode") ?? "").trim() || undefined,
  });
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/settings");
  revalidatePath("/pos");
  return {};
}
