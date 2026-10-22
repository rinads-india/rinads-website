import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LogisticsRuntimeService,
  hydrateCourierProviders,
  type CourierAdapter,
  type CourierProviderDefinition,
  type LogisticsDecisionEvent,
  type LogisticsProviderConfig,
  type LogisticsRoutingPolicyConfig,
  type LogisticsRuntimeRepository,
} from "../src/index";

function adapter(carrier: string, calls: string[]): CourierAdapter {
  return {
    async createShipment() {
      calls.push(carrier);
      return {
        carrier,
        awb: `${carrier}-awb`,
        trackingUrl: `https://tracking.example/${carrier}-awb`,
        service: "standard",
      };
    },
    async cancelShipment() {
      return { cancelled: true };
    },
    async trackShipment() {
      return { events: [] };
    },
    async getLabel() {
      return {};
    },
  };
}

function catalog(calls: string[]): CourierProviderDefinition[] {
  return [
    {
      key: "dtdc",
      adapter: adapter("dtdc", calls),
      enabled: true,
      priority: 50,
      capabilities: ["cod", "reverse", "scheduled"],
      async quote() {
        return { providerKey: "dtdc", serviceable: true, estimatedCostMinor: 9_000, etaHours: 36 };
      },
      async intelligence() {
        return { deliverySuccessRate: 0.94, rtoRate: 0.05, slaConfidence: 0.9 };
      },
    },
    {
      key: "porter",
      adapter: adapter("porter", calls),
      enabled: true,
      priority: 10,
      capabilities: ["same_day", "scheduled"],
      async quote() {
        return { providerKey: "porter", serviceable: true, estimatedCostMinor: 14_000, etaHours: 4 };
      },
      async intelligence() {
        return { deliverySuccessRate: 0.97, rtoRate: 0.02, slaConfidence: 0.98 };
      },
    },
  ];
}

const basePolicy: LogisticsRoutingPolicyConfig = {
  organizationId: "org_1",
  strategy: "lowest_cost",
  autonomyMode: "auto_low_risk",
  humanApprovalDeclaredValueMinor: 500_000,
  humanApprovalCodMinor: 500_000,
  requireApprovalForHighValue: true,
  requireApprovalForFirstProviderUse: false,
};

function repository(options: {
  configs?: LogisticsProviderConfig[];
  policy?: LogisticsRoutingPolicyConfig | null;
  previouslyExecuted?: boolean;
} = {}): { repo: LogisticsRuntimeRepository; events: LogisticsDecisionEvent[] } {
  const events: LogisticsDecisionEvent[] = [];
  const configs = options.configs ?? [
    {
      organizationId: "org_1",
      providerKey: "dtdc",
      enabled: true,
      priority: 20,
      capabilities: ["cod", "reverse", "scheduled"],
      credentialSource: "environment",
      credentialKey: "RINADS_DTDC_API_TOKEN",
      verificationState: "controlled_shipment_passed",
    },
    {
      organizationId: "org_1",
      providerKey: "porter",
      enabled: true,
      priority: 10,
      capabilities: ["same_day", "scheduled"],
      credentialSource: "environment",
      credentialKey: "RINADS_PORTER_API_KEY",
      verificationState: "controlled_shipment_passed",
    },
  ];

  return {
    events,
    repo: {
      async listProviderConfigs(organizationId) {
        return configs.filter((config) => config.organizationId === organizationId);
      },
      async getRoutingPolicy() {
        return options.policy === undefined ? basePolicy : options.policy;
      },
      async appendDecisionEvent(event) {
        events.push(event);
      },
      async hasSuccessfulProviderExecution() {
        return options.previouslyExecuted ?? true;
      },
    },
  };
}

const input = {
  organizationId: "org_1",
  orderId: "ord_1",
  packageId: "pkg_1",
  weightGrams: 500,
  pickupPincode: "680651",
  destinationPincode: "682001",
};

const context = {
  organizationId: "org_1",
  actorType: "user" as const,
  actorId: "user_1",
  correlationId: "corr_1",
};

