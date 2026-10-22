import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ShiprocketApiError,
  ShiprocketV1Client,
  createShiprocketV1ClientFromProviderConfig,
  type ShiprocketFetch,
} from "../src/carriers/shiprocket-v1";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return body === null ? "" : JSON.stringify(body);
    },
  };
}

describe("ShiprocketV1Client", () => {
  it("authenticates with the API user and sends bearer auth for serviceability", async () => {
    const requests: Array<{ url: string; method: string; auth?: string; body?: string }> = [];
    const fetchImpl: ShiprocketFetch = async (url, init) => {
      requests.push({
        url,
        method: init.method,
        auth: init.headers.Authorization,
        body: init.body,
      });
      if (url.endsWith("/auth/login")) {
        return jsonResponse(200, { token: "shiprocket-jwt" });
      }
      return jsonResponse(200, { data: { available_courier_companies: [] } });
    };

    const client = new ShiprocketV1Client({
      apiEmail: "api-user@example.com",
      apiPassword: "secret-password",
      fetchImpl,
    });

    await client.checkServiceability({
      pickupPostcode: "680651",
      deliveryPostcode: "682016",
      cod: false,
      weightKg: 1.25,
      mode: "Surface",
    });
    await client.trackByAwb("SR12345");

    assert.equal(requests.length, 3);
    assert.equal(requests[0]?.url, "https://apiv2.shiprocket.in/v1/external/auth/login");
    assert.equal(requests[0]?.auth, undefined);
    assert.match(requests[0]?.body ?? "", /api-user@example\.com/);
    assert.match(requests[1]?.url ?? "", /courier\/serviceability\//);
    assert.match(requests[1]?.url ?? "", /pickup_postcode=680651/);
    assert.match(requests[1]?.url ?? "", /delivery_postcode=682016/);
    assert.equal(requests[1]?.auth, "Bearer shiprocket-jwt");
    assert.equal(requests[2]?.auth, "Bearer shiprocket-jwt");
  });

  it("blocks provider mutations unless the explicit external-effects gate is enabled", async () => {
    let calls = 0;
    const client = new ShiprocketV1Client({
      bearerToken: "shiprocket-jwt",
      fetchImpl: (async () => {
        calls += 1;
        return jsonResponse(200, {});
      }) as ShiprocketFetch,
    });

    await assert.rejects(
      () => client.assignAwb(12345, 10),
      (error: unknown) =>
        error instanceof ShiprocketApiError && /externalEffectsEnabled=true/.test(error.message)
    );
    await assert.rejects(
      () => client.requestPickup(12345),
      (error: unknown) =>
        error instanceof ShiprocketApiError && /externalEffectsEnabled=true/.test(error.message)
    );
    await assert.rejects(
      () => client.generateLabel([12345]),
      (error: unknown) =>
        error instanceof ShiprocketApiError && /externalEffectsEnabled=true/.test(error.message)
    );

    assert.equal(calls, 0);
  });

  it("refreshes an expired token once after a 401 when API-user credentials are available", async () => {
    let authCalls = 0;
    let trackCalls = 0;
    const fetchImpl: ShiprocketFetch = async (url, init) => {
      if (url.endsWith("/auth/login")) {
        authCalls += 1;
        return jsonResponse(200, { token: `token-${authCalls}` });
      }
      trackCalls += 1;
      if (trackCalls === 1) {
        assert.equal(init.headers.Authorization, "Bearer token-1");
        return jsonResponse(401, { message: "expired" });
      }
      assert.equal(init.headers.Authorization, "Bearer token-2");
      return jsonResponse(200, { tracking_data: {} });
    };

    const client = new ShiprocketV1Client({
      apiEmail: "api-user@example.com",
      apiPassword: "secret-password",
      fetchImpl,
    });

    const result = await client.trackByAwb("SR12345");
    assert.deepEqual(result, { tracking_data: {} });
    assert.equal(authCalls, 2);
    assert.equal(trackCalls, 2);
  });

  it("resolves only the server-owned Shiprocket credential binding", () => {
    const client = createShiprocketV1ClientFromProviderConfig(
      {
        providerKey: "shiprocket",
        credentialSource: "environment",
        credentialKey: "shiprocket_primary",
      },
      {},
      {
        RINADS_SHIPROCKET_API_EMAIL: "api-user@example.com",
        RINADS_SHIPROCKET_API_PASSWORD: "secret-password",
      }
    );

    assert.ok(client instanceof ShiprocketV1Client);
  });
});
