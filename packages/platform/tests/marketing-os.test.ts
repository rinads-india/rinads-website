import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ChannelGateway,
  ChannelGatewayError,
  MARKETING_OS_EVENTS,
  MetaChannelAdapter,
  PUBLICATION_STATUSES,
  assertOrganizationScope,
} from "../src/marketing/index";

describe("Marketing OS Phase 0", () => {
  it("locks the publication lifecycle contract", () => {
    assert.deepEqual(PUBLICATION_STATUSES, [
      "DRAFT",
      "GENERATING",
      "REVIEW",
      "APPROVED",
      "SCHEDULED",
      "PROCESSING",
      "PUBLISHED",
      "PARTIAL_FAILURE",
      "FAILED",
      "ARCHIVED",
    ]);
  });

  it("registers the Meta adapter but keeps external effects fail-closed", async () => {
    const gateway = new ChannelGateway().register(new MetaChannelAdapter());
    assert.equal(gateway.has("meta"), true);
    assert.equal(gateway.requireCapability("meta", "health_check").provider, "meta");
    assert.throws(
      () => gateway.requireCapability("meta", "publish"),
      (error: unknown) =>
        error instanceof ChannelGatewayError &&
        error.code === "CAPABILITY_NOT_SUPPORTED",
    );

    await assert.rejects(
      () =>
        gateway.get("meta").publish({
          organizationId: "org-1",
          account: {
            id: "acct-1",
            organizationId: "org-1",
            connectionId: "conn-1",
            provider: "meta",
            accountType: "instagram_business",
            externalAccountId: "external-1",
            displayName: "RINADS",
            status: "active",
          },
          publicationId: "pub-1",
          idempotencyKey: "marketing.publication:pub-1",
          text: "Business Simplified.",
        }),
      (error: unknown) =>
        error instanceof ChannelGatewayError &&
        error.code === "INTEGRATION_NOT_CONFIGURED",
    );
  });

  it("refuses cross-tenant channel actions", () => {
    assert.doesNotThrow(() => assertOrganizationScope("org-1", "org-1"));
    assert.throws(
      () => assertOrganizationScope("org-1", "org-2"),
      (error: unknown) =>
        error instanceof ChannelGatewayError &&
        error.code === "INVALID_TENANT_CONTEXT",
    );
  });

  it("publishes stable domain event contracts for Runtime", () => {
    assert.ok(MARKETING_OS_EVENTS.includes("marketing.publication.published"));
    assert.ok(MARKETING_OS_EVENTS.includes("rinpo.action.approved"));
  });
});
