import type { OperationsRepository } from "../repository";
import { err, ok } from "../result";
import type {
  InventoryLocation,
  OperationsContext,
  Result,
  StockBalance,
  StockMovement,
  StockMovementType,
  VariantOpsProfile,
} from "../types";
import { computeAvailable, computeOnHand, computeReserved, deriveStockStatus } from "./stock";
import type { InventoryPort } from "../port";

export class InventoryLocationService {
  constructor(private readonly repo: OperationsRepository) {}

  list(ctx: OperationsContext): InventoryLocation[] {
    return this.repo
      .getStore()
      .locations.filter((l) => l.organizationId === ctx.organizationId && l.status === "active");
  }

  getDefault(ctx: OperationsContext): InventoryLocation | undefined {
    return this.list(ctx).find((l) => l.isDefault);
  }

  getById(ctx: OperationsContext, locationId: string): InventoryLocation | undefined {
    return this.list(ctx).find((l) => l.id === locationId);
  }
}

export class StockLedgerService implements InventoryPort {
  private locations: InventoryLocationService;

  constructor(private readonly repo: OperationsRepository) {
    this.locations = new InventoryLocationService(repo);
  }

  recordMovement(
    ctx: OperationsContext,
    input: {
      variantId: string;
      locationId: string;
      quantityDelta: number;
      movementType: StockMovementType;
      referenceType?: string;
      referenceId?: string;
      reason?: string;
    }
  ): Result<StockMovement> {
    const store = this.repo.getStore();
    const location = store.locations.find(
      (l) => l.id === input.locationId && l.organizationId === ctx.organizationId
    );
    if (!location) return err("LOCATION_NOT_FOUND", "Inventory location not found.");

    const profile = store.variantProfiles.find(
      (p) => p.variantId === input.variantId && p.organizationId === ctx.organizationId
    );
    if (profile && !profile.stockTracking) {
      return err("STOCK_NOT_TRACKED", "Stock tracking disabled for this variant.");
    }

    const movement: StockMovement = {
      id: this.repo.nextId("mov"),
      organizationId: ctx.organizationId,
      variantId: input.variantId,
      locationId: input.locationId,
      quantityDelta: input.quantityDelta,
      movementType: input.movementType,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      reason: input.reason,
      performedBy: ctx.userId,
      createdAt: new Date().toISOString(),
    };

    if (input.quantityDelta < 0) {
      const balance = this.getBalance(ctx, input.variantId, input.locationId);
      if (balance.onHand + input.quantityDelta < 0) {
        return err("INSUFFICIENT_STOCK", "Insufficient on-hand stock for this movement.");
      }
    }

    store.movements.push(movement);
    this.repo.saveStore(store);
    return ok(movement);
  }

