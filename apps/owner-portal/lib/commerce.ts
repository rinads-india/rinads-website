import { commerce, AMBADY_ORG_ID } from "@rinads/commerce-server";
import type {
  CommerceContext,
  Order,
  Product,
  ProductMedia,
  ProductVariant,
  SupportTicket,
} from "@rinads/commerce";

export { commerce, AMBADY_ORG_ID };

/**
 * Org-owner context — no customerId so order/ticket queries are not scoped to a single customer.
 * Real authorization will be enforced server-side in Phase 1+; this is demo context only.
 */
export function demoContext(overrides: Partial<CommerceContext> = {}): CommerceContext {
  return {
    organizationId: AMBADY_ORG_ID,
    userId: "user_owner_001",
    requestId: `req_${Date.now()}`,
    ...overrides,
  };
}

export function listAllProducts(ctx: CommerceContext): Product[] {
  const store = commerce.repo.getStore();
  return store.products
    .filter((p) => p.organizationId === ctx.organizationId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getProductWithDetails(
  ctx: CommerceContext,
  productId: string
): { product: Product; variants: ProductVariant[]; media: ProductMedia[] } | null {
  const store = commerce.repo.getStore();
  const product = store.products.find(
    (p) => p.id === productId && p.organizationId === ctx.organizationId
  );
  if (!product) return null;
  const variants = store.variants.filter((v) => v.productId === productId);
  const media = store.media
    .filter((m) => m.productId === productId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return { product, variants, media };
}

export function listOrgOrders(ctx: CommerceContext): Order[] {
  return commerce.order.listForOrg(ctx);
}

export function listOrgTickets(ctx: CommerceContext): SupportTicket[] {
  return commerce.support.listForOrg(ctx);
}

export function countOpenTickets(ctx: CommerceContext): number {
  return listOrgTickets(ctx).filter((t) => t.status === "open" || t.status === "assigned" || t.status === "in_progress").length;
}

export const DEMO_OWNER_ROLE = "founder" as const;
