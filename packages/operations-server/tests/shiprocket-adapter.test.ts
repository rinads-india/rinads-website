import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CourierQuoteInput } from "@rinads/operations";
import { type ShiprocketFetch } from "../src/carriers/shiprocket";
import { ShiprocketExecutionClient } from "../src/carriers/shiprocket-execution-client";
import {
  ShiprocketCourierAdapter,
  createShiprocketProviderDefinition,
} from "../src/carriers/shiprocket-adapter";

type Call = { url: string; init: Parameters<ShiprocketFetch>[1] };

function fakeFetch(payloads: unknown[]): {
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

function shipmentInput(): CourierQuoteInput {
  return {
    organizationId: "org_test",
    orderId: "ORDER-1001",
    packageId: "pkg_1",
    pickupPincode: "680651",
    destinationPincode: "682001",
    weightGrams: 750,
    dimensionsCm: { length: 15, width: 10, height: 5 },
    declaredValueMinor: 150_000,
    codAmountMinor: 0,
    execution: {
      orderDate: "2026-10-22 09:30",
      pickupLocation: "Mannuthy",
      paymentMethod: "prepaid",
      billing: {
        name: "Test Customer",
        address1: "House 1, Example Road",
        city: "Kochi",
        state: "Kerala",
        country: "India",
        pincode: "682001",
        email: "customer@example.com",
        phone: "9999999999",
      },
      items: [
        {
          name: "Sample product",
          sku: "SKU-1",
          units: 2,
          sellingPriceMinor: 75_000,
        },
      ],
      subtotalMinor: 150_000,
      dimensionsCm: { length: 15, width: 10, height: 5 },
    },
  };
}

const serviceabilityPayload = {
  currency: "INR",
  data: {
    available_courier_companies: [
      {
        courier_company_id: 43,
        courier_name: "Courier A",
        cod: 1,
        rate: 80,
        etd_hours: 72,
        rating: 4,
        delivery_performance: 4.5,
      },
      {
        courier_company_id: 44,
        courier_name: "Courier B",
        cod: 1,
        rate: 60,
        etd_hours: 96,
        rating: 4.8,
        delivery_performance: 4.7,
      },
    ],
  },
};

describe("ShiprocketCourierAdapter", () => {
  it("creates the order and assigns the deterministic best courier", async () => {
    const { fetchImpl, calls } = fakeFetch([
      { token: "base-jwt" },
      serviceabilityPayload,
      { token: "execution-jwt" },
      { order_id: 111, shipment_id: 222, status: "NEW", status_code: 1 },
      {
        awb_assign_status: 1,
        response: {
          data: {
            shipment_id: 222,
            order_id: 111,
            awb_code: "AWB123",
            courier_company_id: 44,
            courier_name: "Courier B",
          },
        },
      },
    ]);
    const client = new ShiprocketExecutionClient({
      email: "api@example.com",
      password: "secret",
      writeEnabled: true,
      fetchImpl,
    });
    const adapter = new ShiprocketCourierAdapter(client);

    const result = await adapter.createShipment(shipmentInput());

    assert.equal(result.carrier, "shiprocket");
    assert.equal(result.awb, "AWB123");
    assert.equal(result.service, "Courier B");
    assert.equal(result.providerOrderId, "111");
    assert.equal(result.providerShipmentId, "222");

    assert.equal(calls[1]!.url.includes("/courier/serviceability/"), true);
    assert.equal(calls[2]!.url.endsWith("/v1/external/auth/login"), true);
    assert.equal(
      calls[3]!.url,
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc"
    );
    const orderBody = JSON.parse(calls[3]!.init.body ?? "{}");
    assert.equal(orderBody.order_id, result.providerReference);
    assert.match(orderBody.order_id, /^RIN-/);
    assert.equal(orderBody.pickup_location, "Mannuthy");
    assert.equal(orderBody.billing_customer_name, "Test Customer");
    assert.equal(orderBody.payment_method, "Prepaid");
    assert.equal(orderBody.sub_total, 1500);
    assert.equal(orderBody.weight, 0.75);
    assert.deepEqual(orderBody.order_items, [
      {
        name: "Sample product",
        sku: "SKU-1",
        units: 2,
        selling_price: 750,
      },
    ]);

    assert.equal(
      calls[4]!.url,
      "https://apiv2.shiprocket.in/v1/external/courier/assign/awb"
    );
    assert.deepEqual(JSON.parse(calls[4]!.init.body ?? "{}"), {
      shipment_id: 222,
      courier_id: 44,
    });
  });

  it("fails closed before a provider mutation when execution data is missing", async () => {
    const { fetchImpl, calls } = fakeFetch([]);
    const client = new ShiprocketExecutionClient({
      email: "api@example.com",
      password: "secret",
      writeEnabled: true,
      fetchImpl,
    });
    const adapter = new ShiprocketCourierAdapter(client);

    await assert.rejects(
      adapter.createShipment({
        orderId: "ORDER-1",
        packageId: "pkg_1",
        weightGrams: 500,
        destinationPincode: "682001",
      }),
      /authorized canonical fulfilment payload/
    );
    assert.equal(calls.length, 0);
  });
});

describe("createShiprocketProviderDefinition", () => {
  it("quotes the cheapest serviceable courier and exposes bounded RI evidence", async () => {
    const { fetchImpl } = fakeFetch([{ token: "jwt" }, serviceabilityPayload]);
    const client = new ShiprocketExecutionClient({
      email: "api@example.com",
      password: "secret",
      fetchImpl,
    });
    const provider = createShiprocketProviderDefinition({ client, enabled: true });
    const input = shipmentInput();

    const quote = await provider.quote(input);
    const evidence = await provider.intelligence?.(input, quote);

    assert.deepEqual(quote, {
      providerKey: "shiprocket",
      serviceable: true,
      service: "Courier B",
      estimatedCostMinor: 6000,
      etaHours: 96,
    });
    assert.equal(evidence?.deliverySuccessRate, 0.9400000000000001);
    assert.equal(evidence?.slaConfidence, 0.96);
  });
});