  listMovements(ctx: OperationsContext, variantId?: string, locationId?: string): StockMovement[] {
    return this.repo
      .getStore()
      .movements.filter(
        (m) =>
          m.organizationId === ctx.organizationId &&
          (!variantId || m.variantId === variantId) &&
          (!locationId || m.locationId === locationId)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getBalance(ctx: OperationsContext, variantId: string, locationId?: string): StockBalance {
    const store = this.repo.getStore();
    const locId = locationId ?? this.locations.getDefault(ctx)?.id ?? "";
    const onHand = computeOnHand(store.movements, variantId, locId);
    const reserved = computeReserved(store.reservations, variantId, locId);
    const damaged = computeOnHand(
      store.movements.filter((m) => m.movementType === "damage"),
      variantId,
      locId
    );
    const incoming = store.purchaseOrderLines
      .filter((l) => {
        const po = store.purchaseOrders.find((p) => p.id === l.purchaseOrderId);
        return (
          l.variantId === variantId &&
          po &&
          po.organizationId === ctx.organizationId &&
          ["approved", "ordered", "partially_received"].includes(po.status)
        );
      })
      .reduce((sum, l) => sum + (l.quantity - l.quantityReceived), 0);

    return {
      variantId,
      locationId: locId,
      onHand,
      reserved,
      available: computeAvailable(onHand, reserved),
      incoming,
      damaged: Math.abs(damaged),
    };
  }

  getAvailable(ctx: OperationsContext, variantId: string): number {
    const profile = this.repo
      .getStore()
      .variantProfiles.find(
        (p) => p.variantId === variantId && p.organizationId === ctx.organizationId
      );
    if (profile && !profile.stockTracking) return 999999;
    return this.getBalance(ctx, variantId).available;
  }

  checkAvailable(ctx: OperationsContext, variantId: string, quantity: number): Result<void> {
    if (this.getAvailable(ctx, variantId) < quantity) {
      return err("OUT_OF_STOCK", "Not enough stock available.");
    }
    return ok(undefined);
  }

  reserveForCart(
    ctx: OperationsContext,
    cartId: string,
    lines: { variantId: string; quantity: number }[]
  ): Result<void> {
    const store = this.repo.getStore();
    const defaultLoc = this.locations.getDefault(ctx);
    if (!defaultLoc) return err("NO_DEFAULT_LOCATION", "No default inventory location configured.");

    this.releaseCartReservations(ctx, cartId);

    for (const line of lines) {
      const check = this.checkAvailable(ctx, line.variantId, line.quantity);
      if (!check.ok) return check;

      store.reservations.push({
        id: this.repo.nextId("rsv"),
        organizationId: ctx.organizationId,
        variantId: line.variantId,
        locationId: defaultLoc.id,
        cartId,
        quantity: line.quantity,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    this.repo.saveStore(store);
    return ok(undefined);
  }

  releaseCartReservations(ctx: OperationsContext, cartId: string): Result<void> {
    const store = this.repo.getStore();
    for (const r of store.reservations) {
      if (r.cartId === cartId && r.organizationId === ctx.organizationId && r.status === "active") {
        r.status = "released";
      }
    }
    this.repo.saveStore(store);
    return ok(undefined);
  }

  convertReservationToSale(ctx: OperationsContext, cartId: string, orderId: string): Result<void> {
    const store = this.repo.getStore();
    const active = store.reservations.filter(
      (r) =>
        r.cartId === cartId &&
        r.organizationId === ctx.organizationId &&
        r.status === "active"
    );

    for (const r of active) {
      const sale = this.recordMovement(ctx, {
        variantId: r.variantId,
        locationId: r.locationId,
        quantityDelta: -r.quantity,
        movementType: "sale",
        referenceType: "order",
        referenceId: orderId,
        reason: "Order sale",
      });
      if (!sale.ok) return sale;
      r.status = "converted";
      r.orderId = orderId;
    }
    this.repo.saveStore(store);
    return ok(undefined);
  }

  syncVariantStockProjection(ctx: OperationsContext, variantId: string): number {
    return this.getAvailable(ctx, variantId);
  }

  adjustStock(
    ctx: OperationsContext,
    input: {
      variantId: string;
      locationId: string;
      quantityDelta: number;
      reason: string;
    }
  ): Result<StockMovement> {
    if (!input.reason.trim()) return err("REASON_REQUIRED", "Adjustment reason is required.");
    return this.recordMovement(ctx, {
      ...input,
      movementType: "adjustment",
      referenceType: "adjustment",
    });
  }

  getStockStatus(ctx: OperationsContext, variantId: string): ReturnType<typeof deriveStockStatus> {
    const store = this.repo.getStore();
    const profile = store.variantProfiles.find(
      (p) => p.variantId === variantId && p.organizationId === ctx.organizationId
    );
    const balance = this.getBalance(ctx, variantId);
    return deriveStockStatus(balance.available, profile?.reorderPoint, profile?.minimumStock);
  }
}

export class ReservationService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly ledger: StockLedgerService
  ) {}

  expireReservations(ctx: OperationsContext): { expired: number } {
    const store = this.repo.getStore();
    const now = Date.now();
    let expired = 0;
    for (const r of store.reservations) {
      if (
        r.organizationId === ctx.organizationId &&
        r.status === "active" &&
        new Date(r.expiresAt).getTime() <= now
      ) {
        r.status = "expired";
        expired++;
      }
    }
    if (expired) this.repo.saveStore(store);
    return { expired };
  }

  listActive(ctx: OperationsContext): import("../types").InventoryReservation[] {
    return this.repo
      .getStore()
      .reservations.filter(
        (r) =>
          r.organizationId === ctx.organizationId &&
          r.status === "active" &&
          new Date(r.expiresAt).getTime() > Date.now()
      );
  }
}

export class LowStockService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly ledger: StockLedgerService
  ) {}

  listLowStock(ctx: OperationsContext): import("../types").ReorderRecommendation[] {
    const store = this.repo.getStore();
    const results: import("../types").ReorderRecommendation[] = [];

    for (const profile of store.variantProfiles.filter(
      (p) => p.organizationId === ctx.organizationId && p.stockTracking
    )) {
      const balance = this.ledger.getBalance(ctx, profile.variantId);
      const reorderPoint = profile.reorderPoint ?? profile.minimumStock;
      if (reorderPoint === undefined) continue;
      if (balance.available <= reorderPoint) {
        results.push({
          variantId: profile.variantId,
          sku: profile.variantId,
          productName: profile.variantId,
          available: balance.available,
          reorderPoint,
          reorderQuantity: profile.reorderQuantity ?? reorderPoint * 2,
          reason: `Available (${balance.available}) <= reorder point (${reorderPoint})`,
        });
      }
    }
    return results;
  }
}

export class VariantOpsService {
  constructor(private readonly repo: OperationsRepository) {}

  getProfile(ctx: OperationsContext, variantId: string): VariantOpsProfile | undefined {
    return this.repo
      .getStore()
      .variantProfiles.find(
        (p) => p.variantId === variantId && p.organizationId === ctx.organizationId
      );
  }

  upsertProfile(ctx: OperationsContext, profile: Omit<VariantOpsProfile, "organizationId">): VariantOpsProfile {
    const store = this.repo.getStore();
    const existing = store.variantProfiles.findIndex(
      (p) => p.variantId === profile.variantId && p.organizationId === ctx.organizationId
    );
    const full: VariantOpsProfile = { ...profile, organizationId: ctx.organizationId };
    if (existing >= 0) store.variantProfiles[existing] = full;
    else store.variantProfiles.push(full);
    this.repo.saveStore(store);
    return full;
  }
}
