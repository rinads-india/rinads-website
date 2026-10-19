import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SalonRepository } from "../src/repository";
import { createSalonMockClient } from "./mock-client";

const ORG = "org_inv";

describe("SalonRepository — inventory", () => {
  it("adjusts per-branch stock and refuses to go negative", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const a = await repo.createBranch(ORG, { name: "Kozhikode" });
    const product = await repo.createProduct(ORG, { name: "Keratin", category: "backbar", reorderAt: 4 });
    assert.ok(a.ok && product.ok);
    if (!a.ok || !product.ok) return;

    const added = await repo.adjustStock(ORG, {
      branchId: a.data.id,
      productId: product.data.id,
      delta: 6,
      reason: "opening",
    });
    assert.ok(added.ok);
    if (added.ok) assert.equal(added.data.quantity, 6);

    const overdraw = await repo.adjustStock(ORG, {
      branchId: a.data.id,
      productId: product.data.id,
      delta: -9,
    });
    assert.ok(!overdraw.ok);
  });

  it("transfers stock between branches idempotently", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const from = await repo.createBranch(ORG, { name: "Kozhikode" });
    const to = await repo.createBranch(ORG, { name: "Thrissur" });
    const product = await repo.createProduct(ORG, { name: "Shampoo", reorderAt: 8 });
    assert.ok(from.ok && to.ok && product.ok);
    if (!from.ok || !to.ok || !product.ok) return;

    await repo.adjustStock(ORG, { branchId: from.data.id, productId: product.data.id, delta: 10, reason: "opening" });
    const first = await repo.transferStock(ORG, {
      fromBranchId: from.data.id,
      toBranchId: to.data.id,
      lines: [{ productId: product.data.id, quantity: 3 }],
      idempotencyKey: "xfer-1",
    });
    const replay = await repo.transferStock(ORG, {
      fromBranchId: from.data.id,
      toBranchId: to.data.id,
      lines: [{ productId: product.data.id, quantity: 3 }],
      idempotencyKey: "xfer-1",
    });
    assert.ok(first.ok && replay.ok);
    if (first.ok && replay.ok) {
      assert.equal(first.data.id, replay.data.id);
      assert.equal(replay.data.idempotentReplay, true);
    }

    const levels = await repo.listStockLevels(ORG);
    assert.ok(levels.ok);
    if (!levels.ok) return;
    assert.equal(levels.data.find((row) => row.branchId === from.data.id)?.quantity, 7);
    assert.equal(levels.data.find((row) => row.branchId === to.data.id)?.quantity, 3);
  });
});
