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
