import { cookies } from "next/headers";
import type { Cart, ProductCard, ProductVariant } from "@rinads/commerce";
import { commerce, getCommerceContext } from "./commerce";

const CART_COOKIE = "ambady_cart_id";

export async function getCartId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value;
}

export async function setCartId(cartId: string): Promise<void> {
  const jar = await cookies();
  jar.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Read-only cart lookup for Server Components (no cookie mutation). */
export async function getCartForDisplay(): Promise<Cart | null> {
  const existingId = await getCartId();
  if (!existingId) return null;
  const ctx = getCommerceContext();
  return (
    commerce.repo
      .getStore()
      .carts.find((c) => c.id === existingId && c.organizationId === ctx.organizationId) ?? null
  );
}

/** Creates or loads cart and persists cookie — use in Server Actions / Route Handlers only. */
export async function getOrCreateCart(): Promise<Cart> {
  const ctx = getCommerceContext();
  const existingId = await getCartId();
  const cart = commerce.cart.getOrCreate(ctx, existingId);
  if (!existingId || existingId !== cart.id) {
    await setCartId(cart.id);
  }
  return cart;
}

export function getCartLineCount(cart: Cart | null): number {
  if (!cart) return 0;
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export type EnrichedCartLine = {
  lineId: string;
  variantId: string;
  quantity: number;
  variant: ProductVariant;
  product: ProductCard;
  lineTotal: number;
};

export async function getEnrichedCartLines(cart: Cart): Promise<EnrichedCartLine[]> {
  const ctx = getCommerceContext();
  const products = commerce.catalog.listPublished(ctx);
  const lines: EnrichedCartLine[] = [];

  for (const line of cart.lines) {
    const variant = commerce.catalog.getVariant(ctx, line.variantId);
    if (!variant) continue;
    const product = products.find((p) => p.id === variant.productId);
    if (!product) continue;
    lines.push({
      lineId: line.id,
      variantId: line.variantId,
      quantity: line.quantity,
      variant,
      product,
      lineTotal: variant.price * line.quantity,
    });
  }

  return lines;
}

export async function getCartSubtotal(cart: Cart): Promise<number> {
  const validated = commerce.cart.validate(getCommerceContext(), cart.id);
  return validated.ok ? validated.data.subtotal : 0;
}