describe("LogisticsRuntimeService", () => {
  it("enables only controlled-shipment verified providers in production", () => {
    const calls: string[] = [];
    const configs: LogisticsProviderConfig[] = [
      {
        organizationId: "org_1",
        providerKey: "dtdc",
        enabled: true,
        priority: 1,
        capabilities: ["cod"],
        credentialSource: "environment",
        credentialKey: "RINADS_DTDC_API_TOKEN",
        verificationState: "sandbox_passed",
      },
      {
        organizationId: "org_1",
        providerKey: "porter",
        enabled: true,
        priority: 2,
        capabilities: ["same_day"],
        credentialSource: "environment",
        credentialKey: "RINADS_PORTER_API_KEY",
        verificationState: "controlled_shipment_passed",
      },
    ];

    const hydrated = hydrateCourierProviders(catalog(calls), configs, "production");
    assert.equal(hydrated.find((provider) => provider.key === "dtdc")?.enabled, false);
    assert.equal(hydrated.find((provider) => provider.key === "porter")?.enabled, true);
  });

  it("allows sandbox-passed providers only in explicit verification mode", () => {
    const calls: string[] = [];
    const configs: LogisticsProviderConfig[] = [
      {
        organizationId: "org_1",
        providerKey: "dtdc",
        enabled: true,
        priority: 1,
        capabilities: [],
        credentialSource: "environment",
        credentialKey: "RINADS_DTDC_API_TOKEN",
        verificationState: "sandbox_passed",
      },
    ];

    const hydrated = hydrateCourierProviders(catalog(calls), configs, "verification");
    assert.equal(hydrated.find((provider) => provider.key === "dtdc")?.enabled, true);
    assert.deepEqual(hydrated.find((provider) => provider.key === "dtdc")?.capabilities, ["cod", "reverse", "scheduled"]);
  });

  it("hydrates tenant policy and records Observe → Understand → Recommend evidence", async () => {
    const calls: string[] = [];
    const { repo, events } = repository();
    const runtime = new LogisticsRuntimeService(repo, catalog(calls));
    const result = await runtime.route(context, input);

    assert.equal(result.route.ok, true);
    if (result.route.ok) assert.equal(result.route.candidate.provider.key, "dtdc");
    assert.deepEqual(events.map((event) => event.stage), ["observe", "understand", "recommend"]);
    assert.equal(events[2]?.providerKey, "dtdc");
    assert.equal(events[2]?.correlationId, "corr_1");
  });

  it("fails closed when input attempts to cross organization scope", async () => {
    const calls: string[] = [];
    const { repo } = repository();
    const runtime = new LogisticsRuntimeService(repo, catalog(calls));

    await assert.rejects(
      runtime.route(context, { ...input, organizationId: "org_other" }),
      /organization mismatch/
    );
  });

  it("blocks high-value execution until a human approval is supplied", async () => {
    const calls: string[] = [];
    const { repo, events } = repository({
      policy: {
        ...basePolicy,
        autonomyMode: "auto_low_risk",
        humanApprovalDeclaredValueMinor: 100_000,
      },
    });
    const runtime = new LogisticsRuntimeService(repo, catalog(calls));
    const result = await runtime.createShipment(context, {
      ...input,
      declaredValueMinor: 200_000,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "APPROVAL_REQUIRED");
      assert.ok(result.approvalReasons?.includes("declared_value_threshold"));
    }
    assert.deepEqual(calls, []);
    assert.equal(events.at(-1)?.stage, "authorize");
  });

  it("executes an approved shipment through RINPO Runtime and records Act evidence", async () => {
    const calls: string[] = [];
    const { repo, events } = repository({
      policy: { ...basePolicy, autonomyMode: "approve_then_act" },
    });
    const runtime = new LogisticsRuntimeService(repo, catalog(calls));
    const result = await runtime.createShipment(context, input, {
      approval: {
        approved: true,
        reference: "approval_001",
        approvedByActorId: "founder_1",
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.providerKey, "dtdc");
      assert.equal(result.shipment.awb, "dtdc-awb");
    }
    assert.deepEqual(calls, ["dtdc"]);
    assert.equal(events.at(-1)?.stage, "act");
    assert.equal(events.at(-1)?.actorType, "rinpo_runtime");
    assert.equal(events.at(-1)?.evidence.success, true);
  });

  it("never executes while tenant policy is recommend-only", async () => {
    const calls: string[] = [];
    const { repo } = repository({
      policy: { ...basePolicy, autonomyMode: "recommend_only" },
    });
    const runtime = new LogisticsRuntimeService(repo, catalog(calls));
    const result = await runtime.createShipment(context, input, {
      approval: { approved: true, approvedByActorId: "founder_1" },
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "RECOMMEND_ONLY");
    assert.deepEqual(calls, []);
  });
});
