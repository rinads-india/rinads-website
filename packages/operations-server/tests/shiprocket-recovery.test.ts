import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CourierShipmentInput } from "@rinads/operations";
import { ShiprocketCourierAdapter } from "../src/carriers/shiprocket-adapter";
import type { ShiprocketExecutionClient } from "../src/carriers/shiprocket-execution-client";
import {
  ShiprocketOrderRecoveryClient,
  createShiprocketProviderReference,
  createShiprocketSupabaseRecoveryStoreFromEnv,
  type ShiprocketRecoveryStore,
} from "../src/carriers/shiprocket-recovery";
import type { ShiprocketFetch } from "../src/carriers/shiprocket";

type Call = {
  url: string;
  init: Parameters<ShiprocketFetch>[1];
};

function queuedFetch(payloads: unknown[]): {
  fetchImpl: ShiprocketFetch;
  calls: Call[];
} {
  const calls: Call[] = [];
  let index = 0;
  const fetchImpl: ShiprocketFetch = async (url, init) => {
    calls.push({ url, init });
    const payload = payloads[Math.min(index, payloads.length - 1)];
    index += 1;
    return {
      ok: true,
      status: 200,
      async text() {
        return payload === undefined ? "" : JSON.stringify(payload);
      },
    };
  };
  return { fetchImpl, calls };
}

function executionInput(): CourierShipmentInput {
  return {
    orderId: "order-1234567890",
    packageId: "package-A",
    weightGrams: 750,
    destinationPincode: "682001",
    execution: {
      orderDate: "2026-10-22 10:00",
      pickupLocation: "Mannuthy",
      paymentMethod: "prepaid",
      billing: {
        name: "Test Customer",
        address1: "Example Road",
        city: "Thrissur",
        state: "Kerala",
        country: "India",
        pincode: "682001",
        email: "test@example.com",
        phone: "9999999999",
      },
      items: [
        {
          name: "Test Product",
          sku: "SKU-1",
          units: 1,
          sellingPriceMinor: 10000,
        },
      ],
      subtotalMinor: 10000,
      dimensionsCm: { length: 15, width: 10, height: 5 },
    },
  };
}

