import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  callbackForOndcAction,
  canLinkOndcTransactionToOrder,
  isKnownOndcProtocolAction,
  isMatchingOndcCallback,
  ondcMessageIdempotencyKey,
  requestForOndcCallback,
  validateOndcChannelConfig,
} from "../src/index";

describe("ONDC channel contracts", () => {
  it("pairs transaction actions with callbacks", () => {
    assert.equal(callbackForOndcAction("search"), "on_search");
    assert.equal(callbackForOndcAction("confirm"), "on_confirm");
    assert.equal(requestForOndcCallback("on_track"), "track");
    assert.equal(requestForOndcCallback("unknown"), null);
    assert.equal(isMatchingOndcCallback("select", "on_select"), true);
    assert.equal(isMatchingOndcCallback("select", "on_init"), false);
  });

  it("recognizes supported request/callback actions", () => {
    assert.equal(isKnownOndcProtocolAction("search"), true);
    assert.equal(isKnownOndcProtocolAction("on_search"), true);
    assert.equal(isKnownOndcProtocolAction("cancel"), true);
    assert.equal(isKnownOndcProtocolAction("on_update"), true);
    assert.equal(isKnownOndcProtocolAction("invented"), false);
  });

  it("requires explicit protocol version and HTTPS in production", () => {
    assert.doesNotThrow(() =>
      validateOndcChannelConfig({
        organizationId: "org_1",
        role: "seller_app",
        subscriberId: "seller.example",
        subscriberUrl: "https://seller.example/ondc",
        domain: "ONDC:RET10",
        protocolVersion: "1.2.5",
        environment: "production",
      })
    );

    assert.throws(
      () =>
        validateOndcChannelConfig({
          organizationId: "org_1",
          role: "seller_app",
          subscriberId: "seller.example",
          subscriberUrl: "http://seller.example/ondc",
          domain: "ONDC:RET10",
          protocolVersion: "1.2.5",
          environment: "production",
        }),
      /HTTPS/
    );
  });

  it("builds stable message idempotency keys", () => {
    assert.equal(
      ondcMessageIdempotencyKey({
        subscriberId: "seller.example",
        transactionId: "txn-1",
        messageId: "msg-1",
        action: "on_confirm",
        direction: "inbound",
      }),
      "seller.example:txn-1:msg-1:on_confirm:inbound"
    );
  });

  it("keeps ONDC transaction mapping subordinate to canonical Commerce orders", () => {
    assert.equal(
      canLinkOndcTransactionToOrder({
        organizationId: "org_1",
        networkTransactionId: "txn-1",
        canonicalOrderId: "order-1",
      }),
      true
    );
    assert.equal(
      canLinkOndcTransactionToOrder({ organizationId: "", networkTransactionId: "txn-1" }),
      false
    );
  });
});
