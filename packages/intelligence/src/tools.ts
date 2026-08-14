import type { CommerceContext } from "@rinads/commerce";
import type {
  CartService,
  CatalogService,
  OrderService,
  SupportService,
} from "@rinads/commerce";
import type { RinpoRouteContext, RinpoToolInput, RinpoToolResult } from "./types";
import { RINPO_HARD_LIMITS } from "./types";

export type RinpoServices = {
  catalog: CatalogService;
  cart: CartService;
  order: OrderService;
  support: SupportService;
};

export function buildRinpoContext(routeCtx: RinpoRouteContext, commerceCtx: CommerceContext) {
  return {
    ...commerceCtx,
    route: routeCtx.route,
    productId: routeCtx.productId,
    cartId: routeCtx.cartId,
    orderId: routeCtx.orderId,
    limits: RINPO_HARD_LIMITS,
  };
}

export function executeRinpoTool(
  services: RinpoServices,
  ctx: CommerceContext,
  input: RinpoToolInput
): RinpoToolResult {
  switch (input.tool) {
    case "similar_products": {
      const productId = String(input.args.productId ?? "");
      const items = services.catalog.relatedProducts(ctx, productId, 4);
      return {
        tool: input.tool,
        ok: true,
        message: items.length ? "Here are similar products." : "No similar products found.",
        data: items,
      };
    }
    case "compare_variants": {
      const slug = String(input.args.slug ?? "");
      const product = services.catalog.getBySlug(ctx, slug);
      if (!product.ok) {
        return { tool: input.tool, ok: false, message: product.error.message };
      }
      return {
        tool: input.tool,
        ok: true,
        message: "Variant comparison ready.",
        data: product.data.variants.map((v) => ({
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
        })),
      };
    }
    case "add_to_cart": {
      const cartId = String(input.args.cartId ?? "");
      const variantId = String(input.args.variantId ?? "");
      const quantity = Number(input.args.quantity ?? 1);
      const result = services.cart.addLine(ctx, cartId, variantId, quantity);
      return {
        tool: input.tool,
        ok: result.ok,
        message: result.ok ? "Added to cart." : result.error.message,
        data: result.ok ? result.data : undefined,
      };
    }
    case "order_status": {
      const orderId = String(input.args.orderId ?? "");
      const result = services.order.getById(ctx, orderId, ctx.customerId);
      if (!result.ok) return { tool: input.tool, ok: false, message: result.error.message };
      return {
        tool: input.tool,
        ok: true,
        message: `Order ${result.data.orderNumber} is ${result.data.status}.`,
        data: {
          status: result.data.status,
          fulfilmentStatus: result.data.fulfilmentStatus,
          events: result.data.events,
        },
      };
    }
    case "create_ticket": {
      const customerId = ctx.customerId ?? String(input.args.customerId ?? "");
      if (!customerId) {
        return { tool: input.tool, ok: false, message: "Customer context required." };
      }
      const result = services.support.create(ctx, {
        customerId,
        subject: String(input.args.subject ?? "RINPO support request"),
        body: String(input.args.body ?? "Created via RINPO assistant."),
        orderId: input.args.orderId ? String(input.args.orderId) : undefined,
        authorType: "rinpo",
      });
      return {
        tool: input.tool,
        ok: result.ok,
        message: result.ok ? "Support ticket created." : result.error.message,
        data: result.ok ? { ticketId: result.data.id } : undefined,
      };
    }
    default:
      return { tool: input.tool, ok: false, message: "Unknown tool." };
  }
}
