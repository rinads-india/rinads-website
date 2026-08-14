import {
  commerce,
  demoContext,
  DEMO_CUSTOMER_ID,
} from "@rinads/commerce-server";
import type {
  Address,
  CommerceContext,
  CustomerProfile,
  ProductCard,
  ProductVariant,
} from "@rinads/commerce";

export { commerce, demoContext, DEMO_CUSTOMER_ID };

export function portalContext(overrides: Partial<CommerceContext> = {}): CommerceContext {
  return demoContext(overrides);
}

export function getCustomerProfile(ctx: CommerceContext): CustomerProfile | undefined {
  return commerce.repo
    .getStore()
    .customers.find(
      (c) => c.id === DEMO_CUSTOMER_ID && c.organizationId === ctx.organizationId
    );
}

export function listCustomerAddresses(ctx: CommerceContext): Address[] {
  return commerce.repo
    .getStore()
    .addresses.filter(
      (a) => a.customerId === DEMO_CUSTOMER_ID && a.organizationId === ctx.organizationId
    );
}

export type WishlistItem = {
  variantId: string;
  variant: ProductVariant;
  product: ProductCard;
};

export function listWishlistItems(ctx: CommerceContext): WishlistItem[] {
  const store = commerce.repo.getStore();
  const entries = store.wishlists.filter((w) => w.customerId === DEMO_CUSTOMER_ID);
  const published = commerce.catalog.listPublished(ctx);

  return entries.flatMap((entry) => {
    const variant = store.variants.find((v) => v.id === entry.variantId);
    if (!variant) return [];
    const product = published.find((p) => p.id === variant.productId);
    if (!product) return [];
    return [{ variantId: entry.variantId, variant, product }];
  });
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function orderStatusTone(
  status: string
): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "confirmed":
    case "delivered":
      return "success";
    case "placed":
    case "shipped":
    case "out_for_delivery":
      return "warning";
    case "cancelled":
    case "payment_failed":
    case "refund_pending":
    case "refunded":
      return "danger";
    default:
      return "default";
  }
}

export function ticketStatusTone(
  status: string
): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "resolved":
    case "closed":
      return "success";
    case "open":
    case "assigned":
      return "warning";
    case "in_progress":
      return "default";
    default:
      return "default";
  }
}
