import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CALLIYO_CAPABILITIES,
  CalliyoProvider,
  ProviderCapabilityUnavailableError,
  communicationEventIdempotencyKey,
  decideOutboundMessagePolicy,
  requireVerifiedCapability,
} from "../src/index";

describe("communication contracts", () => {
  it("fails closed for unverified Calliyo API capabilities", async () => {
    const provider = new CalliyoProvider({ enabled: true, credentialBindingId: "binding_calliyo_1" });
    const health = await provider.healthCheck();

    assert.equal(health.ok, false);
    assert.equal(health.verificationStatus, "contract_pending");
    assert.equal(CALLIYO_CAPABILITIES["voice.outbound"], "unverified");

    await assert.rejects(
      () =>
        provider.placeOutboundCall({
          organizationId: "org_1",
          fromNumber: "+910000000001",
          toNumber: "+910000000002",
        }),
      (error: unknown) =>
        error instanceof ProviderCapabilityUnavailableError &&
        error.provider === "calliyo" &&
        error.capability === "voice.outbound",
    );
  });

  it("requires both provider production verification and capability verification", () => {
    assert.throws(
      () =>
        requireVerifiedCapability(
          "calliyo",
          "contract_pending",
          { "voice.outbound": "verified" },
          "voice.outbound",
        ),
      ProviderCapabilityUnavailableError,
    );

    assert.doesNotThrow(() =>
      requireVerifiedCapability(
        "exotel",
        "production_verified",
        { "voice.outbound": "verified" },
        "voice.outbound",
      ),
    );
  });

  it("blocks opted-out recipients", () => {
    const decision = decideOutboundMessagePolicy({
      channel: "whatsapp",
      direction: "outbound",
      businessInitiated: true,
      templateKey: "booking.confirmed",
      consent: {
        organizationId: "org_1",
        channel: "whatsapp",
        status: "opted_out",
        optedOutAt: "2026-10-01T00:00:00Z",
      },
    });

    assert.equal(decision.allowed, false);
  });

  it("requires opt-in and a template for business-initiated WhatsApp", () => {
    assert.equal(
      decideOutboundMessagePolicy({
        channel: "whatsapp",
        direction: "outbound",
        businessInitiated: true,
      }).allowed,
      false,
    );

    assert.equal(
      decideOutboundMessagePolicy({
        channel: "whatsapp",
        direction: "outbound",
        businessInitiated: true,
        consent: {
          organizationId: "org_1",
          channel: "whatsapp",
          status: "opted_in",
          capturedAt: "2026-10-01T00:00:00Z",
        },
      }).allowed,
      false,
    );

    assert.equal(
      decideOutboundMessagePolicy({
        channel: "whatsapp",
        direction: "outbound",
        businessInitiated: true,
        templateKey: "booking.confirmed",
        consent: {
          organizationId: "org_1",
          channel: "whatsapp",
          status: "opted_in",
          capturedAt: "2026-10-01T00:00:00Z",
        },
      }).allowed,
      true,
    );
  });

  it("uses provider event ids for idempotent ingestion when available", () => {
    assert.equal(
      communicationEventIdempotencyKey({
        provider: "calliyo",
        providerEventId: "evt_123",
        eventId: "local_1",
      }),
      "communication:calliyo:evt_123",
    );

    assert.equal(
      communicationEventIdempotencyKey({ eventId: "local_1" }),
      "communication:event:local_1",
    );
  });
});
