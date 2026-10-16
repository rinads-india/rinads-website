"use server";

import { revalidatePath } from "next/cache";
import { decideGovernedAction, getActionSpec, runGovernedAction, type GovernedResult } from "@rinads/company-os";
import { createGovernedDeps, loadActionPolicy } from "@rinads/company-os-server";
import type { OsActionState } from "./action-state";
import { createSiteLeadSource } from "./site-leads";
import { getCompanyOsSession } from "./session";

const MAX_INPUT_BYTES = 20_000;

function describe(result: GovernedResult): OsActionState {
  switch (result.status) {
    case "executed":
      return { status: "executed", message: result.replayed ? "Already done (this request was repeated safely)." : "Done — the change was verified.", actionId: result.actionId, replayed: result.replayed };
    case "approval_required":
      return {
        status: "approval_required",
        message: `Sent for approval (${result.risk} risk). Nothing has changed yet — a permitted approver must approve it${result.replayed ? " (already requested)" : ""}.`,
        actionId: result.actionId,
        replayed: result.replayed,
      };
    case "denied":
      return { status: "denied", message: result.reasons.join(" ") };
    case "rejected":
      return { status: "rejected", message: "This request was rejected or has expired.", actionId: result.actionId };
    case "failed":
      return {
        status: "failed",
        message: `${result.error}${result.uncertain ? " The change may have been partly applied — check the record before retrying." : ""}`,
        actionId: result.actionId ?? undefined,
      };
  }
}

async function deps() {
  const session = await getCompanyOsSession("/os");
  if (session.kind !== "ready") return null;
  const policy = await loadActionPolicy(session.db, session.ctx.organizationId);
  return { session, governed: createGovernedDeps(session.db, { policy, siteLeads: createSiteLeadSource(session.ctx.organizationId) }) };
}

function parseJson(value: FormDataEntryValue | null): Record<string, unknown> | null {
  if (typeof value !== "string" || value.length > MAX_INPUT_BYTES) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * The single write entry point for Company OS forms. The browser supplies an action key + input;
 * authority comes ONLY from the signed-in session (tenant, role, permissions) and the governed
 * pipeline: permission → risk → approval → typed domain tool → verification → audit/event.
 */
export async function submitOsAction(_prev: OsActionState, formData: FormData): Promise<OsActionState> {
  const actionKey = String(formData.get("actionKey") ?? "");
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");
  const input = parseJson(formData.get("input"));
  if (!getActionSpec(actionKey)) return { status: "denied", message: "Unknown action." };
  if (!/^[\w:.-]{8,100}$/.test(idempotencyKey)) return { status: "denied", message: "The form expired. Reload the page and try again." };
  if (!input) return { status: "denied", message: "The request could not be read." };

  const d = await deps();
  if (!d) return { status: "denied", message: "Company OS needs a live organisation session." };
  const result = await runGovernedAction(d.governed, {
    actionKey,
    input,
    actor: { kind: "user", userId: d.session.ctx.userId },
    ctx: d.session.ctx,
    idempotencyKey: `ui:${d.session.ctx.userId}:${idempotencyKey}`,
  });
  revalidatePath("/os", "layout");
  return describe(result);
}

export async function decideOsAction(_prev: OsActionState, formData: FormData): Promise<OsActionState> {
  const actionId = String(formData.get("actionId") ?? "");
  const decision = formData.get("decision") === "reject" ? "reject" : "approve";
  const reason = String(formData.get("reason") ?? "").slice(0, 500);
  if (!/^[0-9a-f-]{36}$/i.test(actionId)) return { status: "denied", message: "Invalid request." };
  if (decision === "reject" && !reason.trim()) return { status: "denied", message: "Say why you are rejecting it." };

  const d = await deps();
  if (!d) return { status: "denied", message: "Company OS needs a live organisation session." };
  const result = await decideGovernedAction(d.governed, { actionId, decision, approver: d.session.ctx, reason: reason || null });
  revalidatePath("/os", "layout");
  return describe(result);
}
