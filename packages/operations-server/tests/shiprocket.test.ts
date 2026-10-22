import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ShiprocketApiError,
  ShiprocketClient,
  createShiprocketClientFromProviderConfig,
  type ShiprocketFetch,
} from "../src/carriers/shiprocket";

type Call = {
  url: string;
  init: Parameters<ShiprocketFetch>[1];
};

type QueuedResponse = {
  payload?: unknown;
  ok?: boolean;
  status?: number;
};

function fakeFetch(responses: QueuedResponse[]): { fetchImpl: ShiprocketFetch; calls: Call[] } {
  const calls: Call[] = [];
  let index = 0;
  const fetchImpl: ShiprocketFetch = async (url, init) => {
    calls.push({ url, init });
    const response = responses[Math.min(index, responses.length - 1)] ?? {};
    index += 1;
    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      async text() {
        if (response.payload === undefined || response.payload === null) return "";
        return JSON.stringify(response.payload);
      },
    };
  };
  return { fetchImpl, calls };
}

describe("ShiprocketClient", () => {
  it("authenticates with the API user and reuses the bearer token for read calls", async () => {
    const { fetchImpl, calls } = fakeFetch([
      { payload: { token: "jwt-token" } },
      { payload: { currency: "INR", data: { available_courier_companies: [] } } },
      { payload: { currency: "INR", data: { available_courier_companies: [] } } },
    ]);
    const client = new ShiprocketClient({
      email: "api@example.com",
      password: "secret",
      fetchImpl,
    });

    await client.checkServiceability({
      pickupPincode: "680651",
      deliveryPincode: "682001",
      weightKg: 0.5,
      cod: false,
    });
    await client.checkServiceability({
      pickupPincode: "680651",
      deliveryPincode: "682001",
      weightKg: 1,
      cod: true,
    });

    assert.equal(calls.length, 3);
    assert.equal(calls[0]!.url, "https://apiv2.shiprocket.in/v1/external/auth/login");
    assert.deepEqual(JSON.parse(calls[0]!.init.body ?? "{}"), {
      email: "api@example.com",
      password: "secret",
    });
    assert.equal(calls[1]!.init.headers.Authorization, "Bearer jwt-token");
    assert.equal(calls[2]!.init.headers.Authorization, "Bearer jwt-token");
  });

  it("normalizes Shiprocket courier serviceability evidence for RI routing", async () => {
    const { fetchImpl, calls } = fakeFetch([
      { payload: { token: "jwt-token" } },
      {
        payload: {
          currency: "INR",
          data: {
            available_courier_companies: [
              {
                courier_company_id: 43,
                courier_name: "Delhivery Surface",
                cod: 1,
                rate: 54,
                freight_charge: 54,
                estimated_delivery_days: "4",
                etd_hours: 91,
                rating: 4.9,
                delivery_performance: 5,
                pickup_performance: 4.7,
                rto_performance: 5,
                realtime_tracking: "Real Time",
                is_surface: true,
              },
            ],
          },
        },
      },
    ]);
    const client = new ShiprocketClient({
      email: "api@example.com",
      password: "secret",
      fetchImpl,
    });

    const result = await client.checkServiceability({
      pickupPincode: "680651",
      deliveryPincode: "682001",
      weightKg: 0.75,
      cod: true,
      dimensionsCm: { length: 15, breadth: 10, height: 5 },
      declaredValueRupees: 1500,
      mode: "Surface",
    });

    assert.equal(result.currency, "INR");
    assert.deepEqual(result.couriers[0], {
      courierCompanyId: 43,
      courierName: "Delhivery Surface",
      rateRupees: 54,
      freightChargeRupees: 54,
      cod: true,
      estimatedDeliveryDays: "4",
      etdHours: 91,
      rating: 4.9,
      deliveryPerformance: 5,
      pickupPerformance: 4.7,
      rtoPerformance: 5,
      realtimeTracking: "Real Time",
      isSurface: true,
    });

    const url = new URL(calls[1]!.url);
    assert.equal(url.pathname, "/v1/external/courier/serviceability/");
    assert.equal(url.searchParams.get("pickup_postcode"), "680651");
    assert.equal(url.searchParams.get("delivery_postcode"), "682001");
    assert.equal(url.searchParams.get("cod"), "1");
    assert.equal(url.searchParams.get("weight"), "0.75");
    assert.equal(url.searchParams.get("length"), "15");
    assert.equal(url.searchParams.get("breadth"), "10");
    assert.equal(url.searchParams.get("height"), "5");
    assert.equal(url.searchParams.get("declared_value"), "1500");
    assert.equal(url.searchParams.get("mode"), "Surface");
    assert.equal(url.searchParams.get("is_return"), "0");
  });

  it("fails closed on mutation calls unless the explicit write gate is enabled", async () => {
    const { fetchImpl, calls } = fakeFetch([{ payload: { token: "jwt-token" } }]);
    const client = new ShiprocketClient({
      email: "api@example.com",
      password: "secret",
      fetchImpl,
    });

    await assert.rejects(
      client.assignAwb(16090281, 10),
      /explicit writeEnabled production gate/
    );
    assert.equal(calls.length, 0);
  });

  it("assigns AWB only after the write gate and normalizes the response", async () => {
    const { fetchImpl, calls } = fakeFetch([
      { payload: { token: "jwt-token" } },
      {
        payload: {
          awb_assign_status: 1,
          response: {
            data: {
              courier_company_id: 142,
              courier_name: "Example Courier",
              awb_code: "321055706540",
              order_id: 281248157,
              shipment_id: 16090281,
            },
          },
        },
      },
    ]);
    const client = new ShiprocketClient({
      email: "api@example.com",
      password: "secret",
      writeEnabled: true,
      fetchImpl,
    });

    const result = await client.assignAwb(16090281, 142);

    assert.deepEqual(result, {
      assigned: true,
      shipmentId: 16090281,
      orderId: 281248157,
      awb: "321055706540",
      courierCompanyId: 142,
      courierName: "Example Courier",
    });
    assert.equal(calls[1]!.url, "https://apiv2.shiprocket.in/v1/external/courier/assign/awb");
    assert.deepEqual(JSON.parse(calls[1]!.init.body ?? "{}"), {
      shipment_id: 16090281,
      courier_id: 142,
    });
  });

  it("does not automatically replay a mutation after a 401", async () => {
    const { fetchImpl, calls } = fakeFetch([
      { payload: { token: "jwt-token" } },
      { payload: { message: "unauthorized" }, ok: false, status: 401 },
    ]);
    const client = new ShiprocketClient({
      email: "api@example.com",
      password: "secret",
      writeEnabled: true,
      fetchImpl,
    });

    await assert.rejects(
      client.cancelShipment(["19041211125783"]),
      (error: unknown) => error instanceof ShiprocketApiError && error.status === 401
    );
    assert.equal(calls.length, 2);
  });

  it("constructs clients only through the opaque Shiprocket binding", () => {
    const client = createShiprocketClientFromProviderConfig(
      {
        providerKey: "shiprocket",
        credentialSource: "environment",
        credentialKey: "shiprocket_primary",
      },
      { fetchImpl: fakeFetch([]).fetchImpl },
      {
        RINADS_SHIPROCKET_EMAIL: "api@example.com",
        RINADS_SHIPROCKET_PASSWORD: "bound-secret",
      }
    );

    assert.ok(client instanceof ShiprocketClient);
  });

  it("rejects malformed pincodes before authenticating or calling Shiprocket", async () => {
    const { fetchImpl, calls } = fakeFetch([]);
    const client = new ShiprocketClient({
      email: "api@example.com",
      password: "secret",
      fetchImpl,
    });

    await assert.rejects(
      client.checkServiceability({
        pickupPincode: "68065",
        deliveryPincode: "682001",
        weightKg: 0.5,
        cod: false,
      }),
      /six-digit Indian PIN code/
    );
    assert.equal(calls.length, 0);
  });
});
