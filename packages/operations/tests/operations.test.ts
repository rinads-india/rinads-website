import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  StockLedgerService,
  ReservationService,
  TransferService,
  PurchaseOrderService,
  GoodsReceiptService,
  FulfilmentService,
  ReturnService,
  RefundService,
  LowStockService,
} from "../src/index";
import type { OperationsRepository, OperationsStore } from "../src/repository";
import { createTestOperationsStore } from "./fixtures";

function createTestRepo(initial: OperationsStore): OperationsRepository {
  let store = structuredClone(initial);
  let id = 1;
  const counters: Record<string, number> = {};
  return {
    getStore: () => store,
    saveStore: (s) => {
      store = s;
    },
    nextId: (prefix) => `${prefix}_${++id}`,
    nextDocumentNumber: (orgId, docType, prefix) => {
      const key = `${orgId}:${docType}`;
      counters[key] = (counters[key] ?? 1000) + 1;
      return `${prefix}-${counters[key]}`;
    },
  };
}

describe("StockLedgerService", () => {
  let repo: OperationsRepository;
  let ledger: StockLedgerService;
  const ctx = { organizationId: "org_ambady_demo", userId: "user_owner_001" };

  beforeEach(() => {
    repo = createTestRepo(createTestOperationsStore());
    ledger = new StockLedgerService(repo);
  });

  it("computes available = on_hand - reserved", () => {
    const balance = ledger.getBalance(ctx, "var_pebbles_500g");
    assert.equal(balance.onHand, 120);
    assert.equal(balance.available, 120);
  });

  it("records sale movement and reduces on_hand", () => {
    const sale = ledger.recordMovement(ctx, {
      variantId: "var_pebbles_500g",
      locationId: "loc_main_store",
      quantityDelta: -5,
      movementType: "sale",
      referenceType: "order",
      referenceId: "ord_test",
    });
    assert.ok(sale.ok);
    const balance = ledger.getBalance(ctx, "var_pebbles_500g");
    assert.equal(balance.onHand, 115);
  });

  it("requires reason for adjustment", () => {
    const result = ledger.adjustStock(ctx, {
      variantId: "var_pebbles_500g",
      locationId: "loc_main_store",
      quantityDelta: 10,
      reason: "",
    });
    assert.ok(!result.ok);
  });
});

describe("Reservation lifecycle", () => {
  const ctx = { organizationId: "org_ambady_demo" };

  it("reserves and converts to sale", () => {
    const repo = createTestRepo(createTestOperationsStore());
    const ledger = new StockLedgerService(repo);
    const reservations = new ReservationService(repo, ledger);

    const reserve = ledger.reserveForCart(ctx, "cart_1", [
      { variantId: "var_pebbles_500g", quantity: 3 },
    ]);
    assert.ok(reserve.ok);

    const balanceAfterReserve = ledger.getBalance(ctx, "var_pebbles_500g");
    assert.equal(balanceAfterReserve.reserved, 3);
    assert.equal(balanceAfterReserve.available, 117);

    const convert = ledger.convertReservationToSale(ctx, "cart_1", "ord_1");
    assert.ok(convert.ok);

    const balanceAfterSale = ledger.getBalance(ctx, "var_pebbles_500g");
    assert.equal(balanceAfterSale.onHand, 117);
    assert.equal(balanceAfterSale.reserved, 0);

    const expired = reservations.expireReservations(ctx);
    assert.equal(expired.expired, 0);
  });
});

