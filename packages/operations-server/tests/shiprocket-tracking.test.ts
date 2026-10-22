import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ShiprocketApiError,
  ShiprocketClient,
  normalizeShiprocketTrackingPayload,
  type ShiprocketFetch,
} from "../src/carriers/shiprocket";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return body === null ? "" : JSON.stringify(body);
    },
  };
}

describe("Shiprocket tracking", () => {
  it("normalizes documented webhook-style tracking evidence without projecting customer PII", () => {
    const normalized = normalizeShiprocketTrackingPayload({
      awb: "19041424751540",
      courier_name: "Delhivery Surface",
      current_status: "IN TRANSIT",
      current_status_id: 20,
      shipment_status: "IN TRANSIT",
      shipment_status_id: 18,
      current_timestamp: "23 05 2023 11:43:52",
      order_id: "merchant-order-id",
      sr_order_id: 348456385,
      etd: "2023-05-23 15:40:19",
      customer_name: "Must Not Be Projected",
      customer_phone: "9999999999",
      scans: [
        {
          date: "2023-05-19 15:32:17",
          status: "X-PPOM",
          activity: "In Transit - Shipment picked up",
          location: "Chomu_SamodRd_D (Rajasthan)",
          "sr-status": "42",
          "sr-status-label": "PICKED UP",
        },
      ],
    });

    assert.equal(normalized.trackingAvailable, true);
    assert.equal(normalized.awb, "19041424751540");
    assert.equal(normalized.courierName, "Delhivery Surface");
    assert.equal(normalized.currentStatus, "IN TRANSIT");
    assert.equal(normalized.currentStatusId, 20);
    assert.equal(normalized.shipmentStatusId, 18);
    assert.equal(normalized.orderId, 348456385);
    assert.equal(normalized.events[0]?.shiprocketStatusCode, "42");
    assert.equal(normalized.events[0]?.shiprocketStatusLabel, "PICKED UP");
    const serialized = JSON.stringify(normalized);
    assert.equal(serialized.includes("Must Not Be Projected"), false);
    assert.equal(serialized.includes("9999999999"), false);
  });

  it("normalizes tracking API response fields", () => {
    const normalized = normalizeShiprocketTrackingPayload({
      tracking_data: {
        track_status: 1,
        shipment_status: 7,
        shipment_track: [
          {
            shipment_id: 16016920,
            order_id: 16167171,
            awb_code: "AWB123",
            current_status: "Delivered",
            delivered_date: "2026-10-22 09:00:00",
          },
        ],
        shipment_track_activities: [
          {
            date: "2026-10-22 09:00:00",
            status: "DELIVERED",
            activity: "Shipment delivered",
            location: "Thrissur",
            "sr-status": 7,
            "sr-status-label": "DELIVERED",
          },
        ],
        track_url: "https://example.invalid/track/AWB123",
        etd: "2026-10-22 12:00:00",
      },
    });

    assert.equal(normalized.shipmentId, 16016920);
    assert.equal(normalized.orderId, 16167171);
    assert.equal(normalized.awb, "AWB123");
    assert.equal(normalized.currentStatus, "Delivered");
    assert.equal(normalized.shipmentStatusId, 7);
    assert.equal(normalized.deliveredAt, "2026-10-22 09:00:00");
    assert.equal(normalized.events.length, 1);
  });

  it("tracks by AWB using the read-only tracking endpoint", async () => {
    const requests: Array<{ url: string; method: string; authorization?: string }> = [];
    const fetchImpl: ShiprocketFetch = async (url, init) => {
      requests.push({
        url,
        method: init.method,
        authorization: init.headers.Authorization,
      });
      if (url.endsWith("/v1/external/auth/login")) {
        return jsonResponse(200, { token: "test-token" });
      }
      return jsonResponse(200, {
        tracking_data: {
          shipment_status: 18,
          shipment_track: [{ awb_code: "AWB123", shipment_id: 99, current_status: "In Transit" }],
          shipment_track_activities: [],
        },
      });
    };

    const client = new ShiprocketClient({
      email: "api-user@example.com",
      password: "secret-password",
      fetchImpl,
    });

    const result = await client.trackByAwb("AWB123");

    assert.equal(result.awb, "AWB123");
    assert.equal(result.shipmentId, 99);
    assert.equal(requests.length, 2);
    assert.equal(requests[1]?.method, "GET");
    assert.equal(
      requests[1]?.url,
      "https://apiv2.shiprocket.in/v1/external/courier/track/awb/AWB123"
    );
    assert.equal(requests[1]?.authorization, "Bearer test-token");
  });

  it("tracks by shipment id without requiring the mutation gate", async () => {
    const fetchImpl: ShiprocketFetch = async (url) => {
      if (url.endsWith("/v1/external/auth/login")) {
        return jsonResponse(200, { token: "test-token" });
      }
      return jsonResponse(200, {
        tracking_data: {
          shipment_status: 27,
          shipment_track: [{ shipment_id: 12345, current_status: "Pickup Booked" }],
        },
      });
    };

    const client = new ShiprocketClient({
      email: "api-user@example.com",
      password: "secret-password",
      writeEnabled: false,
      fetchImpl,
    });

    const result = await client.trackByShipmentId(12345);
    assert.equal(result.shipmentId, 12345);
    assert.equal(result.shipmentStatusId, 27);
  });

  it("does not replay a tracking call automatically after HTTP 401", async () => {
    let authCalls = 0;
    let trackingCalls = 0;
    const fetchImpl: ShiprocketFetch = async (url) => {
      if (url.endsWith("/v1/external/auth/login")) {
        authCalls += 1;
        return jsonResponse(200, { token: `token-${authCalls}` });
      }
      trackingCalls += 1;
      return jsonResponse(401, { message: "expired" });
    };

    const client = new ShiprocketClient({
      email: "api-user@example.com",
      password: "secret-password",
      fetchImpl,
    });

    await assert.rejects(
      () => client.trackByAwb("AWB123"),
      (error: unknown) => error instanceof ShiprocketApiError && error.status === 401
    );

    assert.equal(authCalls, 1);
    assert.equal(trackingCalls, 1);
  });
});
