import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeShiprocketTrackingResponse,
  normalizeShiprocketWebhook,
  shiprocketWebhookEventKey,
  verifyShiprocketWebhookKey,
} from "../src/carriers/shiprocket-webhook";

describe("Shiprocket webhook normalization", () => {
  it("maps the documented delivered status into the canonical delivery event", () => {
    const result = normalizeShiprocketWebhook(
      {
        awb: "19041424751540",
        courier_name: "Delhivery Surface",
        current_status: "DELIVERED",
        current_status_id: 7,
        shipment_status: "DELIVERED",
        shipment_status_id: 7,
        current_timestamp: "2026-10-22T10:00:00+05:30",
        order_id: "ORDER-1",
        sr_order_id: 348456385,
      },
      "2026-10-22T04:30:05.000Z"
    );

    assert.equal(result.awb, "19041424751540");
    assert.equal(result.providerOrderId, "348456385");
    assert.equal(result.event.type, "delivered");
    assert.equal(result.event.occurredAt, "2026-10-22T04:30:00.000Z");
    assert.equal(
      shiprocketWebhookEventKey(result),
      "shiprocket:19041424751540:7:2026-10-22T10:00:00+05:30"
    );
  });

  it("maps textual OUT FOR DELIVERY before the broader delivered fallback", () => {
    const result = normalizeShiprocketWebhook({
      awb: "AWB-OFD",
      current_status: "OUT FOR DELIVERY",
    });

    assert.equal(result.event.type, "out_for_delivery");
  });

  it("uses receipt time when the provider timestamp is not safely parseable", () => {
    const receivedAt = "2026-10-22T04:30:05.000Z";
    const result = normalizeShiprocketWebhook(
      {
        awb: "AWB1",
        current_status: "IN TRANSIT",
        shipment_status_id: 18,
        current_timestamp: "23 05 2023 11:43:52",
      },
      receivedAt
    );

    assert.equal(result.event.type, "in_transit");
    assert.equal(result.event.occurredAt, receivedAt);
    assert.equal(result.providerTimestamp, "23 05 2023 11:43:52");
  });

  it("normalizes tracking activity arrays", () => {
    const events = normalizeShiprocketTrackingResponse(
      {
        tracking_data: {
          shipment_track_activities: [
            {
              date: "2026-10-22T09:00:00+05:30",
              activity: "Shipment picked up",
              "sr-status": "42",
              "sr-status-label": "PICKED UP",
            },
            {
              date: "2026-10-22T12:00:00+05:30",
              activity: "In Transit",
              "sr-status": "18",
              "sr-status-label": "IN TRANSIT",
            },
          ],
        },
      },
      "2026-10-22T04:00:00.000Z"
    );

    assert.deepEqual(events.map((event) => event.type), ["picked_up", "in_transit"]);
  });

  it("compares webhook x-api-key values without accepting empty or unequal keys", () => {
    assert.equal(verifyShiprocketWebhookKey("secret-key", "secret-key"), true);
    assert.equal(verifyShiprocketWebhookKey("wrong-key", "secret-key"), false);
    assert.equal(verifyShiprocketWebhookKey(undefined, "secret-key"), false);
    assert.equal(verifyShiprocketWebhookKey("", ""), false);
  });
});
