import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  commerce,
  demoContext,
  DEMO_CUSTOMER_ID,
  resetCommerceStore,
} from "@rinads/commerce-server";
import {
  getCustomerProfile,
  listCustomerAddresses,
  listWishlistItems,
  portalContext,
} from "../lib/commerce";

describe("customer-portal smoke", () => {
  it("portalContext uses DEMO_CUSTOMER_ID", () => {
    const ctx = portalContext();
    assert.equal(ctx.customerId, DEMO_CUSTOMER_ID);
    assert.ok(ctx.organizationId);
  });

  it("loads demo customer profile from commerce-server", () => {
    const ctx = portalContext();
    const profile = getCustomerProfile(ctx);
    assert.ok(profile);
    assert.equal(profile?.email, "demo@ambady.local");
  });

  it("lists demo customer addresses", () => {
    const ctx = portalContext();
    const addresses = listCustomerAddresses(ctx);
    assert.ok(addresses.length >= 1);
    assert.equal(addresses[0]?.customerId, DEMO_CUSTOMER_ID);
  });

  it("returns empty wishlist from store", () => {
    const ctx = portalContext();
    const items = listWishlistItems(ctx);
    assert.ok(Array.isArray(items));
  });

  it("personalization recommendations return published products", () => {
    const ctx = portalContext();
    const recs = commerce.personalization.recommendations(ctx, 2);
    assert.ok(recs.length >= 1);
    assert.equal(recs[0]?.status, "published");
  });

  it("order getById enforces customer IDOR check", () => {
    resetCommerceStore();
    const ctx = demoContext();
    const otherCustomer = "cust_other_999";

    const created = commerce.order.createFromCheckout(ctx, {
      customerId: otherCustomer,
      quote: {
        subtotal: 100,
        discountTotal: 0,
        shippingTotal: 49,
        taxTotal: 5,
        grandTotal: 154,
        shippingMethodCode: "standard",
      },
      lines: [
        {
          id: "line_1",
          productName: "Test",
          variantName: "Default",
          sku: "TST-1",
          quantity: 1,
          unitPrice: 100,
          taxAmount: 5,
          discountAmount: 0,
        },
      ],
      paymentRef: "demo_test",
      shippingMethodCode: "standard",
    });
    assert.ok(created.ok);

    const denied = commerce.order.getById(ctx, created.data.id, DEMO_CUSTOMER_ID);
    assert.ok(!denied.ok);
    assert.equal(denied.error.code, "FORBIDDEN");

    const allowed = commerce.order.getById(ctx, created.data.id, otherCustomer);
    assert.ok(allowed.ok);
  });

  it("support ticket create and list for demo customer", () => {
    const ctx = portalContext();
    const before = commerce.support.listForCustomer(ctx, DEMO_CUSTOMER_ID).length;
    const created = commerce.support.create(ctx, {
      customerId: DEMO_CUSTOMER_ID,
      subject: "Smoke test ticket",
      body: "Created during smoke test.",
    });
    assert.ok(created.ok);
    const after = commerce.support.listForCustomer(ctx, DEMO_CUSTOMER_ID).length;
    assert.equal(after, before + 1);
  });
});
