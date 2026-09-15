"use server";

import type { AttentionItem } from "@rinads/salon";
import { revalidatePath } from "next/cache";
import { resolveRinpoAction, runRinpoCommand } from "@/lib/rinpo";
import { requireTenancy } from "@/lib/tenancy";

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
}

export async function runRinpoCommandAction(
  text: string,
  lastAttentionItems: AttentionItem[] | undefined,
  lastCampaignDraftId?: string
): Promise<RinpoCommandOutcome> {
  const tenancy = await requireTenancy();
  const result = await runRinpoCommand(tenancy, text, { lastAttentionItems, lastCampaignDraftId });
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
