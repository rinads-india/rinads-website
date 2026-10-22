import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CourierProviderRouter,
  type CourierAdapter,
  type CourierProviderDefinition,
} from "../src/index";

function adapter(carrier: string): CourierAdapter {
  return {
    async createShipment() {
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

const providers: CourierProviderDefinition[] = [
  {
    key: "delhivery",
    adapter: adapter("delhivery"),
    enabled: true,
    priority: 20,
    capabilities: ["cod", "reverse"],
    async quote() {
      return {
        providerKey: "delhivery",
        serviceable: true,
        estimatedCostMinor: 12_000,
        etaHours: 48,
      };
    },
  },
  {
    key: "porter",
    adapter: adapter("porter"),
    enabled: true,
    priority: 10,
    capabilities: ["same_day", "scheduled"],
    async quote() {
      return {
        providerKey: "porter",
        serviceable: true,
        estimatedCostMinor: 18_000,
        etaHours: 4,
      };
    },
  },
  {
    key: "sequel",
    adapter: adapter("sequel"),
    enabled: true,
    priority: 5,
    capabilities: ["high_value", "reverse"],
    async quote() {
      return {
        providerKey: "sequel",
        serviceable: true,
        estimatedCostMinor: 30_000,
        etaHours: 24,
      };
    },
  },
];

const input = {
  organizationId: "org_1",
  orderId: "ord_1",
  packageId: "pkg_1",
  weightGrams: 500,
  pickupPincode: "641008",
  destinationPincode: "680004",
};

describe("CourierProviderRouter", () => {
  it("selects the cheapest serviceable provider when policy asks for lowest cost", async () => {
    const router = new CourierProviderRouter(providers);
    const result = await router.route(input, { strategy: "lowest_cost" });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.candidate.provider.key, "delhivery");
  });

  it("selects the fastest provider when policy asks for speed", async () => {
    const router = new CourierProviderRouter(providers);
    const result = await router.route(input, { strategy: "fastest" });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.candidate.provider.key, "porter");
  });

  it("filters by required operational capability", async () => {
    const router = new CourierProviderRouter(providers);
    const result = await router.route(
      { ...input, requiredCapabilities: ["high_value"] },
      { strategy: "lowest_cost" }
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.candidate.provider.key, "sequel");
  });

  it("fails closed when policy excludes every quote", async () => {
    const router = new CourierProviderRouter(providers);
    const result = await router.route(input, { strategy: "lowest_cost", maxCostMinor: 10_000 });
    assert.deepEqual(result.ok, false);
    if (!result.ok) assert.equal(result.code, "NO_PROVIDER");
  });

  it("turns provider quote failures into unavailable candidates instead of fake success", async () => {
    const broken: CourierProviderDefinition = {
      key: "broken",
      adapter: adapter("broken"),
      enabled: true,
      priority: 0,
      capabilities: [],
      async quote() {
        throw new Error("credentials not configured");
      },
    };

    const router = new CourierProviderRouter([broken, providers[0]!]);
    const quotes = await router.quoteAll(input);
    assert.equal(quotes.find((quote) => quote.providerKey === "broken")?.serviceable, false);

    const result = await router.route(input, { strategy: "priority" });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.candidate.provider.key, "delhivery");
  });

  it("creates a shipment only after routing selects a provider", async () => {
    const router = new CourierProviderRouter(providers);
    const result = await router.createShipment(input, { strategy: "fastest" });
    assert.equal(result.providerKey, "porter");
    assert.equal(result.shipment.carrier, "porter");
    assert.equal(result.shipment.awb, "porter-awb");
  });

  it("lets RINADS Intelligence prefer route reliability over a marginally cheaper quote", async () => {
    const intelligentProviders: CourierProviderDefinition[] = [
      {
        key: "cheap_route",
        adapter: adapter("cheap_route"),
        enabled: true,
        priority: 10,
        capabilities: ["cod"],
        async quote() {
          return { providerKey: "cheap_route", serviceable: true, estimatedCostMinor: 10_000, etaHours: 24 };
        },
        async intelligence() {
          return { deliverySuccessRate: 0.72, rtoRate: 0.24, slaConfidence: 0.7, estimatedMarginMinor: 2_400 };
        },
      },
      {
        key: "reliable_route",
        adapter: adapter("reliable_route"),
        enabled: true,
        priority: 20,
        capabilities: ["cod"],
        async quote() {
          return { providerKey: "reliable_route", serviceable: true, estimatedCostMinor: 11_000, etaHours: 26 };
        },
        async intelligence() {
          return { deliverySuccessRate: 0.98, rtoRate: 0.03, slaConfidence: 0.96, estimatedMarginMinor: 2_000 };
        },
      },
    ];

    const router = new CourierProviderRouter(intelligentProviders);
    const result = await router.route(
      { ...input, requiredCapabilities: ["cod"] },
      {
        strategy: "intelligence",
        intelligenceWeights: {
          deliverySuccess: 0.4,
          rto: 0.25,
          slaConfidence: 0.2,
          cost: 0.05,
          eta: 0.05,
          margin: 0.025,
          priority: 0.025,
        },
      }
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.candidate.provider.key, "reliable_route");
      assert.ok((result.candidate.intelligence?.score ?? 0) > 50);
    }
  });

  it("treats invalid intelligence telemetry as unknown instead of trusting bad evidence", async () => {
    const invalidTelemetry: CourierProviderDefinition = {
      key: "invalid_telemetry",
      adapter: adapter("invalid_telemetry"),
      enabled: true,
      priority: 1,
      capabilities: [],
      async quote() {
        return { providerKey: "invalid_telemetry", serviceable: true, estimatedCostMinor: 9_000, etaHours: 20 };
      },
      async intelligence() {
        return { deliverySuccessRate: 4 };
      },
    };

    const router = new CourierProviderRouter([invalidTelemetry]);
    const result = await router.route(input, { strategy: "intelligence" });
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.candidate.intelligence?.evidence, {});
  });
});
