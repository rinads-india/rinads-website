import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CartService,
  CatalogService,
  CheckoutService,
  PromotionService,
  TaxService,
} from "@rinads/commerce";
import { createInMemoryRepository, createAmbadySeedStore, AMBADY_ORG_ID } from "../src/index";

const ctx = { organizationId: AMBADY_ORG_ID, customerId: "cust_test" };

describe("CatalogService", () => {
  it("lists published products with variant prices", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const catalog = new CatalogService(repo);
    const items = catalog.listPublished(ctx);
    assert.ok(items.length >= 2);
    assert.ok(items[0].variants.length >= 1);
    assert.ok(items[0].minPrice > 0);
  });

  it("searches by SKU", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const catalog = new CatalogService(repo);
    const items = catalog.search(ctx, "PEB-1KG");
    assert.equal(items.length, 1);
    assert.equal(items[0].slug, "ambady-premium-pebbles");
  });
});

describe("CartService", () => {
  it("adds variant and validates stock", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const cartSvc = new CartService(repo);
    const cart = cartSvc.getOrCreate(ctx);
    const result = cartSvc.addLine(ctx, cart.id, "var_pebbles_500g", 2);
    assert.ok(result.ok);
    const validated = cartSvc.validate(ctx, cart.id);
    assert.ok(validated.ok);
    assert.equal(validated.data.subtotal, 298);
  });
});

describe("TaxService", () => {
  it("calculates GST from store rate", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const tax = new TaxService(repo);
    assert.equal(tax.calculateTax(1000), 50);
  });
});

describe("PromotionService", () => {
  it("applies percentage discount with cap", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const promo = new PromotionService(repo);
    const result = promo.validate(ctx, "WELCOME10", 500);
    assert.ok(result.ok);
    assert.equal(result.data.discount, 50);
  });
});

describe("CheckoutService", () => {
  it("places order with server-side totals", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const cartSvc = new CartService(repo);
    const checkout = new CheckoutService(repo);
    const cart = cartSvc.getOrCreate(ctx);
    cartSvc.addLine(ctx, cart.id, "var_pebbles_1kg", 1);
    const order = checkout.placeOrder(ctx, {
      cartId: cart.id,
      customerId: ctx.customerId,
      shippingMethodCode: "standard",
      paymentProvider: "demo",
      paymentReference: "demo_pay_ok",
    });
    assert.ok(order.ok);
    assert.equal(order.data.paymentStatus, "paid");
    assert.ok(order.data.lines.length === 1);
    assert.ok(order.data.grandTotal > 0);
  });
});
