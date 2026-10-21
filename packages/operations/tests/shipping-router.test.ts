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
  destinationPincode: "680651",
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
});
