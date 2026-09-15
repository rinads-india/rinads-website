import {
  deterministicRinpoNluAdapter,
  executeSalonRinpoTool,
  resolveSalonRinpoAction,
  type SalonRinpoContext,
} from "@rinads/intelligence";
import type { RinpoNluContext } from "@rinads/intelligence";
import type { TenancyContext } from "@rinads/tenancy";
import "server-only";
import { getSalonDeps } from "./salon";

export function toSalonRinpoContext(tenancy: TenancyContext): SalonRinpoContext {
  return {
    organizationId: tenancy.organizationId,
    userId: tenancy.userId,
    roleKey: tenancy.roleKey,
    permissions: tenancy.permissions,
  };
}

/**
 * Runs one natural-language command through the deterministic NLU
 * adapter, then executes every resulting tool call server-side. Used by
 * the command bar (`RinpoCommandBar` + its server action) — never called
 * from the client directly, so the tenancy-derived permission set can
 * never be spoofed by the caller.
 */
export async function runRinpoCommand(tenancy: TenancyContext, text: string, nluContext: Omit<RinpoNluContext, "organizationId">) {
  const parsed = deterministicRinpoNluAdapter.parse(text, { organizationId: tenancy.organizationId, ...nluContext });
  if (parsed.kind === "clarify") {
    return { kind: "clarify" as const, question: parsed.question };
  }

  const deps = await getSalonDeps();
  const ctx = toSalonRinpoContext(tenancy);
  const results = [];
  for (const call of parsed.calls) {
    results.push(await executeSalonRinpoTool(deps, ctx, call));
  }
  return { kind: "results" as const, summary: parsed.summary, results };
}

export async function resolveRinpoAction(tenancy: TenancyContext, actionId: string, decision: "approve" | "reject") {
  const deps = await getSalonDeps();
  const ctx = toSalonRinpoContext(tenancy);
  return resolveSalonRinpoAction(deps, ctx, actionId, decision);
}
