import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  commerce,
  demoContext,
  listAllProducts,
  listOrgOrders,
  listOrgTickets,
  countOpenTickets,
  getProductWithDetails,
  AMBADY_ORG_ID,
} from "../lib/commerce";
import { CartService, CheckoutService } from "@rinads/commerce";

describe("owner-portal smoke", () => {
  it("demoContext is org owner without customerId", () => {
    const ctx = demoContext();
    assert.equal(ctx.organizationId, AMBADY_ORG_ID);
    assert.equal(ctx.userId, "user_owner_001");
    assert.equal(ctx.customerId, undefined);
  });

  it("reads real catalog products including published items", () => {
    const ctx = demoContext();
    const products = listAllProducts(ctx);
    assert.ok(products.length >= 3);
    assert.ok(products.some((p) => p.status === "draft"));
    assert.ok(products.every((p) => p.organizationId === AMBADY_ORG_ID));
  });

  it("loads product details for editor", () => {
    const ctx = demoContext();
    const products = listAllProducts(ctx);
    const details = getProductWithDetails(ctx, products[0].id);
    assert.ok(details);
    assert.ok(details!.variants.length >= 1);
  });

  it("upserts product via catalog service", () => {
    const ctx = demoContext();
    const details = getProductWithDetails(ctx, "prod_pebbles_001");
    assert.ok(details);
    const updated = { ...details!.product, description: details!.product.description + " (owner edit test)" };
    const result = commerce.catalog.upsertProduct(ctx, updated, details!.variants, details!.media);
    assert.ok(result.ok);
  });

  it("lists org orders without customerId filter", () => {
    const ctx = demoContext();
    const repo = commerce.repo;
    const cartSvc = new CartService(repo);
    const checkout = new CheckoutService(repo);
    const customerCtx = { organizationId: AMBADY_ORG_ID, customerId: "cust_smoke_test" };
    const cart = cartSvc.getOrCreate(customerCtx);
    cartSvc.addLine(customerCtx, cart.id, "var_pebbles_500g", 1);
    const placed = checkout.placeOrder(customerCtx, {
      cartId: cart.id,
      customerId: customerCtx.customerId,
      shippingMethodCode: "standard",
      paymentProvider: "demo",
      paymentReference: "smoke_pay_ok",
    });
    assert.ok(placed.ok);

    const orders = listOrgOrders(ctx);
    assert.ok(orders.some((o) => o.id === placed.data.id));
  });

  it("order getById works without customerId for owner", () => {
    const ctx = demoContext();
    const orders = listOrgOrders(ctx);
    if (orders.length === 0) return;
    const result = commerce.order.getById(ctx, orders[0].id);
    assert.ok(result.ok);
  });

  it("lists org support tickets", () => {
    const ctx = demoContext();
    const tickets = listOrgTickets(ctx);
    assert.ok(Array.isArray(tickets));
    assert.equal(typeof countOpenTickets(ctx), "number");
  });
});
