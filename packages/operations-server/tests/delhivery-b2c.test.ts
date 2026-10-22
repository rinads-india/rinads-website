import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DelhiveryApiError,
  DelhiveryB2cClient,
  createDelhiveryB2cClientFromProviderConfig,
  type DelhiveryFetch,
} from "../src/carriers/delhivery-b2c";

type Call = {
  url: string;
  init: Parameters<DelhiveryFetch>[1];
};

function fakeFetch(
  payload: unknown = {},
  options: { ok?: boolean; status?: number } = {}
): { fetchImpl: DelhiveryFetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl: DelhiveryFetch = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: options.ok ?? true,
      status: options.status ?? 200,
      async text() {
        return JSON.stringify(payload);
      },
    };
  };
  return { fetchImpl, calls };
}

describe("DelhiveryB2cClient", () => {
  it("defaults to staging and sends the documented Token authorization header", async () => {
    const { fetchImpl, calls } = fakeFetch({ delivery_codes: [] });
    const client = new DelhiveryB2cClient({ token: "secret-token", fetchImpl });

    await client.checkPincode("680651");

    assert.equal(calls.length, 1);
    assert.match(calls[0]!.url, /^https:\/\/staging-express\.delhivery\.com\/c\/api\/pin-codes\/json\//);
    assert.match(calls[0]!.url, /filter_codes=680651/);
    assert.equal(calls[0]!.init.headers.Authorization, "Token secret-token");
  });

  it("normalizes pincode serviceability flags without exposing carrier payloads upstream", async () => {
    const { fetchImpl } = fakeFetch({
      delivery_codes: [
        {
          postal_code: {
            pin: 682001,
            pre_paid: "Y",
            cod: "N",
            cash: "N",
            pickup: "Y",
            repl: "Y",
            remarks: "",
          },
        },
      ],
    });
    const client = new DelhiveryB2cClient({ token: "token", fetchImpl });

    const result = await client.checkPincode("682001");
    assert.deepEqual(result, {
      pincode: "682001",
      serviceable: true,
      prepaid: true,
      cod: false,
      reversePickup: true,
      pickup: true,
      remarks: undefined,
    });
  });

  it("builds the documented shipping-cost request with payment mode and chargeable grams", async () => {
    const { fetchImpl, calls } = fakeFetch([{ total_amount: 93.4 }]);
    const client = new DelhiveryB2cClient({ token: "token", fetchImpl });

    await client.calculateShippingCost({
      originPincode: "680651",
      destinationPincode: "682001",
      chargeableWeightGrams: 750.2,
      paymentMode: "Pre-paid",
    });

    const url = new URL(calls[0]!.url);
    assert.equal(url.pathname, "/api/kinko/v1/invoice/charges/.json");
    assert.equal(url.searchParams.get("md"), "S");
    assert.equal(url.searchParams.get("ss"), "Delivered");
    assert.equal(url.searchParams.get("o_pin"), "680651");
    assert.equal(url.searchParams.get("d_pin"), "682001");
    assert.equal(url.searchParams.get("cgm"), "751");
    assert.equal(url.searchParams.get("pt"), "Pre-paid");
  });

  it("uses the documented tracking endpoint", async () => {
    const { fetchImpl, calls } = fakeFetch({ ShipmentData: [] });
    const client = new DelhiveryB2cClient({ token: "token", fetchImpl });

    await client.track({ waybill: "1122345678722", orderId: "ORDER-1" });

    const url = new URL(calls[0]!.url);
    assert.equal(url.pathname, "/api/v1/packages/json/");
    assert.equal(url.searchParams.get("waybill"), "1122345678722");
    assert.equal(url.searchParams.get("ref_ids"), "ORDER-1");
  });

  it("encodes manifestation as format=json&data= and never retries a failed write", async () => {
    const { fetchImpl, calls } = fakeFetch({ error: "failed" }, { ok: false, status: 500 });
    const client = new DelhiveryB2cClient({ token: "token", fetchImpl });

    await assert.rejects(
      client.manifest({
        shipments: [
          {
            pin: "682001",
            phone: "9999999999",
            add: "Example road",
            order: "ORDER-1",
            payment_mode: "Pre-paid",
          },
        ],
        pickup_location: { name: "Mannuthy" },
      }),
      (error: unknown) => error instanceof DelhiveryApiError && error.status === 500
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.url, "https://staging-express.delhivery.com/api/cmu/create.json");
    assert.equal(calls[0]!.init.headers["Content-Type"], "application/x-www-form-urlencoded");
    const form = new URLSearchParams(calls[0]!.init.body);
    assert.equal(form.get("format"), "json");
    assert.match(form.get("data") ?? "", /"ORDER-1"/);
  });

  it("requires an explicit second gate for production requests", () => {
    assert.throws(
      () => new DelhiveryB2cClient({ token: "token", environment: "production" }),
      /productionEnabled/
    );

    const client = new DelhiveryB2cClient({
      token: "token",
      environment: "production",
      productionEnabled: true,
      fetchImpl: fakeFetch().fetchImpl,
    });
    assert.equal(client.environment, "production");
  });

  it("constructs clients only through the opaque Delhivery binding", () => {
    const client = createDelhiveryB2cClientFromProviderConfig(
      {
        providerKey: "delhivery",
        credentialSource: "environment",
        credentialKey: "delhivery_primary",
      },
      { fetchImpl: fakeFetch().fetchImpl },
      { RINADS_DELHIVERY_API_TOKEN: "bound-token" }
    );

    assert.equal(client.environment, "staging");
  });

  it("rejects malformed pincodes before sending a carrier request", async () => {
    const { fetchImpl, calls } = fakeFetch();
    const client = new DelhiveryB2cClient({ token: "token", fetchImpl });

    await assert.rejects(client.checkPincode("68065"), /six-digit Indian PIN code/);
    assert.equal(calls.length, 0);
  });
});
