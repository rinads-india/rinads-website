import type { OperationsRepository } from "../repository";
import { err, ok } from "../result";
import type {
  FulfilmentRecord,
  FulfilmentRecordStatus,
  OperationsContext,
  PackageRecord,
  PickList,
  PickListLine,
  Result,
} from "../types";
import { InventoryLocationService } from "../inventory/inventory-service";

export class FulfilmentService {
  private locations: InventoryLocationService;

  constructor(private readonly repo: OperationsRepository) {
    this.locations = new InventoryLocationService(repo);
  }

  createForOrder(
    ctx: OperationsContext,
    input: {
      orderId: string;
      lines: {
        orderLineId?: string;
        variantId: string;
        sku: string;
        productName: string;
        variantName: string;
        quantity: number;
      }[];
    }
  ): Result<FulfilmentRecord> {
    const store = this.repo.getStore();
    const existing = store.fulfilments.find(
      (f) => f.orderId === input.orderId && f.organizationId === ctx.organizationId
    );
    if (existing) return ok(existing);

    const defaultLoc = this.locations.getDefault(ctx);
    if (!defaultLoc) return err("NO_DEFAULT_LOCATION", "No default inventory location.");

    const fulfilment: FulfilmentRecord = {
      id: this.repo.nextId("ful"),
      organizationId: ctx.organizationId,
      orderId: input.orderId,
      status: "pending",
      locationId: defaultLoc.id,
      createdAt: new Date().toISOString(),
    };
    store.fulfilments.push(fulfilment);

    const pickList: PickList = {
      id: this.repo.nextId("pick"),
      organizationId: ctx.organizationId,
      fulfilmentId: fulfilment.id,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    store.pickLists.push(pickList);

    const grouped = new Map<string, PickListLine>();
    for (const line of input.lines) {
      const key = `${line.variantId}:${defaultLoc.id}`;
      const existingLine = grouped.get(key);
      if (existingLine) {
        existingLine.quantity += line.quantity;
      } else {
        grouped.set(key, {
          id: this.repo.nextId("pln"),
          pickListId: pickList.id,
          orderLineId: line.orderLineId,
          variantId: line.variantId,
          sku: line.sku,
          productName: line.productName,
          variantName: line.variantName,
          locationId: defaultLoc.id,
          quantity: line.quantity,
          quantityPicked: 0,
        });
      }
    }
    store.pickListLines.push(...grouped.values());
    this.repo.saveStore(store);
    return ok(fulfilment);
  }

  list(ctx: OperationsContext, status?: FulfilmentRecordStatus): FulfilmentRecord[] {
    return this.repo
      .getStore()
      .fulfilments.filter(
        (f) =>
          f.organizationId === ctx.organizationId && (!status || f.status === status)
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getPickList(fulfilmentId: string): PickList | undefined {
    return this.repo.getStore().pickLists.find((p) => p.fulfilmentId === fulfilmentId);
  }

  getPickLines(pickListId: string): PickListLine[] {
    return this.repo.getStore().pickListLines.filter((l) => l.pickListId === pickListId);
  }

  recordPick(ctx: OperationsContext, pickListId: string, lineId: string, quantity: number): Result<PickListLine> {
    const store = this.repo.getStore();
    const line = store.pickListLines.find((l) => l.id === lineId && l.pickListId === pickListId);
    if (!line) return err("PICK_LINE_NOT_FOUND", "Pick line not found.");
    line.quantityPicked = Math.min(line.quantity, line.quantityPicked + quantity);

    const pickList = store.pickLists.find((p) => p.id === pickListId);
    const fulfilment = pickList
      ? store.fulfilments.find((f) => f.id === pickList.fulfilmentId)
      : undefined;
    if (fulfilment) {
      fulfilment.status = "picking";
      const lines = this.getPickLines(pickListId);
      if (lines.every((l) => l.quantityPicked >= l.quantity)) {
        fulfilment.status = "picked";
        if (pickList) pickList.status = "completed";
      }
    }
    this.repo.saveStore(store);
    return ok(line);
  }

  startPacking(ctx: OperationsContext, fulfilmentId: string): Result<FulfilmentRecord> {
    const store = this.repo.getStore();
    const f = store.fulfilments.find(
      (x) => x.id === fulfilmentId && x.organizationId === ctx.organizationId
    );
    if (!f) return err("FULFILMENT_NOT_FOUND", "Fulfilment not found.");
    f.status = "packing";
    this.repo.saveStore(store);
    return ok(f);
  }

  pack(
    ctx: OperationsContext,
    input: {
      fulfilmentId: string;
      orderId: string;
      weightGrams?: number;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
      packageType?: string;
      packingNotes?: string;
    }
  ): Result<PackageRecord> {
    const store = this.repo.getStore();
    const fulfilment = store.fulfilments.find(
      (f) => f.id === input.fulfilmentId && f.organizationId === ctx.organizationId
    );
    if (!fulfilment) return err("FULFILMENT_NOT_FOUND", "Fulfilment not found.");

    const pkg: PackageRecord = {
      id: this.repo.nextId("pkg"),
      organizationId: ctx.organizationId,
      orderId: input.orderId,
      fulfilmentId: input.fulfilmentId,
      packageType: input.packageType,
      weightGrams: input.weightGrams,
      lengthCm: input.lengthCm,
      widthCm: input.widthCm,
      heightCm: input.heightCm,
      packedBy: ctx.userId,
      packingNotes: input.packingNotes,
      createdAt: new Date().toISOString(),
    };
    store.packages.push(pkg);
    fulfilment.status = "packed";
    this.repo.saveStore(store);
    return ok(pkg);
  }

  complete(ctx: OperationsContext, fulfilmentId: string): Result<FulfilmentRecord> {
    const store = this.repo.getStore();
    const f = store.fulfilments.find(
      (x) => x.id === fulfilmentId && x.organizationId === ctx.organizationId
    );
    if (!f) return err("FULFILMENT_NOT_FOUND", "Fulfilment not found.");
    f.status = "completed";
    f.completedAt = new Date().toISOString();
    this.repo.saveStore(store);
    return ok(f);
  }

  pendingCount(ctx: OperationsContext): number {
    return this.list(ctx).filter((f) => !["completed", "cancelled"].includes(f.status)).length;
  }
}
