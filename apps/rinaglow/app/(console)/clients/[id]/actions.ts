"use server";

import { revalidatePath } from "next/cache";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import type { FormActionState } from "../../services/actions";

const PREFERRED_CHANNELS = new Set(["whatsapp", "sms", "email", "none"]);

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

export async function updateCustomerCommunicationPreferencesAction(formData: FormData): Promise<void> {
  await requireTenancy();
  const repo = await getSalonRepository();
  const customerId = String(formData.get("customerId") ?? "");
  const preferredChannel = String(formData.get("preferredChannel") ?? "");
  if (!customerId || !PREFERRED_CHANNELS.has(preferredChannel)) return;

  await repo.updateCustomerCommunicationPreferences(customerId, {
    preferredChannel: preferredChannel as "whatsapp" | "sms" | "email" | "none",
    marketingConsent: formData.get("marketingConsent") === "on",
    marketingConsentSource: "operator_recorded",
    optedOutAt: formData.get("optedOut") === "on" ? new Date().toISOString() : null,
  });
  revalidatePath(`/clients/${customerId}`);
}
