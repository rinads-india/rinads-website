export type StockStatus = "ok" | "low" | "critical" | "out";

export type SalonProduct = {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  sku?: string;
  unit: string;
  reorderAt: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SalonStockLevel = {
  organizationId: string;
  productId: string;
  branchId: string;
  quantity: number;
  updatedAt?: string;
};

export type StockMovementReason = "opening" | "adjustment" | "transfer_out" | "transfer_in";

export type SalonStockMovement = {
  id: string;
  organizationId: string;
  productId: string;
  branchId: string;
  quantityDelta: number;
  reason: StockMovementReason;
  transferId?: string;
  note?: string;
  createdBy?: string;
  createdAt?: string;
};

export type StockTransferStatus = "completed" | "cancelled";

export type SalonStockTransfer = {
  id: string;
  organizationId: string;
  fromBranchId: string;
  toBranchId: string;
  status: StockTransferStatus;
  idempotencyKey: string;
  createdBy?: string;
  createdAt?: string;
  completedAt?: string;
  lines: { productId: string; quantity: number }[];
};

export type TransferLineInput = { productId: string; quantity: number };

export function stockStatus(quantity: number, reorderAt: number): StockStatus {
  if (quantity <= 0) return "out";
  if (reorderAt > 0 && quantity <= reorderAt * 0.25) return "critical";
  if (reorderAt > 0 && quantity < reorderAt) return "low";
  return "ok";
}

export function stockStatusLabel(status: StockStatus): string {
  if (status === "out") return "Out";
  if (status === "critical") return "Critical";
  if (status === "low") return "Low";
  return "OK";
}

export function quantityForBranch(
  levels: SalonStockLevel[],
  productId: string,
  branchId: string
): number {
  return levels.find((level) => level.productId === productId && level.branchId === branchId)?.quantity ?? 0;
}

export function quantityUniversal(levels: SalonStockLevel[], productId: string): number {
  return levels.filter((level) => level.productId === productId).reduce((sum, level) => sum + level.quantity, 0);
}

/** Prefers a source branch that has surplus for items the destination is below reorder on. */
export function suggestTransferRoute(
  products: SalonProduct[],
  levels: SalonStockLevel[],
  branches: { id: string }[],
  preferredToBranchId?: string
): { fromBranchId?: string; toBranchId?: string; lowCount: number } {
  const toBranchId =
    preferredToBranchId && branches.some((branch) => branch.id === preferredToBranchId)
      ? preferredToBranchId
      : branches[0]?.id;
  if (!toBranchId) return { lowCount: 0 };

  const lowProducts = products.filter((product) => {
    const qty = quantityForBranch(levels, product.id, toBranchId);
    return stockStatus(qty, product.reorderAt) !== "ok";
  });

  let bestFrom: string | undefined;
  let bestScore = 0;
  for (const branch of branches) {
    if (branch.id === toBranchId) continue;
    const score = lowProducts.reduce((sum, product) => {
      const sourceQty = quantityForBranch(levels, product.id, branch.id);
      const destQty = quantityForBranch(levels, product.id, toBranchId);
      const deficit = Math.max(0, product.reorderAt - destQty);
      return sum + Math.min(sourceQty, deficit);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestFrom = branch.id;
    }
  }

  return { fromBranchId: bestFrom ?? branches.find((branch) => branch.id !== toBranchId)?.id, toBranchId, lowCount: lowProducts.length };
}

export function parseTransferLines(raw: unknown): TransferLineInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const productId = String(row.productId ?? row.product_id ?? "");
      const quantity = Number(row.quantity ?? 0);
      return { productId, quantity };
    })
    .filter((line) => line.productId && Number.isFinite(line.quantity) && line.quantity > 0);
}
