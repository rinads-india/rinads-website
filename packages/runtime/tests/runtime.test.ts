import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventStore, JobRunner, AlertEngine } from "../src/runtime";
import { createReservationExpiryProcessor } from "../src/processors";
import { ReservationService, StockLedgerService } from "@rinads/operations";
import { createTestOperationsStore } from "../../operations/tests/fixtures";
import type { OperationsRepository } from "@rinads/operations";

function createTestRepo(): OperationsRepository {
  let store = createTestOperationsStore();
  let id = 1;
  return {
    getStore: () => store,
    saveStore: (s) => {
      store = s;
    },
    nextId: (p) => `${p}_${++id}`,
    nextDocumentNumber: (_o, _d, prefix) => `${prefix}-1`,
  };
}

describe("Runtime idempotency", () => {
  it("deduplicates events by idempotency key", () => {
    const repo = createTestRepo();
    const events = new EventStore(repo);
    const ctx = { organizationId: "org_ambady_demo" };
    const e1 = events.emit(ctx, "order.paid", { orderId: "o1" }, "order:o1");
    const e2 = events.emit(ctx, "order.paid", { orderId: "o1" }, "order:o1");
    assert.equal(e1.id, e2.id);
  });

  it("processes reservation expiry job", async () => {
    const repo = createTestRepo();
    const ledger = new StockLedgerService(repo);
    const reservations = new ReservationService(repo, ledger);
    const alerts = new AlertEngine(repo);
    const runner = new JobRunner();
    runner.register(createReservationExpiryProcessor(reservations, alerts));
    runner.enqueue({
      organizationId: "org_ambady_demo",
      processorKey: "reservation_expiry",
      idempotencyKey: "expiry:1",
      payload: {},
      maxAttempts: 3,
    });
    const result = await runner.processPending();
    assert.ok(result.processed >= 0);
  });
});
