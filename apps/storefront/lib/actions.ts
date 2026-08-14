"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { commerce, getCommerceContext } from "@/lib/commerce";
import { getOrCreateCart } from "@/lib/cart";

export async function addToCartAction(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const redirectTo = String(formData.get("redirectTo") ?? "/cart");

  const ctx = getCommerceContext();
  const cart = await getOrCreateCart();
  const result = commerce.cart.addLine(ctx, cart.id, variantId, quantity);

  revalidatePath("/", "layout");

  if (!result.ok) {
    redirect(`${redirectTo}?error=${encodeURIComponent(result.error.message)}`);
  }

  redirect(redirectTo);
}

export async function updateCartLineAction(formData: FormData) {
  const lineId = String(formData.get("lineId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);

  const ctx = getCommerceContext();
  const cart = await getOrCreateCart();
  commerce.cart.updateQuantity(ctx, cart.id, lineId, quantity);

  revalidatePath("/", "layout");
}

export async function removeCartLineAction(formData: FormData) {
  const lineId = String(formData.get("lineId") ?? "");

  const ctx = getCommerceContext();
  const cart = await getOrCreateCart();
  commerce.cart.removeLine(ctx, cart.id, lineId);

  revalidatePath("/", "layout");
}

export async function placeOrderAction(
  _prev: { ok: false; error: string } | null,
  formData: FormData
) {
  const ctx = getCommerceContext();
  const cart = await getOrCreateCart();

  const shippingMethodCode = String(formData.get("shippingMethodCode") ?? "standard");
  const promotionCode = String(formData.get("promotionCode") ?? "") || undefined;
  const paymentReference = String(formData.get("paymentReference") ?? "") || undefined;

  const result = commerce.checkout.placeOrder(ctx, {
    cartId: cart.id,
    customerId: ctx.customerId,
    shippingMethodCode,
    promotionCode,
    paymentProvider: "demo",
    paymentReference,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error.message };
  }

  revalidatePath("/", "layout");
  redirect(`/orders/${result.data.id}/track`);
}
