import type { CommerceRepository } from "../repository";
import { err, ok } from "../result";
import type {
  CommerceContext,
  Order,
  OrderEvent,
  OrderLineSnapshot,
  OrderStatus,
  PaymentStatus,
  Result,
} from "../types";
import type { CheckoutQuote } from "./checkout";

export class OrderService {
  constructor(private readonly repo: CommerceRepository) {}

  getById(ctx: CommerceContext, orderId: string, customerId?: string): Result<Order> {
    const order = this.repo
      .getStore()
      .orders.find((o) => o.id === orderId && o.organizationId === ctx.organizationId);
    if (!order) return err("ORDER_NOT_FOUND", "Order not found.");
    if (customerId && order.customerId && order.customerId !== customerId) {
      return err("FORBIDDEN", "You do not have access to this order.");
    }
    return ok(order);
  }

  listForCustomer(ctx: CommerceContext, customerId: string): Order[] {
    return this.repo
      .getStore()
      .orders.filter((o) => o.organizationId === ctx.organizationId && o.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listForOrg(ctx: CommerceContext): Order[] {
    return this.repo
      .getStore()
      .orders.filter((o) => o.organizationId === ctx.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createFromCheckout(
    ctx: CommerceContext,
    input: {
      customerId?: string;
      guestEmail?: string;
      quote: CheckoutQuote;
      lines: OrderLineSnapshot[];
      paymentRef: string;
      shippingMethodCode: string;
    }
  ): Result<Order> {
    const store = this.repo.getStore();
    const now = new Date().toISOString();
    const events: OrderEvent[] = [
      { id: this.repo.nextId("evt"), eventType: "placed", label: "Order placed", occurredAt: now },
      { id: this.repo.nextId("evt"), eventType: "payment", label: "Payment confirmed", occurredAt: now },
    ];
    const order: Order = {
      id: this.repo.nextId("ord"),
      organizationId: ctx.organizationId,
      customerId: input.customerId,
      orderNumber: this.repo.nextOrderNumber(ctx.organizationId),
      status: "confirmed" satisfies OrderStatus,
      paymentStatus: "paid" satisfies PaymentStatus,
      fulfilmentStatus: "unfulfilled",
      subtotal: input.quote.subtotal,
      discountTotal: input.quote.discountTotal,
      shippingTotal: input.quote.shippingTotal,
      taxTotal: input.quote.taxTotal,
      grandTotal: input.quote.grandTotal,
      currency: "INR",
      shippingMethodCode: input.shippingMethodCode,
      promotionCode: input.quote.promotionCode,
      guestEmail: input.guestEmail,
      lines: input.lines,
      events,
      createdAt: now,
    };
    store.orders.push(order);
    this.repo.saveStore(store);
    return ok(order);
  }

  updateStatus(ctx: CommerceContext, orderId: string, status: OrderStatus, label: string): Result<Order> {
    const store = this.repo.getStore();
    const order = store.orders.find((o) => o.id === orderId && o.organizationId === ctx.organizationId);
    if (!order) return err("ORDER_NOT_FOUND", "Order not found.");
    order.status = status;
    order.events.push({
      id: this.repo.nextId("evt"),
      eventType: status,
      label,
      occurredAt: new Date().toISOString(),
    });
    this.repo.saveStore(store);
    return ok(order);
  }
}
