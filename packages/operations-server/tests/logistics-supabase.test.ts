import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSupabaseLogisticsRuntimeRepository,
  type LogisticsSupabaseClient,
  type LogisticsSupabaseFilterQuery,
} from "../src/logistics-supabase";

function fakeClient(seed: Record<string, Record<string, unknown>[]>) {
  const inserts: { table: string; rows: Record<string, unknown>[] }[] = [];

  const client: LogisticsSupabaseClient = {
    from(table: string) {
      return {
        select() {
          let rows = [...(seed[table] ?? [])];
          let max = Number.POSITIVE_INFINITY;
          const query = {
            eq(column: string, value: string) {
              rows = rows.filter((row) => String(row[column]) === value);
              return query;
            },
            limit(count: number) {
              max = count;
              return query;
            },
            then<TResult1 = { data: Record<string, unknown>[]; error: null }, TResult2 = never>(
              onfulfilled?: ((value: { data: Record<string, unknown>[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
              onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
            ): PromiseLike<TResult1 | TResult2> {
              return Promise.resolve({ data: rows.slice(0, max), error: null }).then(
                onfulfilled ?? undefined,
                onrejected ?? undefined
              );
            },
          } as LogisticsSupabaseFilterQuery;
          return query;
        },
        insert(value) {
          const rows = Array.isArray(value) ? value : [value];
          inserts.push({ table, rows });
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  return { client, inserts };
}

describe("createSupabaseLogisticsRuntimeRepository", () => {
  it("maps tenant provider configuration and routing policy from Supabase rows", async () => {
    const { client } = fakeClient({
      logistics_provider_configs: [
        {
          organization_id: "org_1",
          provider_key: "dtdc",
          enabled: true,
          priority: 10,
          capabilities: ["cod", "reverse", "not_real"],
          credential_source: "environment",
          credential_key: "dtdc_primary",
          verification_state: "controlled_shipment_passed",
        },
      ],
      logistics_routing_policies: [
        {
          organization_id: "org_1",
          strategy: "intelligence",
          max_cost_minor: 20000,
          max_eta_hours: 72,
          intelligence_weights: { cost: 0.2, deliverySuccess: 0.4 },
          autonomy_mode: "auto_low_risk",
          human_approval_declared_value_minor: 500000,
          human_approval_cod_minor: 250000,
          require_approval_for_high_value: true,
          require_approval_for_first_provider_use: false,
        },
      ],
    });
    const repo = createSupabaseLogisticsRuntimeRepository(client);

    const providers = await repo.listProviderConfigs("org_1");
    const policy = await repo.getRoutingPolicy("org_1");

    assert.equal(providers.length, 1);
    assert.deepEqual(providers[0]?.capabilities, ["cod", "reverse"]);
    assert.equal(providers[0]?.credentialKey, "dtdc_primary");
    assert.equal(providers[0]?.verificationState, "controlled_shipment_passed");
    assert.equal(policy?.strategy, "intelligence");
    assert.equal(policy?.autonomyMode, "auto_low_risk");
    assert.equal(policy?.humanApprovalCodMinor, 250000);
  });

  it("writes append-only RI decision evidence using the migration column contract", async () => {
    const { client, inserts } = fakeClient({});
    const repo = createSupabaseLogisticsRuntimeRepository(client);

    await repo.appendDecisionEvent({
      organizationId: "org_1",
      correlationId: "corr_1",
      orderId: "ord_1",
      packageId: "pkg_1",
      stage: "recommend",
      providerKey: "dtdc",
      routingStrategy: "intelligence",
      decisionScore: 91.2,
      approvalRequired: false,
      evidence: { reason: "best_governed_option" },
      policySnapshot: { strategy: "intelligence" },
      actorType: "rinads_intelligence",
      occurredAt: "2026-10-22T00:00:00.000Z",
    });

    assert.equal(inserts.length, 1);
    assert.equal(inserts[0]?.table, "logistics_decision_events");
    assert.equal(inserts[0]?.rows[0]?.organization_id, "org_1");
    assert.equal(inserts[0]?.rows[0]?.provider_key, "dtdc");
    assert.equal(inserts[0]?.rows[0]?.stage, "recommend");
  });

  it("detects a previous successful provider execution without trusting failed attempts", async () => {
    const { client } = fakeClient({
      logistics_decision_events: [
        {
          organization_id: "org_1",
          provider_key: "dtdc",
          stage: "act",
          evidence: { success: false },
        },
        {
          organization_id: "org_1",
          provider_key: "dtdc",
          stage: "act",
          evidence: { success: true },
        },
        {
          organization_id: "org_other",
          provider_key: "dtdc",
          stage: "act",
          evidence: { success: true },
        },
      ],
    });
    const repo = createSupabaseLogisticsRuntimeRepository(client);

    assert.equal(await repo.hasSuccessfulProviderExecution?.("org_1", "dtdc"), true);
    assert.equal(await repo.hasSuccessfulProviderExecution?.("org_1", "porter"), false);
  });
});