describe("Procurement flow", () => {
  const ctx = { organizationId: "org_ambady_demo", userId: "user_owner_001", roleKey: "founder" };

  it("partial receipt keeps PO partially_received", () => {
    const repo = createTestRepo(createTestOperationsStore());
    const ledger = new StockLedgerService(repo);
    const poSvc = new PurchaseOrderService(repo);
    const grSvc = new GoodsReceiptService(repo, ledger, poSvc);

    const po = poSvc.create(ctx, {
      supplierId: "sup_pebble_co",
      lines: [{ variantId: "var_pebbles_500g", quantity: 100, unitCost: 85 }],
    });
    assert.ok(po.ok);
    poSvc.submit(ctx, po.data.id);
    poSvc.approve(ctx, po.data.id);

    const receipt = grSvc.receive(ctx, {
      purchaseOrderId: po.data.id,
      locationId: "loc_main_store",
      lines: [
        {
          purchaseOrderLineId: poSvc.getLines(po.data.id)[0]!.id,
          receivedQuantity: 60,
          acceptedQuantity: 60,
        },
      ],
    });
    assert.ok(receipt.ok);

    const updated = poSvc.getById(ctx, po.data.id);
    assert.ok(updated.ok);
    assert.equal(updated.data.status, "partially_received");

    const balance = ledger.getBalance(ctx, "var_pebbles_500g");
    assert.equal(balance.onHand, 180);
  });
});

describe("Transfer flow", () => {
  const ctx = { organizationId: "org_ambady_demo", userId: "user_owner_001" };

  it("moves stock between locations", () => {
    const repo = createTestRepo(createTestOperationsStore());
    const ledger = new StockLedgerService(repo);
    const transfers = new TransferService(repo, ledger);

    const created = transfers.create(ctx, {
      fromLocationId: "loc_main_store",
      toLocationId: "loc_warehouse",
      lines: [{ variantId: "var_pebbles_500g", quantity: 10 }],
    });
    assert.ok(created.ok);

    transfers.transition(ctx, created.data.id, "requested");
    transfers.transition(ctx, created.data.id, "approved");
    transfers.transition(ctx, created.data.id, "dispatched");
    transfers.transition(ctx, created.data.id, "in_transit");
    transfers.transition(ctx, created.data.id, "received");

    const mainBalance = ledger.getBalance(ctx, "var_pebbles_500g", "loc_main_store");
    const whBalance = ledger.getBalance(ctx, "var_pebbles_500g", "loc_warehouse");
    assert.equal(mainBalance.onHand, 110);
    assert.equal(whBalance.onHand, 10);
  });
});

describe("Returns and refunds", () => {
  const ctx = { organizationId: "org_ambady_demo", userId: "user_owner_001" };

  it("creates separate refund event", () => {
    const repo = createTestRepo(createTestOperationsStore());
    const ledger = new StockLedgerService(repo);
    const returns = new ReturnService(repo, ledger);
    const refunds = new RefundService(repo);

    const rr = returns.create(ctx, {
      orderId: "ord_1",
      reason: "damaged",
      lines: [{ variantId: "var_pebbles_500g", quantity: 1 }],
    });
    assert.ok(rr.ok);

    returns.transition(ctx, rr.data.id, "approved");
    returns.transition(ctx, rr.data.id, "received");

    const line = returns.getLines(rr.data.id)[0]!;
    returns.inspectLine(ctx, line.id, {
      disposition: "sellable",
      locationId: "loc_main_store",
    });

    const refund = refunds.create(ctx, {
      orderId: "ord_1",
      returnRequestId: rr.data.id,
      amount: 149,
    });
    assert.ok(refund.ok);
    refunds.approve(ctx, refund.data.id);
    const processed = refunds.process(ctx, refund.data.id, "rfnd_ref_1");
    assert.ok(processed.ok);
    assert.equal(processed.data.status, "processed");
  });
});

describe("LowStockService", () => {
  it("detects variants below reorder point", () => {
    const repo = createTestRepo(createTestOperationsStore());
    const ledger = new StockLedgerService(repo);
    const lowStock = new LowStockService(repo, ledger);
    const ctx = { organizationId: "org_ambady_demo" };

    ledger.recordMovement(ctx, {
      variantId: "var_pebbles_500g",
      locationId: "loc_main_store",
      quantityDelta: -105,
      movementType: "adjustment",
      reason: "Test depletion",
    });

    const items = lowStock.listLowStock(ctx);
    assert.ok(items.some((i) => i.variantId === "var_pebbles_500g"));
  });
});
