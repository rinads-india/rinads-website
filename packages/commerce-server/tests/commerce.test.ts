import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CartService,
  CatalogService,
  CheckoutService,
  PromotionService,
  TaxService,
} from "@rinads/commerce";
import {
  createInMemoryRepository,
  createAmbadySeedStore,
  createLegacyVariantStockInventoryPort,
  AMBADY_ORG_ID,
} from "../src/index";

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
    const inventory = createLegacyVariantStockInventoryPort(repo);
    const cartSvc = new CartService(repo, inventory);
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
  it("places demo order only through an explicit inventory adapter", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const inventory = createLegacyVariantStockInventoryPort(repo);
    const cartSvc = new CartService(repo, inventory);
    const checkout = new CheckoutService(repo, inventory);
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

  it("captures immutable shipping-address evidence from the selected customer address", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const store = repo.getStore();
    store.addresses.push({
      id: "addr_shipping_1",
      organizationId: AMBADY_ORG_ID,
      customerId: ctx.customerId,
      label: "Home",
      name: "Test Customer",
      phone: "9999999999",
      line1: "Original delivery road",
      line2: "Mannuthy",
      city: "Thrissur",
      state: "Kerala",
      pincode: "680651",
      isDefault: true,
    });
    repo.saveStore(store);

    const inventory = createLegacyVariantStockInventoryPort(repo);
    const cartSvc = new CartService(repo, inventory);
    const checkout = new CheckoutService(repo, inventory);
    const cart = cartSvc.getOrCreate(ctx);
    cartSvc.addLine(ctx, cart.id, "var_pebbles_1kg", 1);

    const order = checkout.placeOrder(ctx, {
      cartId: cart.id,
      customerId: ctx.customerId,
      addressId: "addr_shipping_1",
      shippingMethodCode: "standard",
      paymentProvider: "demo",
      paymentReference: "demo_shipping_snapshot",
    });

    assert.ok(order.ok);
    assert.deepEqual(order.data.shippingAddress, {
      sourceAddressId: "addr_shipping_1",
      name: "Test Customer",
      phone: "9999999999",
      line1: "Original delivery road",
      line2: "Mannuthy",
      city: "Thrissur",
      state: "Kerala",
      pincode: "680651",
      country: "IN",
    });

    const mutableAddress = repo.getStore().addresses.find((address) => address.id === "addr_shipping_1");
    assert.ok(mutableAddress);
    mutableAddress.line1 = "Edited after checkout";
    repo.saveStore(repo.getStore());

    assert.equal(order.data.shippingAddress?.line1, "Original delivery road");
  });

  it("rejects an address belonging to another customer before checkout side effects", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const store = repo.getStore();
    store.addresses.push({
      id: "addr_other_customer",
      organizationId: AMBADY_ORG_ID,
      customerId: "cust_other",
      name: "Other Customer",
      phone: "8888888888",
      line1: "Other road",
      city: "Thrissur",
      state: "Kerala",
      pincode: "680001",
      isDefault: false,
    });
    repo.saveStore(store);

    const inventory = createLegacyVariantStockInventoryPort(repo);
    const cartSvc = new CartService(repo, inventory);
    const checkout = new CheckoutService(repo, inventory);
    const cart = cartSvc.getOrCreate(ctx);
    cartSvc.addLine(ctx, cart.id, "var_pebbles_1kg", 1);

    const order = checkout.placeOrder(ctx, {
      cartId: cart.id,
      customerId: ctx.customerId,
      addressId: "addr_other_customer",
      shippingMethodCode: "standard",
      paymentProvider: "demo",
      paymentReference: "demo_must_not_run",
    });

    assert.equal(order.ok, false);
    if (!order.ok) assert.equal(order.error.code, "FORBIDDEN");
    assert.equal(repo.getStore().orders.length, 0);
    assert.equal(cart.lines.length, 1);
  });

  it("fails closed when authoritative checkout has no inventory provider", () => {
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
      paymentReference: "demo_pay_should_not_run",
    });

    assert.equal(order.ok, false);
    if (!order.ok) assert.equal(order.error.code, "INVENTORY_UNAVAILABLE");
  });
});