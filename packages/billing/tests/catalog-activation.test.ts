import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCatalogProviderMetadata,
  evaluateCatalogActivationSignal,
  type CatalogActivationPolicy,
} from "../src/index";

const notes = {
  organizationId: "org_1",
  productKey: "ri-salon-rinaverse",
  offerKey: "pro-monthly",
  catalogVersion: "2026-10-22",
  purchaseIntentId: "intent_1",
};

const subscriptionPolicy: CatalogActivationPolicy = {
  productKey: "ri-salon-rinaverse",
  offerKey: "pro-monthly",
  catalogVersion: "2026-10-22",
  billingMode: "subscription",
  allowedCurrencies: ["INR", "USD"],
};

describe("catalog activation gate", () => {
  it("accepts a verified normalized subscription signal matching trusted policy", () => {
    assert.deepEqual(
      evaluateCatalogActivationSignal(
        {
          provider: "stripe",
          providerEventId: "evt_1",
          kind: "subscription_active",
          status: "active",
          currency: "usd",
          notes,
        },
        subscriptionPolicy,
      ),
      {
        activate: true,
        notes,
        provider: "stripe",
        providerEventId: "evt_1",
      },
    );
  });

  it("fails closed when checkout metadata targets a different catalog offer", () => {
    assert.deepEqual(
      evaluateCatalogActivationSignal(
        {
          provider: "razorpay",
          providerEventId: "evt_2",
          kind: "subscription_active",
          status: "active",
          currency: "INR",
          notes: { ...notes, offerKey: "ultra-monthly" },
        },
        subscriptionPolicy,
      ),
      { activate: false, reason: "catalog_policy_mismatch" },
    );
  });

  it("fails closed for wrong billing mode, invalid currency or incomplete metadata", () => {
    assert.deepEqual(
      evaluateCatalogActivationSignal(
        {
          provider: "razorpay",
          providerEventId: "evt_3",
          kind: "one_time_paid",
          status: "paid",
          currency: "INR",
          notes,
        },
        subscriptionPolicy,
      ),
      { activate: false, reason: "billing_mode_mismatch" },
    );

    assert.deepEqual(
      evaluateCatalogActivationSignal(
        {
          provider: "stripe",
          providerEventId: "evt_4",
          kind: "subscription_active",
          status: "active",
          currency: "EUR",
          notes,
        },
        subscriptionPolicy,
      ),
      { activate: false, reason: "currency_not_allowed" },
    );

    assert.deepEqual(
      evaluateCatalogActivationSignal(
        {
          provider: "stripe",
          providerEventId: "evt_5",
          kind: "subscription_active",
          status: "active",
          currency: "USD",
          notes: { organizationId: "org_1" },
        },
        subscriptionPolicy,
      ),
      { activate: false, reason: "activation_metadata_missing" },
    );
  });

  it("builds identifier-only provider metadata", () => {
    assert.deepEqual(buildCatalogProviderMetadata(notes), {
      organization_id: "org_1",
      product_key: "ri-salon-rinaverse",
      offer_key: "pro-monthly",
      catalog_version: "2026-10-22",
      purchase_intent_id: "intent_1",
    });
  });
});