describe("Shiprocket recovery", () => {
  it("builds deterministic package-scoped provider references under Shiprocket limits", () => {
    const a1 = createShiprocketProviderReference("order-123", "package-a");
    const a2 = createShiprocketProviderReference("order-123", "package-a");
    const b = createShiprocketProviderReference("order-123", "package-b");

    assert.equal(a1, a2);
    assert.notEqual(a1, b);
    assert.ok(a1.length <= 50);
    assert.match(a1, /^RIN-[A-Za-z0-9-]+-[a-f0-9]{16}$/);
  });

  it("recovers an exact Shiprocket order by channel_order_id", async () => {
    const { fetchImpl, calls } = queuedFetch([
      { token: "jwt" },
      {
        data: [
          {
            id: 901,
            channel_order_id: "RIN-order-abc123",
            status: "Ready To Ship",
            status_code: 3,
            shipments: [
              {
                id: 701,
                awb: "AWB701",
                courier_name: "Example Courier",
              },
            ],
          },
        ],
      },
    ]);
    const client = new ShiprocketOrderRecoveryClient({
      email: "api@example.com",
      password: "secret",
      fetchImpl,
    });

    const result = await client.findByMerchantReference("RIN-order-abc123");

    assert.equal(result?.providerOrderId, 901);
    assert.equal(result?.providerShipmentId, 701);
    assert.equal(result?.awb, "AWB701");
    const query = new URL(calls[1]!.url).searchParams;
    assert.equal(query.get("filter_by"), "channel_order_id");
    assert.equal(query.get("filter"), "RIN-order-abc123");
  });

  it("does not create or reassign when provider recovery already has an AWB", async () => {
    let createCalls = 0;
    let assignCalls = 0;
    const executionClient = {
      async checkServiceability() {
        return {
          currency: "INR",
          couriers: [
            {
              courierCompanyId: 42,
              courierName: "Recovered Courier",
              rateRupees: 55,
              cod: false,
            },
          ],
        };
      },
      async createCustomOrder() {
        createCalls += 1;
        return { orderId: 999, shipmentId: 998 };
      },
      async assignAwb() {
        assignCalls += 1;
        return { assigned: true, awb: "NEW-AWB" };
      },
      async requestPickup() {
        return { scheduled: true };
      },
      async generateLabel() {
        return { created: true, labelUrl: "https://example.test/label.pdf" };
      },
      async cancelShipment() {
        return { accepted: true as const };
      },
      async trackByAwb() {
        return { trackingAvailable: false, events: [] };
      },
    } as unknown as ShiprocketExecutionClient;

    const input = executionInput();
    const providerReference = createShiprocketProviderReference(
      input.orderId,
      input.packageId
    );
    const recoveryClient = {
      async findByMerchantReference() {
        return {
          providerReference,
          providerOrderId: 101,
          providerShipmentId: 202,
          awb: "RECOVERED-AWB",
          courierName: "Recovered Courier",
          status: "Ready To Ship",
          statusCode: 3,
          cancelled: false,
          pickupAlreadyProgressed: false,
        };
      },
      async findByAwb() {
        return null;
      },
    } as unknown as ShiprocketOrderRecoveryClient;

    const saved: unknown[] = [];
    const store: ShiprocketRecoveryStore = {
      async find() {
        return null;
      },
      async save(record) {
        saved.push(record);
      },
    };

    const adapter = new ShiprocketCourierAdapter(
      executionClient,
      {},
      recoveryClient,
      store,
      "00000000-0000-0000-0000-000000000001"
    );
    const result = await adapter.createShipment({
      ...input,
      pickupPincode: "680651",
    } as CourierShipmentInput & { pickupPincode: string });

    assert.equal(createCalls, 0);
    assert.equal(assignCalls, 0);
    assert.equal(result.awb, "RECOVERED-AWB");
    assert.equal(result.providerOrderId, "101");
    assert.equal(result.providerShipmentId, "202");
    assert.equal(result.providerReference, providerReference);
    assert.equal(saved.length, 1);
  });

  it("persists only sanitized provider identity through the Supabase recovery store", async () => {
    const calls: Call[] = [];
    const fetchImpl: ShiprocketFetch = async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        async text() {
          return init.method === "GET" ? "[]" : "";
        },
      };
    };
    const store = createShiprocketSupabaseRecoveryStoreFromEnv(
      "00000000-0000-0000-0000-000000000001",
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
      },
      fetchImpl
    );
    assert.ok(store);

    await store.save({
      organizationId: "00000000-0000-0000-0000-000000000001",
      orderId: "00000000-0000-0000-0000-000000000002",
      packageId: "00000000-0000-0000-0000-000000000003",
      providerReference: "RIN-order-ref",
      providerOrderId: "901",
      providerShipmentId: "701",
      awb: "AWB701",
      service: "Example Courier",
      trackingUrl: "https://shiprocket.co/tracking/AWB701",
      recovered: true,
    });

    assert.equal(calls.length, 1);
    assert.match(calls[0]!.url, /on_conflict=organization_id%2Ccarrier%2Cprovider_reference/);
    assert.equal(calls[0]!.init.headers.Authorization, "Bearer service-role-secret");
    const body = JSON.parse(calls[0]!.init.body ?? "{}") as Record<string, unknown>;
    assert.equal(body.provider_reference, "RIN-order-ref");
    assert.equal(body.provider_order_id, "901");
    assert.equal(body.provider_shipment_id, "701");
    assert.equal(body.awb, "AWB701");
    assert.equal("billing" in body, false);
    assert.equal("customer" in body, false);
  });
});
