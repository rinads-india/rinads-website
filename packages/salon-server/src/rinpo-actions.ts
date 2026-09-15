/**
 * RINPO action requests — reuses the existing `rinpo_actions` table
 * (from 20260824100000_rinads_services_foundation.sql) instead of a new
 * approval table. It already modeled exactly
 * pending -> approved/rejected -> executed/failed with an input/output
 * JSONB payload; Phase D only added `approved_by`/`resolved_at`/`reason`
 * columns (20260901100003_salon_events_and_rinpo_actions.sql).
 *
 * This is the persistence layer behind RINPO's `requiresApproval` tools
 * (`initiate_refund`, `modify_pricing`, `modify_discount`). A pending row
 * here IS the approval gate for tools with no natural domain pending-state
 * (pricing/discount overrides); for `initiate_refund` this row is created
 * *alongside* a `salon_refunds` pending row it references, so approving
 * either from the RINPO command bar or the POS console's refunds list
 * resolves the same underlying state (see plan's "Approval reuse" note).
 */
import { fail, ok, type Result } from "@rinads/salon";
import type { SalonRow, SalonSupabaseClient } from "./client";

export type RinpoActionStatus = "pending" | "approved" | "executed" | "failed" | "rejected";

export type RinpoActionRecord = {
  id: string;
  organizationId: string;
  userId?: string;
  actionType: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: RinpoActionStatus;
  reason?: string;
  approvedBy?: string;
  resolvedAt?: string;
  executedAt?: string;
  createdAt?: string;
};

function mapRinpoActionRow(row: SalonRow): RinpoActionRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    userId: row.user_id ? String(row.user_id) : undefined,
    actionType: String(row.action_type),
    input: (row.input as Record<string, unknown>) ?? {},
    output: (row.output as Record<string, unknown> | null) ?? undefined,
    status: row.status as RinpoActionStatus,
    reason: row.reason ? String(row.reason) : undefined,
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
    executedAt: row.executed_at ? String(row.executed_at) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

export class RinpoActionsRepository {
  constructor(private readonly client: SalonSupabaseClient) {}

  async createPending(
    organizationId: string,
    input: { userId?: string; actionType: string; input: Record<string, unknown>; reason?: string }
  ): Promise<Result<RinpoActionRecord>> {
    const { data, error } = await this.client
      .from("rinpo_actions")
      .insert({
        organization_id: organizationId,
        user_id: input.userId ?? null,
        action_type: input.actionType,
        input: input.input,
        status: "pending",
        reason: input.reason ?? null,
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No RINPO action returned after insert.");
    return ok(mapRinpoActionRow(data));
  }

  async listPending(organizationId: string): Promise<Result<RinpoActionRecord[]>> {
    const { data, error } = await this.client
      .from("rinpo_actions")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapRinpoActionRow));
  }

  async get(actionId: string): Promise<Result<RinpoActionRecord>> {
    const { data, error } = await this.client.from("rinpo_actions").select("*").eq("id", actionId).maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "RINPO action not found.");
    return ok(mapRinpoActionRow(data));
  }

  /** Gated at RLS by `org.manage` — a non-approver's update is rejected by the database, not just this code. */
  async approve(actionId: string, approvedBy: string): Promise<Result<true>> {
    const { error } = await this.client
      .from("rinpo_actions")
      .update({ status: "approved", approved_by: approvedBy, resolved_at: new Date().toISOString() })
      .eq("id", actionId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  async reject(actionId: string, resolvedBy: string): Promise<Result<true>> {
    const { error } = await this.client
      .from("rinpo_actions")
      .update({ status: "rejected", approved_by: resolvedBy, resolved_at: new Date().toISOString() })
      .eq("id", actionId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  async markExecuted(actionId: string, output: Record<string, unknown>): Promise<Result<true>> {
    const { error } = await this.client
      .from("rinpo_actions")
      .update({ status: "executed", output, executed_at: new Date().toISOString() })
      .eq("id", actionId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  async markFailed(actionId: string, errorMessage: string): Promise<Result<true>> {
    const { error } = await this.client
      .from("rinpo_actions")
      .update({ status: "failed", output: { error: errorMessage } })
      .eq("id", actionId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }
}
