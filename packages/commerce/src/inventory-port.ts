import type { CommerceContext, Result } from "./types";

/** Minimal port — implemented by @rinads/operations StockLedgerService. */
export type InventoryPort = {
  getAvailable(ctx: CommerceContext, variantId: string): number;
  checkAvailable(ctx: CommerceContext, variantId: string, quantity: number): Result<void>;
  reserveForCart(
    ctx: CommerceContext,
    cartId: string,
    lines: { variantId: string; quantity: number }[]
  ): Result<void>;
  releaseCartReservations(ctx: CommerceContext, cartId: string): Result<void>;
  convertReservationToSale(ctx: CommerceContext, cartId: string, orderId: string): Result<void>;
  refreshProjections?(ctx: CommerceContext): void;
};

export type OrderPaidCallback = (
  ctx: CommerceContext,
  order: import("./types").Order
) => void;
