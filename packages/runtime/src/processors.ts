import type {
  FulfilmentService,
  LowStockService,
  OperationsContext,
  ReservationService,
} from "@rinads/operations";
import type { EventProcessor } from "./types";
import { AlertEngine } from "./runtime";

export function createReservationExpiryProcessor(
  reservations: ReservationService,
  alerts: AlertEngine
): EventProcessor {
  return {
    key: "reservation_expiry",
    handle: async (ctx, _payload) => {
      const opsCtx: OperationsContext = { organizationId: ctx.organizationId };
      const { expired } = reservations.expireReservations(opsCtx);
      if (expired > 0) {
        alerts.createAlert(opsCtx, {
          alertType: "inventory.expired",
          title: "Reservations expired",
          message: `${expired} cart reservation(s) expired and released.`,
          severity: "info",
        });
      }
      return { ok: true };
    },
  };
}

export function createLowStockAlertProcessor(
  lowStock: LowStockService,
  alerts: AlertEngine
): EventProcessor {
  return {
    key: "low_stock_scan",
    handle: async (ctx) => {
      const opsCtx: OperationsContext = { organizationId: ctx.organizationId };
      const items = lowStock.listLowStock(opsCtx);
      for (const item of items) {
        alerts.createAlert(opsCtx, {
          alertType: "inventory.low",
          title: `Low stock: ${item.sku}`,
          message: item.reason,
          entityType: "variant",
          entityId: item.variantId,
          severity: "warning",
        });
      }
      return { ok: true };
    },
  };
}

export function createFulfilmentProcessor(fulfilment: FulfilmentService): EventProcessor {
  return {
    key: "fulfilment_on_paid",
    handle: async (ctx, payload) => {
      const orderId = String(payload.orderId ?? "");
      const lines = (payload.lines as {
        orderLineId?: string;
        variantId: string;
        sku: string;
        productName: string;
        variantName: string;
        quantity: number;
      }[]) ?? [];
      const opsCtx: OperationsContext = { organizationId: ctx.organizationId };
      const result = fulfilment.createForOrder(opsCtx, { orderId, lines });
      return result.ok ? { ok: true } : { ok: false, error: result.error.message };
    },
  };
}
