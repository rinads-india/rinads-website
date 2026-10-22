import type {
  CourierCapability,
  CourierIntelligenceWeights,
  CourierRoutingStrategy,
  LogisticsAutonomyMode,
  LogisticsCredentialSource,
  LogisticsDecisionEvent,
  LogisticsProviderConfig,
  LogisticsRoutingPolicyConfig,
  LogisticsRuntimeRepository,
  LogisticsVerificationState,
} from "@rinads/operations";

type SupabaseError = { message: string } | null;
type SupabaseRowsResult = { data: Record<string, unknown>[] | null; error: SupabaseError };
type SupabaseMutationResult = { error: SupabaseError };

export type LogisticsSupabaseFilterQuery = PromiseLike<SupabaseRowsResult> & {
  eq(column: string, value: string): LogisticsSupabaseFilterQuery;
  limit(count: number): LogisticsSupabaseFilterQuery;
};

export type LogisticsSupabaseClient = {
  from(table: string): {
    select(columns?: string): LogisticsSupabaseFilterQuery;
    insert(
      rows: Record<string, unknown> | Record<string, unknown>[]
    ): PromiseLike<SupabaseMutationResult>;
  };
};

const CAPABILITIES = new Set<CourierCapability>([
  "cod",
  "reverse",
  "same_day",
  "scheduled",
  "high_value",
]);

const CREDENTIAL_SOURCES = new Set<LogisticsCredentialSource>([
  "none",
  "environment",
  "vault",
  "connector",
]);

const VERIFICATION_STATES = new Set<LogisticsVerificationState>([
  "unverified",
  "sandbox_passed",
  "controlled_shipment_passed",
  "suspended",
]);

const ROUTING_STRATEGIES = new Set<CourierRoutingStrategy>([
  "priority",
  "lowest_cost",
  "fastest",
  "intelligence",
]);

const AUTONOMY_MODES = new Set<LogisticsAutonomyMode>([
  "recommend_only",
  "approve_then_act",
  "auto_low_risk",
]);

function text(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Logistics Supabase row has invalid ${key}.`);
  }
  return value;
}

function optionalText(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function numberValue(row: Record<string, unknown>, key: string, fallback?: number): number {
  const value = row[key];
  if (value === null || value === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Logistics Supabase row is missing ${key}.`);
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Logistics Supabase row has invalid ${key}.`);
  return parsed;
}

function optionalNumber(row: Record<string, unknown>, key: string): number | undefined {
  const value = row[key];
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Logistics Supabase row has invalid ${key}.`);
  return parsed;
}

function bool(row: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = row[key];
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "boolean") throw new Error(`Logistics Supabase row has invalid ${key}.`);
  return value;
}

function capabilities(row: Record<string, unknown>): CourierCapability[] {
  const value = row.capabilities;
  if (!Array.isArray(value)) return [];
  return value.filter(
    (capability): capability is CourierCapability =>
      typeof capability === "string" && CAPABILITIES.has(capability as CourierCapability)
  );
}

function intelligenceWeights(
  row: Record<string, unknown>
): Partial<CourierIntelligenceWeights> | undefined {
  const raw = row.intelligence_weights;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const source = raw as Record<string, unknown>;
  const result: Partial<CourierIntelligenceWeights> = {};
  const keys = [
    "cost",
    "eta",
    "deliverySuccess",
    "rto",
    "slaConfidence",
    "margin",
    "priority",
  ] as const;

  for (const key of keys) {
    const value = source[key];
    if (value === undefined || value === null) continue;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error(`Logistics routing policy has invalid intelligence weight ${key}.`);
    }
    result[key] = parsed;
  }

  return result;
}

function mapProviderConfig(row: Record<string, unknown>): LogisticsProviderConfig {
  const credentialSource = text(row, "credential_source") as LogisticsCredentialSource;
  const verificationState = text(row, "verification_state") as LogisticsVerificationState;
  if (!CREDENTIAL_SOURCES.has(credentialSource)) {
    throw new Error(`Unsupported logistics credential source: ${credentialSource}.`);
  }
  if (!VERIFICATION_STATES.has(verificationState)) {
    throw new Error(`Unsupported logistics verification state: ${verificationState}.`);
  }

  return {
    organizationId: text(row, "organization_id"),
    providerKey: text(row, "provider_key"),
    enabled: bool(row, "enabled", false),
    priority: numberValue(row, "priority", 100),
    capabilities: capabilities(row),
    credentialSource,
    credentialKey: optionalText(row, "credential_key"),
    verificationState,
  };
}

