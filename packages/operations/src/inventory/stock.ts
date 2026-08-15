import type { StockMovement, InventoryReservation } from "../types";

export function computeOnHand(movements: StockMovement[], variantId: string, locationId: string): number {
  return movements
    .filter((m) => m.variantId === variantId && m.locationId === locationId)
    .reduce((sum, m) => sum + m.quantityDelta, 0);
}

export function computeReserved(
  reservations: InventoryReservation[],
  variantId: string,
  locationId: string
): number {
  return reservations
    .filter(
      (r) =>
        r.variantId === variantId &&
        r.locationId === locationId &&
        r.status === "active" &&
        new Date(r.expiresAt).getTime() > Date.now()
    )
    .reduce((sum, r) => sum + r.quantity, 0);
}

export function computeAvailable(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

export function deriveStockStatus(
  available: number,
  reorderPoint?: number,
  minimumStock?: number
): "in_stock" | "low_stock" | "out_of_stock" {
  if (available <= 0) return "out_of_stock";
  const threshold = reorderPoint ?? minimumStock;
  if (threshold !== undefined && available <= threshold) return "low_stock";
  return "in_stock";
}
