import type { OperationsRepository } from "../repository";
import { ok } from "../result";
import type {
  CustomerSegment,
  OperationalTask,
  OperationsContext,
  Result,
  TaskEntityType,
  TaskPriority,
  TaskStatus,
  WorkQueueItem,
} from "../types";
import { FulfilmentService } from "../fulfilment/fulfilment-service";
import { LowStockService } from "../inventory/inventory-service";
import { PurchaseOrderService } from "../procurement/procurement-service";
import { ReturnService } from "../returns/return-service";
import { ShipmentService } from "../shipping/shipment-service";

export class TaskService {
  constructor(private readonly repo: OperationsRepository) {}

  create(
    ctx: OperationsContext,
    input: {
      title: string;
      description?: string;
      assigneeId?: string;
      priority?: TaskPriority;
      dueAt?: string;
      entityType?: TaskEntityType;
      entityId?: string;
    }
  ): OperationalTask {
    const store = this.repo.getStore();
    const task: OperationalTask = {
      id: this.repo.nextId("task"),
      organizationId: ctx.organizationId,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      priority: input.priority ?? "normal",
      status: "todo",
      dueAt: input.dueAt,
      entityType: input.entityType,
      entityId: input.entityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.tasks.push(task);
    this.repo.saveStore(store);
    return task;
  }

  updateStatus(ctx: OperationsContext, taskId: string, status: TaskStatus): Result<OperationalTask> {
    const store = this.repo.getStore();
    const task = store.tasks.find(
      (t) => t.id === taskId && t.organizationId === ctx.organizationId
    );
    if (!task) return { ok: false, error: { code: "TASK_NOT_FOUND", message: "Task not found." } };
    task.status = status;
    task.updatedAt = new Date().toISOString();
    this.repo.saveStore(store);
    return ok(task);
  }

  list(ctx: OperationsContext, status?: TaskStatus): OperationalTask[] {
    return this.repo
      .getStore()
      .tasks.filter(
        (t) => t.organizationId === ctx.organizationId && (!status || t.status === status)
      )
      .sort((a, b) => (a.dueAt ?? a.createdAt).localeCompare(b.dueAt ?? b.createdAt));
  }
}

export class CrmOpsService {
  deriveSegments(input: {
    orderCount: number;
    totalSpent: number;
    lastOrderAt?: string;
    avgOrderValue: number;
  }): CustomerSegment[] {
    const segments: CustomerSegment[] = [];
    const now = Date.now();
    const lastOrderMs = input.lastOrderAt ? new Date(input.lastOrderAt).getTime() : 0;
    const daysSinceOrder = lastOrderMs ? (now - lastOrderMs) / (86400000) : 999;

    if (input.orderCount === 0) segments.push("new");
    else if (input.orderCount === 1) segments.push("new", "recent_buyer");
    else segments.push("repeat");

    if (input.totalSpent >= 10000) segments.push("high_value");
    if (daysSinceOrder > 90) segments.push("inactive");
    if (daysSinceOrder <= 30 && input.orderCount > 0) segments.push("recent_buyer");
    if (input.avgOrderValue >= 5000) segments.push("bulk_customer");

    return [...new Set(segments)];
  }
}

export class WorkQueueService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly fulfilment: FulfilmentService,
    private readonly returns: ReturnService,
    private readonly po: PurchaseOrderService,
    private readonly lowStock: LowStockService,
    private readonly shipments: ShipmentService
  ) {}

  buildQueue(ctx: OperationsContext): WorkQueueItem[] {
    const items: WorkQueueItem[] = [];
    const now = new Date().toISOString();

    for (const f of this.fulfilment.list(ctx).filter((x) => x.status === "pending")) {
      items.push({
        id: `wq_ful_${f.id}`,
        queueType: "order",
        title: `Fulfil order ${f.orderId}`,
        entityType: "fulfilment",
        entityId: f.id,
        priority: this.priorityScore(f.createdAt, 24),
        createdAt: f.createdAt,
      });
    }

    for (const f of this.fulfilment.list(ctx).filter((x) => ["pending", "picking"].includes(x.status))) {
      items.push({
        id: `wq_pick_${f.id}`,
        queueType: "pick",
        title: `Pick list for ${f.orderId}`,
        entityType: "fulfilment",
        entityId: f.id,
        priority: this.priorityScore(f.createdAt, 12),
        createdAt: f.createdAt,
      });
    }

    for (const f of this.fulfilment.list(ctx).filter((x) => x.status === "picked" || x.status === "packing")) {
      items.push({
        id: `wq_pack_${f.id}`,
        queueType: "pack",
        title: `Pack order ${f.orderId}`,
        entityType: "fulfilment",
        entityId: f.id,
        priority: this.priorityScore(f.createdAt, 8),
        createdAt: f.createdAt,
      });
    }

    for (const s of this.shipments.delayedShipments(ctx)) {
      items.push({
        id: `wq_shp_${s.id}`,
        queueType: "shipment",
        title: `Delayed shipment ${s.awb ?? s.id}`,
        entityType: "shipment",
        entityId: s.id,
        priority: 90,
        createdAt: s.createdAt,
      });
    }

    for (const r of this.returns.pendingReview(ctx)) {
      items.push({
        id: `wq_ret_${r.id}`,
        queueType: "return",
        title: `Review return ${r.id}`,
        entityType: "return_request",
        entityId: r.id,
        priority: this.priorityScore(r.createdAt, 48),
        createdAt: r.createdAt,
      });
    }

    for (const po of this.po.pendingApprovals(ctx)) {
      items.push({
        id: `wq_po_${po.id}`,
        queueType: "purchase_approval",
        title: `Approve PO ${po.poNumber}`,
        subtitle: `₹${po.grandTotal}`,
        entityType: "purchase_order",
        entityId: po.id,
        priority: 70,
        createdAt: po.createdAt,
      });
    }

    for (const ls of this.lowStock.listLowStock(ctx)) {
      items.push({
        id: `wq_ls_${ls.variantId}`,
        queueType: "low_stock",
        title: `Low stock: ${ls.sku}`,
        subtitle: ls.reason,
        entityType: "variant",
        entityId: ls.variantId,
        priority: 60,
        createdAt: now,
      });
    }

    return items.sort((a, b) => b.priority - a.priority);
  }

  /** Deterministic priority from age and SLA hours — higher = more urgent. */
  private priorityScore(createdAt: string, slaHours: number): number {
    const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    return Math.min(100, Math.round((ageHours / slaHours) * 50 + 10));
  }
}