function mapRoutingPolicy(row: Record<string, unknown>): LogisticsRoutingPolicyConfig {
  const strategy = text(row, "strategy") as CourierRoutingStrategy;
  const autonomyMode = text(row, "autonomy_mode") as LogisticsAutonomyMode;
  if (!ROUTING_STRATEGIES.has(strategy)) {
    throw new Error(`Unsupported logistics routing strategy: ${strategy}.`);
  }
  if (!AUTONOMY_MODES.has(autonomyMode)) {
    throw new Error(`Unsupported logistics autonomy mode: ${autonomyMode}.`);
  }

  return {
    organizationId: text(row, "organization_id"),
    strategy,
    maxCostMinor: optionalNumber(row, "max_cost_minor"),
    maxEtaHours: optionalNumber(row, "max_eta_hours"),
    intelligenceWeights: intelligenceWeights(row),
    autonomyMode,
    humanApprovalDeclaredValueMinor: numberValue(
      row,
      "human_approval_declared_value_minor",
      500_000
    ),
    humanApprovalCodMinor: numberValue(row, "human_approval_cod_minor", 500_000),
    requireApprovalForHighValue: bool(row, "require_approval_for_high_value", true),
    requireApprovalForFirstProviderUse: bool(
      row,
      "require_approval_for_first_provider_use",
      true
    ),
  };
}

function decisionRow(event: LogisticsDecisionEvent): Record<string, unknown> {
  return {
    organization_id: event.organizationId,
    correlation_id: event.correlationId,
    order_id: event.orderId ?? null,
    package_id: event.packageId ?? null,
    shipment_id: event.shipmentId ?? null,
    stage: event.stage,
    provider_key: event.providerKey ?? null,
    routing_strategy: event.routingStrategy ?? null,
    decision_score: event.decisionScore ?? null,
    approval_required: event.approvalRequired,
    evidence: event.evidence,
    policy_snapshot: event.policySnapshot,
    actor_type: event.actorType,
    actor_id: event.actorId ?? null,
    occurred_at: event.occurredAt,
  };
}

export function createSupabaseLogisticsRuntimeRepository(
  client: LogisticsSupabaseClient
): LogisticsRuntimeRepository {
  return {
    async listProviderConfigs(organizationId) {
      const { data, error } = await client
        .from("logistics_provider_configs")
        .select("*")
        .eq("organization_id", organizationId);
      if (error) throw new Error(`Unable to load logistics provider configuration: ${error.message}`);
      return (data ?? []).map(mapProviderConfig);
    },

    async getRoutingPolicy(organizationId) {
      const { data, error } = await client
        .from("logistics_routing_policies")
        .select("*")
        .eq("organization_id", organizationId)
        .limit(1);
      if (error) throw new Error(`Unable to load logistics routing policy: ${error.message}`);
      const row = data?.[0];
      return row ? mapRoutingPolicy(row) : null;
    },

    async appendDecisionEvent(event) {
      const { error } = await client
        .from("logistics_decision_events")
        .insert(decisionRow(event));
      if (error) throw new Error(`Unable to append logistics decision evidence: ${error.message}`);
    },

    async hasSuccessfulProviderExecution(organizationId, providerKey) {
      const { data, error } = await client
        .from("logistics_decision_events")
        .select("evidence")
        .eq("organization_id", organizationId)
        .eq("provider_key", providerKey)
        .eq("stage", "act")
        .limit(25);
      if (error) throw new Error(`Unable to inspect logistics provider execution history: ${error.message}`);

      return (data ?? []).some((row) => {
        const evidence = row.evidence;
        return Boolean(
          evidence &&
            typeof evidence === "object" &&
            !Array.isArray(evidence) &&
            (evidence as Record<string, unknown>).success === true
        );
      });
    },
  };
}
