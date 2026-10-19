import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StockLedgerService } from "../src/index";
import type { OperationsRepository, OperationsStore } from "../src/repository";
import { createTestOperationsStore } from "./fixtures";

function createTestRepo(initial: OperationsStore): OperationsRepository {
  let store = structuredClone(initial);
  let id = 0;
  return {
    getStore: () => store,
    saveStore: (next) => {
      store = next;
    },
    nextId: (prefix) => `${prefix}_${++id}`,
    nextDocumentNumber: (_orgId, _docType, prefix) => `${prefix}-${++id}`,
  };
}

const ctx = { organizationId: "org_ambady_demo", userId: "user_owner_001" };

describe("canonical inventory truth", () => {
  it("ignores movements and reservations belonging to another organization", () => {
    const store = createTestOperationsStore();
    const future = new Date(Date.now() + 60_000).toISOString();

    store.movements.push({
      id: "foreign_movement",
      organizationId: "org_other",
      variantId: "var_pebbles_500g",
      locationId: "loc_main_store",
      quantityDelta: 900,
      movementType: "opening_balance",
      createdAt: new Date().toISOString(),
    });
    store.reservations.push({
      id: "foreign_reservation",
      organizationId: "org_other",
      variantId: "var_pebbles_500g",
      locationId: "loc_main_store",
      cartId: "foreign_cart",
      quantity: 90,
      status: "active",
      expiresAt: future,
      createdAt: new Date().toISOString(),
    });

    const ledger = new StockLedgerService(createTestRepo(store));
    const balance = ledger.getBalance(ctx, "var_pebbles_500g");

    assert.equal(balance.onHand, 120);
    assert.equal(balance.reserved, 0);
    assert.equal(balance.available, 120);
  });

  it("counts only active, unexpired reservations against availability", () => {
    const store = createTestOperationsStore();
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();

    store.reservations.push(
      {
        id: "active",
        organizationId: ctx.organizationId,
        variantId: "var_pebbles_500g",
        locationId: "loc_main_store",
        cartId: "cart_active",
        quantity: 5,
        status: "active",
        expiresAt: future,
        createdAt: now,
      },
      {
        id: "expired_by_time",
        organizationId: ctx.organizationId,
        variantId: "var_pebbles_500g",
        locationId: "loc_main_store",
        cartId: "cart_expired",
        quantity: 10,
        status: "active",
        expiresAt: past,
        createdAt: now,
      },
      {
        id: "released",
        organizationId: ctx.organizationId,
        variantId: "var_pebbles_500g",
        locationId: "loc_main_store",
        cartId: "cart_released",
        quantity: 15,
        status: "released",
        expiresAt: future,
        createdAt: now,
      },
    );

    const ledger = new StockLedgerService(createTestRepo(store));
    const balance = ledger.getBalance(ctx, "var_pebbles_500g");

    assert.equal(balance.reserved, 5);
    assert.equal(balance.available, 115);
  });

  it("does not leave a partial reservation when any requested variant is unavailable", () => {
    const repo = createTestRepo(createTestOperationsStore());
    const ledger = new StockLedgerService(repo);

    const result = ledger.reserveForCart(ctx, "cart_atomic", [
      { variantId: "var_pebbles_500g", quantity: 10 },
      { variantId: "var_pebbles_5kg", quantity: 1000 },
    ]);

    assert.equal(result.ok, false);
    assert.equal(
      repo.getStore().reservations.filter((reservation) => reservation.cartId === "cart_atomic").length,
      0,
    );
  });

  it("aggregates duplicate variant requests before checking availability", () => {
    const repo = createTestRepo(createTestOperationsStore());
    const ledger = new StockLedgerService(repo);

    const result = ledger.reserveForCart(ctx, "cart_duplicates", [
      { variantId: "var_pebbles_500g", quantity: 70 },
      { variantId: "var_pebbles_500g", quantity: 60 },
    ]);

    assert.equal(result.ok, false);
    assert.equal(
      repo.getStore().reservations.filter((reservation) => reservation.cartId === "cart_duplicates").length,
      0,
    );
  });
});
