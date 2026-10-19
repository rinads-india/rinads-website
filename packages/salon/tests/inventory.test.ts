import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseTransferLines,
  quantityForBranch,
  quantityUniversal,
  stockStatus,
  suggestTransferRoute,
  type SalonProduct,
  type SalonStockLevel,
} from "../src/inventory";

const products: SalonProduct[] = [
  { id: "p1", organizationId: "o", name: "Shampoo", category: "retail", unit: "pcs", reorderAt: 8, isActive: true },
  { id: "p2", organizationId: "o", name: "Color", category: "backbar", unit: "pcs", reorderAt: 4, isActive: true },
];

const levels: SalonStockLevel[] = [
  { organizationId: "o", productId: "p1", branchId: "a", quantity: 20 },
  { organizationId: "o", productId: "p1", branchId: "b", quantity: 2 },
  { organizationId: "o", productId: "p2", branchId: "a", quantity: 1 },
  { organizationId: "o", productId: "p2", branchId: "b", quantity: 10 },
];

describe("salon inventory helpers", () => {
  it("classifies reorder status from live quantities", () => {
    assert.equal(stockStatus(0, 8), "out");
    assert.equal(stockStatus(1, 8), "critical");
    assert.equal(stockStatus(4, 8), "low");
    assert.equal(stockStatus(8, 8), "ok");
    assert.equal(stockStatus(3, 0), "ok");
  });

  it("sums per-store and universal quantities without demo fallbacks", () => {
    assert.equal(quantityForBranch(levels, "p1", "b"), 2);
    assert.equal(quantityUniversal(levels, "p1"), 22);
    assert.equal(quantityForBranch(levels, "p-missing", "a"), 0);
  });

  it("suggests a transfer route from surplus to the low store", () => {
    const route = suggestTransferRoute(products, levels, [{ id: "a" }, { id: "b" }], "b");
    assert.equal(route.toBranchId, "b");
    assert.equal(route.fromBranchId, "a");
    assert.equal(route.lowCount, 1);
  });

  it("parses transfer lines and drops non-positive quantities", () => {
    assert.deepEqual(
      parseTransferLines([
        { productId: "p1", quantity: 2 },
        { product_id: "p2", quantity: 0 },
        { productId: "p3", quantity: -1 },
      ]),
      [{ productId: "p1", quantity: 2 }]
    );
  });
});
