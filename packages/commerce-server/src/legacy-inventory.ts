import {
  err,
  ok,
  type CommerceContext,
  type CommerceRepository,
  type InventoryPort,
  type Result,
} from "@rinads/commerce";

/**
 * Compatibility adapter for demo / legacy commerce-server flows only.
 *
 * Authoritative production inventory is owned by @rinads/operations and its
 * stock ledger + reservation lifecycle. This adapter exists so older isolated
 * commerce demos/tests can continue to run while scalar `ProductVariant.stock`
 * is phased out as a source of truth.
 */
export function createLegacyVariantStockInventoryPort(repo: CommerceRepository): InventoryPort {
  function getVariant(ctx: CommerceContext, variantId: string) {
    return repo
      .getStore()
      .variants.find((variant) => variant.id === variantId && variant.organizationId === ctx.organizationId);
  }

  function checkAvailable(ctx: CommerceContext, variantId: string, quantity: number): Result<void> {
    const variant = getVariant(ctx, variantId);
    if (!variant) return err("VARIANT_NOT_FOUND", "Variant not found.");
    if (variant.stock < quantity) return err("OUT_OF_STOCK", "Not enough stock available.");
    return ok(undefined);
  }

  return {
    getAvailable(ctx, variantId) {
      return getVariant(ctx, variantId)?.stock ?? 0;
    },

    checkAvailable,

    reserveForCart(ctx, _cartId, lines) {
      for (const line of lines) {
        const result = checkAvailable(ctx, line.variantId, line.quantity);
        if (!result.ok) return result;
      }
      return ok(undefined);
    },

    releaseCartReservations() {
      return ok(undefined);
    },

    convertReservationToSale(ctx, cartId) {
      const store = repo.getStore();
      const cart = store.carts.find(
        (candidate) => candidate.id === cartId && candidate.organizationId === ctx.organizationId
      );
      if (!cart) return err("CART_NOT_FOUND", "Cart not found.");

      for (const line of cart.lines) {
        const result = checkAvailable(ctx, line.variantId, line.quantity);
        if (!result.ok) return result;
      }

      for (const line of cart.lines) {
        const variant = getVariant(ctx, line.variantId);
        if (variant) variant.stock -= line.quantity;
      }
      repo.saveStore(store);
      return ok(undefined);
    },
  };
}
