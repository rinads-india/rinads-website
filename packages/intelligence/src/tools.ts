import type { CommerceContext } from "@rinads/commerce";
import type {
  CartService,
  CatalogService,
  OrderService,
  SupportService,
} from "@rinads/commerce";
import type {
  FulfilmentService,
  LowStockService,
  PurchaseOrderService,
  ReturnService,
  WorkQueueService,
  StockLedgerService,
  AuditService,
  OperationsContext,
} from "@rinads/operations";
import type { RinpoRouteContext, RinpoToolInput, RinpoToolResult } from "./types";
import { RINPO_HARD_LIMITS } from "./types";
import { getRinpoTool, isRegisteredRinpoTool } from "./registry";

export type RinpoServices = {
  catalog: CatalogService;
  cart: CartService;
  order: OrderService;
  support: SupportService;
};

export type RinpoOpsServices = {
  lowStock: LowStockService;
  workQueue: WorkQueueService;
  purchaseOrders: PurchaseOrderService;
  returns: ReturnService;
  fulfilment: FulfilmentService;
  ledger: StockLedgerService;
  audit: AuditService;
};

export type RinpoProposal = {
  proposalId: string;
  tool: string;
  description: string;
  args: Record<string, unknown>;
  status: "pending_confirmation";
};

const pendingProposals = new Map<string, RinpoProposal>();

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

function toOps(ctx: CommerceContext): OperationsContext {
  return {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    customerId: ctx.customerId,
    requestId: ctx.requestId,
    roleKey: "founder",
  };
}

export function executeRinpoTool(
  services: RinpoServices,
  ctx: CommerceContext,
  input: RinpoToolInput,
  ops?: RinpoOpsServices
): RinpoToolResult {
  if (!isRegisteredRinpoTool(input.tool)) {
    return { tool: input.tool, ok: false, message: "Unknown tool." };
  }

  const def = getRinpoTool(input.tool);
  if (def?.ownerOnly && !ops) {
    return { tool: input.tool, ok: false, message: "Operations services unavailable." };
  }

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
    case "ops_daily_briefing": {
      if (!ops) return { tool: input.tool, ok: false, message: "Operations services unavailable." };
      const opsCtx = toOps(ctx);
      const queue = ops.workQueue.buildQueue(opsCtx).slice(0, 5);
      const low = ops.lowStock.listLowStock(opsCtx);
      const pendingPO = ops.purchaseOrders.pendingApprovals(opsCtx);
      const pendingReturns = ops.returns.pendingReview(opsCtx);
      const pendingFulfilment = ops.fulfilment.pendingCount(opsCtx);
      return {
        tool: input.tool,
        ok: true,
        message: "Operational briefing ready.",
        data: { queue, lowStock: low, pendingPO, pendingReturns, pendingFulfilment },
      };
    }
    case "ops_low_stock": {
      if (!ops) return { tool: input.tool, ok: false, message: "Operations services unavailable." };
      const items = ops.lowStock.listLowStock(toOps(ctx));
      return {
        tool: input.tool,
        ok: true,
        message: items.length ? `${items.length} SKU(s) below reorder point.` : "No low stock alerts.",
        data: items,
      };
    }
    case "ops_pending_po": {
      if (!ops) return { tool: input.tool, ok: false, message: "Operations services unavailable." };
      const items = ops.purchaseOrders.pendingApprovals(toOps(ctx));
      return {
        tool: input.tool,
        ok: true,
        message: `${items.length} purchase order(s) awaiting approval.`,
        data: items,
      };
    }
    case "ops_propose_adjustment": {
      if (!ops) return { tool: input.tool, ok: false, message: "Operations services unavailable." };
      const proposalId = `prop_${Date.now()}`;
      const proposal: RinpoProposal = {
        proposalId,
        tool: "inventory_adjust",
        description: String(input.args.reason ?? "Stock adjustment proposed by RINPO"),
        args: input.args,
        status: "pending_confirmation",
      };
      pendingProposals.set(proposalId, proposal);
      return {
        tool: input.tool,
        ok: true,
        message: "Proposal created. Confirm with ops_confirm_proposal.",
        data: proposal,
      };
    }
    case "ops_confirm_proposal": {
      if (!ops) return { tool: input.tool, ok: false, message: "Operations services unavailable." };
      const proposalId = String(input.args.proposalId ?? "");
      const proposal = pendingProposals.get(proposalId);
      if (!proposal) return { tool: input.tool, ok: false, message: "Proposal not found or expired." };
      const opsCtx = toOps(ctx);
      const result = ops.ledger.adjustStock(opsCtx, {
        variantId: String(proposal.args.variantId ?? ""),
        locationId: String(proposal.args.locationId ?? "loc_main_store"),
        quantityDelta: Number(proposal.args.quantityDelta ?? 0),
        reason: proposal.description,
      });
      if (result.ok) {
        ops.audit.log(opsCtx, {
          action: "inventory.adjust",
          entity: "stock_movement",
          entityId: result.data.id,
          after: { ...proposal.args },
          source: "rinpo",
          actorType: "ai",
          reason: proposal.description,
        });
        pendingProposals.delete(proposalId);
      }
      return {
        tool: input.tool,
        ok: result.ok,
        message: result.ok ? "Adjustment executed and audited." : result.error.message,
        data: result.ok ? result.data : undefined,
      };
    }
    default:
      return { tool: input.tool, ok: false, message: "Unknown tool." };
  }
}

export function getDailyBriefing(
  services: RinpoServices,
  ops: RinpoOpsServices,
  ctx: CommerceContext
): RinpoToolResult {
  return executeRinpoTool(services, ctx, { tool: "ops_daily_briefing", args: {} }, ops);
}
