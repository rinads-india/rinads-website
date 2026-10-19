import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { commerce, operations, demoContext, opsContext } from "../src/index";

describe("Phase 10 integration", () => {
  it("TEST 01: order flow reduces ledger stock", () => {
    const ctx = demoContext();
    const cart = commerce.cart.getOrCreate(ctx);
    commerce.cart.addLine(ctx, cart.id, "var_pebbles_500g", 2);

    const before = operations.ledger.getBalance(opsContext(), "var_pebbles_500g");
    const order = commerce.checkout.placeOrder(ctx, {
      cartId: cart.id,
      customerId: ctx.customerId,
      shippingMethodCode: "standard",
      paymentProvider: "demo",
      paymentReference: "pay_test_1",
    });
    assert.ok(order.ok);

    const after = operations.ledger.getBalance(opsContext(), "var_pebbles_500g");
    assert.equal(after.onHand, before.onHand - 2);

    const variant = commerce.repo.getStore().variants.find((v) => v.id === "var_pebbles_500g");
    assert.equal(variant?.stock, after.available);
  });

  it("K3: ledger rejects oversell even when scalar stock projection is stale-high", () => {
    const ctx = demoContext({ customerId: "cust_k3_high" });
    const variant = commerce.repo.getStore().variants.find((v) => v.id === "var_pebbles_500g");
    assert.ok(variant);

    const available = operations.ledger.getAvailable(opsContext(), variant.id);
    variant.stock = available + 10_000;

    const cart = commerce.cart.getOrCreate(ctx);
    const result = commerce.cart.addLine(ctx, cart.id, variant.id, available + 1);
    assert.equal(result.ok, false);

    operations.refreshStockProjections();
    assert.equal(variant.stock, operations.ledger.getAvailable(opsContext(), variant.id));
  });

  it("K3: ledger allows valid stock even when scalar projection is stale-low", () => {
    const ctx = demoContext({ customerId: "cust_k3_low" });
    const variant = commerce.repo.getStore().variants.find((v) => v.id === "var_pebbles_500g");
    assert.ok(variant);
    assert.ok(operations.ledger.getAvailable(opsContext(), variant.id) > 0);

    variant.stock = 0;

    const cart = commerce.cart.getOrCreate(ctx);
    const result = commerce.cart.addLine(ctx, cart.id, variant.id, 1);
    assert.ok(result.ok);
    commerce.cart.clear(ctx, cart.id);

    operations.refreshStockProjections();
    assert.equal(variant.stock, operations.ledger.getAvailable(opsContext(), variant.id));
  });

  it("TEST 03: order.paid triggers async runtime workflow", async () => {
    const ctx = demoContext();
    const cart = commerce.cart.getOrCreate(ctx);
    commerce.cart.addLine(ctx, cart.id, "var_pebbles_500g", 1);
    const order = commerce.checkout.placeOrder(ctx, {
      cartId: cart.id,
      customerId: ctx.customerId,
      shippingMethodCode: "standard",
      paymentProvider: "demo",
      paymentReference: "pay_runtime_1",
    });
    assert.ok(order.ok);

    await operations.runtime.processQueue({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      roleKey: "founder",
      permissions: ["org.manage", "commerce.order.read"],
    });

    const executions = operations.runtime.listExecutions(ctx.organizationId);
    assert.ok(executions.some((e) => e.workflowKey === "order-fulfilment-v1"));
    assert.ok(operations.fulfilment.pendingCount(opsContext()) >= 0);
  });

  it("TEST 02: low stock to PO to receipt", () => {
    const ctx = opsContext({ roleKey: "founder" });
    const po = operations.purchaseOrders.create(ctx, {
      supplierId: "sup_pebble_co",
      lines: [{ variantId: "var_pebbles_5kg", quantity: 20, unitCost: 700 }],
    });
    assert.ok(po.ok);
    operations.purchaseOrders.submit(ctx, po.data.id);
    operations.purchaseOrders.approve(ctx, po.data.id);

    const before = operations.ledger.getBalance(ctx, "var_pebbles_5kg").onHand;
    const lineId = operations.purchaseOrders.getLines(po.data.id)[0]!.id;
    const gr = operations.goodsReceipts.receive(ctx, {
      purchaseOrderId: po.data.id,
      locationId: "loc_main_store",
      lines: [{ purchaseOrderLineId: lineId, receivedQuantity: 20, acceptedQuantity: 20 }],
    });
    assert.ok(gr.ok);
    const after = operations.ledger.getBalance(ctx, "var_pebbles_5kg").onHand;
    assert.equal(after, before + 20);
  });
});
