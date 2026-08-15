import type { OperationsRepository } from "../repository";
import { err, ok, roundMoney } from "../result";
import type {
  ErpSearchResult,
  Expense,
  ExpenseCategory,
  KpiSnapshot,
  OperationsContext,
  PriceHistoryEntry,
  Result,
} from "../types";
import { FulfilmentService } from "../fulfilment/fulfilment-service";
import { LowStockService, StockLedgerService } from "../inventory/inventory-service";
import { PurchaseOrderService, SupplierService } from "../procurement/procurement-service";
import { RefundService } from "../returns/return-service";

export class PricingService {
  constructor(private readonly repo: OperationsRepository) {}

  recordPriceChange(
    ctx: OperationsContext,
    input: {
      variantId: string;
      oldPrice: number;
      newPrice: number;
      oldCost?: number;
      newCost?: number;
      reason?: string;
    }
  ): PriceHistoryEntry {
    const store = this.repo.getStore();
    const entry: PriceHistoryEntry = {
      id: this.repo.nextId("ph"),
      organizationId: ctx.organizationId,
      variantId: input.variantId,
      oldPrice: input.oldPrice,
      newPrice: input.newPrice,
      oldCost: input.oldCost,
      newCost: input.newCost,
      effectiveAt: new Date().toISOString(),
      operatorId: ctx.userId,
      reason: input.reason,
    };
    store.priceHistory.push(entry);
    this.repo.saveStore(store);
    return entry;
  }

  getHistory(ctx: OperationsContext, variantId: string): PriceHistoryEntry[] {
    return this.repo
      .getStore()
      .priceHistory.filter(
        (p) => p.organizationId === ctx.organizationId && p.variantId === variantId
      )
      .sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt));
  }

  margin(revenue: number, cost?: number): { revenue: number; cost?: number; grossMargin?: number; marginPercent?: number } {
    if (cost === undefined) return { revenue };
    const grossMargin = roundMoney(revenue - cost);
    const marginPercent = revenue > 0 ? roundMoney((grossMargin / revenue) * 100) : 0;
    return { revenue, cost, grossMargin, marginPercent };
  }
}

export class ExpenseService {
  constructor(private readonly repo: OperationsRepository) {}

  listCategories(ctx: OperationsContext): ExpenseCategory[] {
    return this.repo
      .getStore()
      .expenseCategories.filter((c) => c.organizationId === ctx.organizationId && c.isActive);
  }

  createExpense(
    ctx: OperationsContext,
    input: Omit<Expense, "id" | "organizationId" | "createdAt">
  ): Expense {
    const store = this.repo.getStore();
    const expense: Expense = {
      id: this.repo.nextId("exp"),
      organizationId: ctx.organizationId,
      createdAt: new Date().toISOString(),
      ...input,
    };
    store.expenses.push(expense);
    this.repo.saveStore(store);
    return expense;
  }

  list(ctx: OperationsContext): Expense[] {
    return this.repo
      .getStore()
      .expenses.filter((e) => e.organizationId === ctx.organizationId)
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  }
}

export class DocumentService {
  constructor(private readonly repo: OperationsRepository) {}

  nextNumber(orgId: string, documentType: string, prefix: string): string {
    return this.repo.nextDocumentNumber(orgId, documentType, prefix);
  }
}

export class SearchService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly suppliers: SupplierService,
    private readonly po: PurchaseOrderService
  ) {}

  search(ctx: OperationsContext, query: string, allowedTypes?: string[]): ErpSearchResult[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: ErpSearchResult[] = [];
    const types = allowedTypes ?? ["supplier", "purchase_order", "shipment", "return", "task"];

    if (types.includes("supplier")) {
      for (const s of this.suppliers.list(ctx)) {
        if (s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)) {
          results.push({
            type: "supplier",
            id: s.id,
            title: s.name,
            subtitle: s.email,
            href: `/procurement/suppliers`,
          });
        }
      }
    }

    if (types.includes("purchase_order")) {
      for (const p of this.po.list(ctx)) {
        if (p.poNumber.toLowerCase().includes(q)) {
          results.push({
            type: "purchase_order",
            id: p.id,
            title: p.poNumber,
            subtitle: p.status,
            href: `/procurement/purchase-orders/${p.id}`,
          });
        }
      }
    }

    const store = this.repo.getStore();
    if (types.includes("task")) {
      for (const t of store.tasks.filter((x) => x.organizationId === ctx.organizationId)) {
        if (t.title.toLowerCase().includes(q)) {
          results.push({ type: "task", id: t.id, title: t.title, href: `/tasks` });
        }
      }
    }

    return results.slice(0, 20);
  }
}

