import type { SupabaseClient } from "@supabase/supabase-js";
import type { RinadsAgentPrincipal } from "./principal";
import { createRinadsAgentDataClient } from "./data-client";

export type RinadsAgentReadPolicyFailure = {
  ok: false;
  status: "forbidden" | "disabled" | "unavailable";
  reason: string;
};

export type RinadsAgentReadPolicySuccess = {
  ok: true;
  client: SupabaseClient;
};

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function isRinadsAgentReadEnabledForActor(
  rows: readonly Record<string, unknown>[],
  actorId: string
): boolean {
  const userOverride = rows.find((row) => text(row.user_id) === actorId);
  if (userOverride) return userOverride.enabled === true;

  const organizationOverride = rows.find((row) => !text(row.user_id));
  return organizationOverride?.enabled === true;
}

/**
 * Reusable fail-closed authorization kernel for external-agent READ tools.
 * It deliberately returns a user-scoped Supabase client so downstream data
 * queries remain subject to the caller's ordinary RLS policies.
 */
export async function authorizeRinadsAgentRead(input: {
  request: Request;
  principal: RinadsAgentPrincipal;
  permission: string;
  entitlementFlag: string;
}): Promise<RinadsAgentReadPolicyFailure | RinadsAgentReadPolicySuccess> {
  if (!input.principal.permissionIds.includes(input.permission)) {
    return {
      ok: false,
      status: "forbidden",
      reason: `Missing required permission: ${input.permission}.`,
    };
  }

  const client = await createRinadsAgentDataClient(input.request);
  if (!client) {
    return {
      ok: false,
      status: "unavailable",
      reason: "A valid RLS-scoped data client could not be established.",
    };
  }

  const { data: flagRows, error: flagError } = await client
    .from("feature_flag_overrides")
    .select("enabled,user_id")
    .eq("organization_id", input.principal.organizationId)
    .eq("flag_key", input.entitlementFlag);

  if (flagError) {
    return {
      ok: false,
      status: "unavailable",
      reason: "Capability entitlement could not be verified.",
    };
  }

  const normalizedRows = (flagRows ?? []).map((row) => row as Record<string, unknown>);
  if (!isRinadsAgentReadEnabledForActor(normalizedRows, input.principal.actorId)) {
    return {
      ok: false,
      status: "disabled",
      reason: `Capability requires explicit ${input.entitlementFlag}=true entitlement.`,
    };
  }

  return { ok: true, client };
}

/**
 * Append the governance evidence for a successful external-agent read. The
 * caller must not release business data unless this insert succeeds.
 */
export async function appendRinadsAgentReadAudit(input: {
  client: SupabaseClient;
  request: Request;
  principal: RinadsAgentPrincipal;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { error } = await input.client.from("audit_logs").insert({
    organization_id: input.principal.organizationId,
    actor_type: "ai",
    actor_id: input.principal.actorId,
    approved_by: null,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    before: null,
    after: input.metadata ?? {},
    source: `agent-gateway:${input.principal.authMethod}`,
    ip: null,
    user_agent: input.request.headers.get("user-agent"),
  });

  if (error) {
    return { ok: false, reason: "Agent read audit evidence could not be appended." };
  }

  return { ok: true };
}
