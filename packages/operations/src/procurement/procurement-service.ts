import type { OperationsRepository } from "../repository";
import { err, ok, roundMoney } from "../result";
import type {
  GoodsReceipt,
  OperationsContext,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  Result,
  Supplier,
  SupplierProduct,
} from "../types";
import { StockLedgerService } from "../inventory/inventory-service";

export class SupplierService {
  constructor(private readonly repo: OperationsRepository) {}

  list(ctx: OperationsContext): Supplier[] {
    return this.repo
      .getStore()
      .suppliers.filter((s) => s.organizationId === ctx.organizationId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getById(ctx: OperationsContext, id: string): Result<Supplier> {
    const s = this.list(ctx).find((x) => x.id === id);
    if (!s) return err("SUPPLIER_NOT_FOUND", "Supplier not found.");
    return ok(s);
  }

  upsert(
    ctx: OperationsContext,
    input: Omit<Supplier, "id" | "organizationId" | "createdAt"> & { id?: string }
  ): Supplier {
    const store = this.repo.getStore();
    if (input.id) {
      const idx = store.suppliers.findIndex(
        (s) => s.id === input.id && s.organizationId === ctx.organizationId
      );
      if (idx >= 0) {
        store.suppliers[idx] = { ...store.suppliers[idx], ...input };
        this.repo.saveStore(store);
        return store.suppliers[idx];
      }
    }
    const supplier: Supplier = {
      id: this.repo.nextId("sup"),
      organizationId: ctx.organizationId,
      createdAt: new Date().toISOString(),
      ...input,
    };
    store.suppliers.push(supplier);
    this.repo.saveStore(store);
    return supplier;
  }

  listProducts(ctx: OperationsContext, supplierId?: string): SupplierProduct[] {
    return this.repo
      .getStore()
      .supplierProducts.filter(
        (p) =>
          p.organizationId === ctx.organizationId && (!supplierId || p.supplierId === supplierId)
      );
  }

  linkProduct(ctx: OperationsContext, input: Omit<SupplierProduct, "id" | "organizationId">): SupplierProduct {
    const store = this.repo.getStore();
    const sp: SupplierProduct = {
      id: this.repo.nextId("sp"),
      organizationId: ctx.organizationId,
      ...input,
    };
    store.supplierProducts.push(sp);
    this.repo.saveStore(store);
    return sp;
  }
}

export class PurchaseOrderService {
  constructor(private readonly repo: OperationsRepository) {}

  list(ctx: OperationsContext): PurchaseOrder[] {
    return this.repo
      .getStore()
      .purchaseOrders.filter((p) => p.organizationId === ctx.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(ctx: OperationsContext, id: string): Result<PurchaseOrder> {
    const po = this.list(ctx).find((p) => p.id === id);
    if (!po) return err("PO_NOT_FOUND", "Purchase order not found.");
    return ok(po);
  }

  getLines(purchaseOrderId: string): PurchaseOrderLine[] {
    return this.repo.getStore().purchaseOrderLines.filter((l) => l.purchaseOrderId === purchaseOrderId);
  }

  create(
    ctx: OperationsContext,
    input: {
      supplierId: string;
      lines: {
        variantId: string;
        quantity: number;
        unitCost: number;
        taxAmount?: number;
        discountAmount?: number;
        expectedDate?: string;
      }[];
      freightCost?: number;
      notes?: string;
    }
  ): Result<PurchaseOrder> {
    const store = this.repo.getStore();
    const supplier = store.suppliers.find(
      (s) => s.id === input.supplierId && s.organizationId === ctx.organizationId
    );
    if (!supplier) return err("SUPPLIER_NOT_FOUND", "Supplier not found.");

    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    const poId = this.repo.nextId("po");
    const lines: PurchaseOrderLine[] = [];

    for (const line of input.lines) {
      const lineSub = line.unitCost * line.quantity;
      const tax = line.taxAmount ?? 0;
      const disc = line.discountAmount ?? 0;
      subtotal += lineSub;
      taxTotal += tax;
      discountTotal += disc;
      lines.push({
        id: this.repo.nextId("pol"),
        purchaseOrderId: poId,
        variantId: line.variantId,
        quantity: line.quantity,
        quantityReceived: 0,
        unitCost: line.unitCost,
        taxAmount: tax,
        discountAmount: disc,
        expectedDate: line.expectedDate,
      });
    }

    const freight = input.freightCost ?? 0;
    const po: PurchaseOrder = {
      id: poId,
      organizationId: ctx.organizationId,
      poNumber: this.repo.nextDocumentNumber(ctx.organizationId, "purchase_order", "PO"),
      supplierId: input.supplierId,
      status: "draft",
      subtotal: roundMoney(subtotal),
      taxTotal: roundMoney(taxTotal),
      freightCost: roundMoney(freight),
      discountTotal: roundMoney(discountTotal),
      grandTotal: roundMoney(subtotal + taxTotal + freight - discountTotal),
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.purchaseOrders.push(po);
    store.purchaseOrderLines.push(...lines);
    this.repo.saveStore(store);
    return ok(po);
  }

  submit(ctx: OperationsContext, poId: string): Result<PurchaseOrder> {
    return this.transition(ctx, poId, "submitted");
  }

  approve(ctx: OperationsContext, poId: string): Result<PurchaseOrder> {
    const store = this.repo.getStore();
    const po = store.purchaseOrders.find(
      (p) => p.id === poId && p.organizationId === ctx.organizationId
    );
    if (!po) return err("PO_NOT_FOUND", "Purchase order not found.");

    const rule = store.purchaseApprovalRules.find(
      (r) => r.organizationId === ctx.organizationId && r.isActive
    );
    if (rule && po.grandTotal > rule.requiresOwnerAbove) {
      const role = ctx.roleKey ?? "staff";
      if (role !== "founder" && role !== "admin") {
        return err("APPROVAL_REQUIRED", "Owner approval required for this purchase amount.");
      }
    }

    po.approvedBy = ctx.userId;
    return this.transition(ctx, poId, "approved");
  }

  transition(ctx: OperationsContext, poId: string, status: PurchaseOrderStatus): Result<PurchaseOrder> {
    const store = this.repo.getStore();
    const po = store.purchaseOrders.find(
      (p) => p.id === poId && p.organizationId === ctx.organizationId
    );
    if (!po) return err("PO_NOT_FOUND", "Purchase order not found.");
    po.status = status;
    po.updatedAt = new Date().toISOString();
    this.repo.saveStore(store);
    return ok(po);
  }

  pendingApprovals(ctx: OperationsContext): PurchaseOrder[] {
    return this.list(ctx).filter((p) => p.status === "submitted");
  }
}

export class GoodsReceiptService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly ledger: StockLedgerService,
    private readonly poService: PurchaseOrderService
  ) {}

  receive(
    ctx: OperationsContext,
    input: {
      purchaseOrderId: string;
      locationId: string;
      lines: {
        purchaseOrderLineId: string;
        receivedQuantity: number;
        acceptedQuantity: number;
        damagedQuantity?: number;
        batchReference?: string;
      }[];
      inspectionNotes?: string;
    }
  ): Result<GoodsReceipt> {
    const store = this.repo.getStore();
    const poResult = this.poService.getById(ctx, input.purchaseOrderId);
    if (!poResult.ok) return poResult;
    const po = poResult.data;

    const receipt: GoodsReceipt = {
      id: this.repo.nextId("gr"),
      organizationId: ctx.organizationId,
      receiptNumber: this.repo.nextDocumentNumber(ctx.organizationId, "goods_receipt", "GR"),
      purchaseOrderId: input.purchaseOrderId,
      locationId: input.locationId,
      receivedBy: ctx.userId,
      inspectionNotes: input.inspectionNotes,
      createdAt: new Date().toISOString(),
    };
    store.goodsReceipts.push(receipt);

    for (const line of input.lines) {
      const poLine = store.purchaseOrderLines.find((l) => l.id === line.purchaseOrderLineId);
      if (!poLine) return err("PO_LINE_NOT_FOUND", "Purchase order line not found.");

      const shortQty = Math.max(0, line.receivedQuantity - line.acceptedQuantity - (line.damagedQuantity ?? 0));
      store.goodsReceiptLines.push({
        id: this.repo.nextId("grl"),
        goodsReceiptId: receipt.id,
        purchaseOrderLineId: line.purchaseOrderLineId,
        variantId: poLine.variantId,
        receivedQuantity: line.receivedQuantity,
        acceptedQuantity: line.acceptedQuantity,
        damagedQuantity: line.damagedQuantity ?? 0,
        shortQuantity: shortQty,
        batchReference: line.batchReference,
      });

      if (line.acceptedQuantity > 0) {
        const mov = this.ledger.recordMovement(ctx, {
          variantId: poLine.variantId,
          locationId: input.locationId,
          quantityDelta: line.acceptedQuantity,
          movementType: "purchase",
          referenceType: "goods_receipt",
          referenceId: receipt.id,
        });
        if (!mov.ok) return mov;
      }

      if ((line.damagedQuantity ?? 0) > 0) {
        this.ledger.recordMovement(ctx, {
          variantId: poLine.variantId,
          locationId: input.locationId,
          quantityDelta: -(line.damagedQuantity ?? 0),
          movementType: "damage",
          referenceType: "goods_receipt",
          referenceId: receipt.id,
          reason: "Damaged on receipt",
        });
      }

      poLine.quantityReceived += line.acceptedQuantity;
    }

    const allLines = this.poService.getLines(po.id);
    const fullyReceived = allLines.every((l) => l.quantityReceived >= l.quantity);
    const anyReceived = allLines.some((l) => l.quantityReceived > 0);
    po.status = fullyReceived ? "received" : anyReceived ? "partially_received" : po.status;
    po.updatedAt = new Date().toISOString();
    this.repo.saveStore(store);
    return ok(receipt);
  }

  list(ctx: OperationsContext): GoodsReceipt[] {
    return this.repo
      .getStore()
      .goodsReceipts.filter((g) => g.organizationId === ctx.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
