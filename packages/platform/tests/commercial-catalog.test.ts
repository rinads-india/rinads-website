import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  offerSupportsCommercialRoute,
  resolveTrustedEntitlementManifest,
  type CatalogOfferDefinition,
  type CatalogProductDefinition,
} from "../src/index";

const product: CatalogProductDefinition = {
  key: "ri-salon-rinaverse",
  name: "RI SALON RINAVERSE",
  type: "industry_pack",
  version: "2026-10-22",
  status: "published",
  capabilityKeys: ["salon.appointments", "salon.billing", "communication.whatsapp"],
  firstValue: {
    productKey: "ri-salon-rinaverse",
    eventKey: "appointment.invoiced",
    version: "1",
    description: "First completed appointment with an invoice.",
    requiredProperties: ["appointment_id", "invoice_id"],
  },
};

const offer: CatalogOfferDefinition = {
  key: "pro-monthly",
  productKey: "ri-salon-rinaverse",
  catalogVersion: "2026-10-22",
  status: "active",
  billingMode: "subscription",
  providerRoutes: [
    { provider: "razorpay", currencies: ["INR"], markets: ["IN"] },
    { provider: "stripe", currencies: ["USD"], markets: ["US", "GLOBAL"] },
  ],
  requiresTenant: true,
  planKey: "growth",
  provisioningTemplate: "salon-os",
  limits: { seats: 25, locations: 3 },
};

describe("trusted commercial catalog", () => {
  it("resolves entitlements only from published product + active offer state", () => {
    const result = resolveTrustedEntitlementManifest(product, offer, {
      provider: "razorpay",
      currency: "inr",
      market: "in",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.entitlement.capabilityKeys, product.capabilityKeys);
    assert.deepEqual(result.entitlement.limits, { seats: 25, locations: 3 });
    assert.equal(result.entitlement.provisioningTemplate, "salon-os");
  });

  it("normalizes route matching and rejects unsupported provider/currency/market combinations", () => {
    assert.equal(
      offerSupportsCommercialRoute(offer, { provider: "stripe", currency: " usd ", market: "global" }),
      true,
    );
    assert.equal(
      offerSupportsCommercialRoute(offer, { provider: "razorpay", currency: "USD", market: "IN" }),
      false,
    );
  });

  it("fails closed when offer/product identity or catalog version diverges", () => {
    assert.deepEqual(
      resolveTrustedEntitlementManifest(product, { ...offer, productKey: "other" }),
      { ok: false, reason: "product_offer_mismatch" },
    );
    assert.deepEqual(
      resolveTrustedEntitlementManifest(product, { ...offer, catalogVersion: "old" }),
      { ok: false, reason: "catalog_version_mismatch" },
    );
  });

  it("requires a provisioning template for tenant-creating offers", () => {
    assert.deepEqual(
      resolveTrustedEntitlementManifest(product, { ...offer, provisioningTemplate: undefined }),
      { ok: false, reason: "tenant_template_missing" },
    );
  });
});
