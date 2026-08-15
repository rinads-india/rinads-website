import type { OperationsContext } from "./types";
import type { StockBalance } from "./types";
import type { Result } from "./types";

/** Port consumed by @rinads/commerce — all stock mutations go through operations. */
export type InventoryPort = {
  getAvailable(ctx: OperationsContext, variantId: string): number;
  checkAvailable(ctx: OperationsContext, variantId: string, quantity: number): Result<void>;
  reserveForCart(
    ctx: OperationsContext,
    cartId: string,
    lines: { variantId: string; quantity: number }[]
  ): Result<void>;
  releaseCartReservations(ctx: OperationsContext, cartId: string): Result<void>;
  convertReservationToSale(
    ctx: OperationsContext,
    cartId: string,
    orderId: string
  ): Result<void>;
  getBalance(ctx: OperationsContext, variantId: string, locationId?: string): StockBalance;
  syncVariantStockProjection(ctx: OperationsContext, variantId: string): number;
};

export type OrderPaidHook = (ctx: OperationsContext, orderId: string) => Result<void>;