export class KpiService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly ledger: StockLedgerService,
    private readonly lowStock: LowStockService,
    private readonly fulfilment: FulfilmentService,
    private readonly po: PurchaseOrderService,
    private readonly refunds: RefundService
  ) {}

  snapshot(
    ctx: OperationsContext,
    orders: { grandTotal: number; discountTotal: number; lines: { quantity: number; unitPrice: number }[] }[]
  ): KpiSnapshot {
    const grossSales = orders.reduce((s, o) => s + o.grandTotal + o.discountTotal, 0);
    const netSales = orders.reduce((s, o) => s + o.grandTotal, 0);
    const unitsSold = orders.reduce(
      (s, o) => s + o.lines.reduce((ls, l) => ls + l.quantity, 0),
      0
    );

    let inventoryValue = 0;
    for (const profile of this.repo.getStore().variantProfiles.filter(
      (p) => p.organizationId === ctx.organizationId
    )) {
      const balance = this.ledger.getBalance(ctx, profile.variantId);
      if (profile.costPrice !== undefined) {
        inventoryValue += balance.onHand * profile.costPrice;
      }
    }

    const pendingPO = this.po
      .list(ctx)
      .filter((p) => ["submitted", "approved", "ordered", "partially_received"].includes(p.status))
      .reduce((s, p) => s + p.grandTotal, 0);

    return {
      grossSales: roundMoney(grossSales),
      netSales: roundMoney(netSales),
      orderCount: orders.length,
      averageOrderValue: orders.length ? roundMoney(netSales / orders.length) : 0,
      unitsSold,
      inventoryValue: roundMoney(inventoryValue),
      lowStockCount: this.lowStock.listLowStock(ctx).length,
      pendingFulfilment: this.fulfilment.pendingCount(ctx),
      purchaseValuePending: roundMoney(pendingPO),
      returnCount: this.repo.getStore().returnRequests.filter((r) => r.organizationId === ctx.organizationId).length,
      refundTotal: this.refunds.totalRefunded(ctx),
    };
  }

  reorderRecommendations(ctx: OperationsContext) {
    return this.lowStock.listLowStock(ctx);
  }
}

export class AuditService {
  constructor(private readonly repo: OperationsRepository) {}

  log(
    ctx: OperationsContext,
    input: {
      action: string;
      entity: string;
      entityId: string;
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
      source?: string;
      reason?: string;
      actorType?: "user" | "ai" | "system";
    }
  ): void {
    const store = this.repo.getStore();
    store.auditLogs.push({
      id: this.repo.nextId("aud"),
      organizationId: ctx.organizationId,
      actorType: input.actorType ?? (ctx.userId ? "user" : "system"),
      actorId: ctx.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before: input.before,
      after: input.after,
      source: input.source,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    });
    this.repo.saveStore(store);
  }

  list(ctx: OperationsContext, entity?: string, entityId?: string) {
    return this.repo
      .getStore()
      .auditLogs.filter(
        (a) =>
          a.organizationId === ctx.organizationId &&
          (!entity || a.entity === entity) &&
          (!entityId || a.entityId === entityId)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export class BarcodeService {
  resolveVariantByBarcode(
    ctx: OperationsContext,
    barcode: string,
    profiles: import("../types").VariantOpsProfile[]
  ): Result<string> {
    const profile = profiles.find(
      (p) => p.organizationId === ctx.organizationId && p.barcode === barcode
    );
    if (!profile) return err("BARCODE_NOT_FOUND", "No variant matches this barcode.");
    return ok(profile.variantId);
  }
}
