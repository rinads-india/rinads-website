import assert from "node:assert/strict";
import { generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import { describe, it } from "node:test";
import { verifyAndDecodeWixWebhook } from "../lib/integrations/wix-webhook";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
const appId = "11111111-2222-3333-4444-555555555555";

function createJwt(payload: Record<string, unknown>, signingKey: KeyObject = privateKey) {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const input = `${header}.${body}`;
  const signature = sign("RSA-SHA256", Buffer.from(input), signingKey).toString("base64url");
  return `${input}.${signature}`;
}

describe("Wix webhook verification", () => {
  it("verifies RS256 and normalizes the Wix event envelope", () => {
    const token = createJwt({
      iss: "wix.com",
      aud: appId,
      exp: 2_000_000_000,
      data: JSON.stringify({
        eventType: "AppInstalled",
        instanceId: "instance-123",
        data: JSON.stringify({ appId }),
        identity: JSON.stringify({ identityType: "APP", appId }),
      }),
    });

    const event = verifyAndDecodeWixWebhook(token, {
      publicKey: publicKeyPem,
      appId,
      nowSeconds: 1_900_000_000,
    });

    assert.equal(event.provider, "wix");
    assert.equal(event.eventType, "AppInstalled");
    assert.equal(event.instanceId, "instance-123");
    assert.deepEqual(event.data, { appId });
    assert.deepEqual(event.identity, { identityType: "APP", appId });
    assert.match(event.eventId, /^[a-f0-9]{64}$/);
  });

  it("keeps a stable provider event ID across re-signed retries", () => {
    const eventEnvelope = {
      eventType: "wix.ecom.v1.order_created",
      instanceId: "instance-123",
      data: JSON.stringify({
        createdEvent: {
          id: "provider-event-1",
          entityId: "order-1",
        },
      }),
      identity: JSON.stringify({ identityType: "APP", appId }),
    };

    const firstToken = createJwt({
      iss: "wix.com",
      aud: appId,
      exp: 2_000_000_000,
      iat: 1_900_000_000,
      data: JSON.stringify(eventEnvelope),
    });
    const retryToken = createJwt({
      iss: "wix.com",
      aud: appId,
      exp: 2_000_000_100,
      iat: 1_900_000_100,
      data: JSON.stringify(eventEnvelope),
    });

    const first = verifyAndDecodeWixWebhook(firstToken, {
      publicKey: publicKeyPem,
      appId,
      nowSeconds: 1_900_000_000,
    });
    const retry = verifyAndDecodeWixWebhook(retryToken, {
      publicKey: publicKeyPem,
      appId,
      nowSeconds: 1_900_000_100,
    });

    assert.notEqual(firstToken, retryToken);
    assert.equal(first.eventId, "provider-event-1");
    assert.equal(retry.eventId, "provider-event-1");
  });

  it("rejects a token whose signed content was tampered with", () => {
    const token = createJwt({
      data: JSON.stringify({ eventType: "AppInstalled", instanceId: "instance-123", data: "{}" }),
    });
    const [header, payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ data: JSON.stringify({ eventType: "AppRemoved", instanceId: "instance-123", data: "{}" }) }),
    ).toString("base64url");

    assert.throws(() =>
      verifyAndDecodeWixWebhook(`${header}.${tamperedPayload}.${signature}`, {
        publicKey: publicKeyPem,
        appId,
      }),
    );
    assert.ok(payload.length > 0);
  });

  it("rejects a mismatched audience when Wix supplies aud", () => {
    const token = createJwt({
      aud: "another-app",
      data: JSON.stringify({ eventType: "AppInstalled", instanceId: "instance-123", data: "{}" }),
    });

    assert.throws(() =>
      verifyAndDecodeWixWebhook(token, {
        publicKey: publicKeyPem,
        appId,
      }),
    );
  });
});
