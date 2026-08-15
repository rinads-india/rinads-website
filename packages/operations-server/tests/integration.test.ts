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
