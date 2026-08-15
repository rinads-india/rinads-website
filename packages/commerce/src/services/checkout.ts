import type { CommerceRepository } from "../repository";
import type { InventoryPort, OrderPaidCallback } from "../inventory-port";
import { err, ok, roundMoney } from "../result";
import type { CheckoutInput, CommerceContext, Order, Result } from "../types";
import { CartService } from "./cart";
import { CatalogService } from "./catalog";
import { OrderService } from "./order";
import { PaymentService } from "./payment";
import { PromotionService } from "./promotion";
import { ShippingService } from "./shipping";
import { TaxService } from "./tax";

export type CheckoutQuote = {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  promotionCode?: string;
  shippingMethodCode: string;
};

export class CheckoutService {
  private cart: CartService;
  private catalog: CatalogService;
  private shipping: ShippingService;
  private tax: TaxService;
  private promo: PromotionService;
  private payment: PaymentService;
  private orders: OrderService;

  constructor(
    private readonly repo: CommerceRepository,
    private readonly inventory?: InventoryPort,
    private readonly onOrderPaid?: OrderPaidCallback
  ) {
    this.cart = new CartService(this.repo, inventory);
    this.catalog = new CatalogService(this.repo);
    this.shipping = new ShippingService(this.repo);
    this.tax = new TaxService(this.repo);
    this.promo = new PromotionService(this.repo);
    this.payment = new PaymentService();
    this.orders = new OrderService(this.repo);
  }

  quote(ctx: CommerceContext, input: Omit<CheckoutInput, "paymentProvider" | "paymentReference">): Result<CheckoutQuote> {
    const validated = this.cart.validate(ctx, input.cartId);
    if (!validated.ok) return validated;

    let discountTotal = 0;
    let promotionCode: string | undefined;
    if (input.promotionCode) {
      const promoResult = this.promo.validate(ctx, input.promotionCode, validated.data.subtotal);
      if (!promoResult.ok) return promoResult;
      discountTotal = promoResult.data.discount;
      promotionCode = promoResult.data.promotion.code;
    }

    const subtotalAfterDiscount = roundMoney(validated.data.subtotal - discountTotal);
    const shipResult = this.shipping.calculate(ctx, input.shippingMethodCode, validated.data.subtotal);
    if (!shipResult.ok) return shipResult;
    const taxTotal = this.tax.calculateTax(subtotalAfterDiscount);
    const grandTotal = roundMoney(subtotalAfterDiscount + shipResult.data.amount + taxTotal);

    return ok({
      subtotal: validated.data.subtotal,
      discountTotal,
      shippingTotal: shipResult.data.amount,
      taxTotal,
      grandTotal,
      promotionCode,
      shippingMethodCode: input.shippingMethodCode,
    });
  }

  /** Server-side revalidation of price, stock, discount, shipping, tax before order creation. */
  placeOrder(ctx: CommerceContext, input: CheckoutInput): Result<Order> {
    const quoteResult = this.quote(ctx, input);
    if (!quoteResult.ok) return quoteResult;

    const validated = this.cart.validate(ctx, input.cartId);
    if (!validated.ok) return validated;

    const store = this.repo.getStore();
    const cart = store.carts.find((c) => c.id === input.cartId);
    if (!cart) return err("CART_NOT_FOUND", "Cart not found.");

    if (this.inventory) {
      const reserveResult = this.inventory.reserveForCart(
        ctx,
        input.cartId,
        cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }))
      );
      if (!reserveResult.ok) return reserveResult;
    }

    const paymentRef = input.paymentReference ?? `demo_${Date.now()}`;
    const paymentResult = this.payment.verify({
      provider: input.paymentProvider,
      reference: paymentRef,
      amount: quoteResult.data.grandTotal,
      currency: "INR",
    });
    if (!paymentResult.ok) {
      this.inventory?.releaseCartReservations(ctx, input.cartId);
      return paymentResult;
    }
    if (paymentResult.data.status === "failed") {
      this.inventory?.releaseCartReservations(ctx, input.cartId);
      return err("PAYMENT_FAILED", "Payment verification failed.");
    }

    const lineSnapshots = cart.lines.map((line) => {
      const variant = this.catalog.getVariant(ctx, line.variantId)!;
      const product = store.products.find((p) => p.id === variant.productId)!;
      const media = store.media.find((m) => m.productId === product.id && m.isPrimary);
      const lineSubtotal = variant.price * line.quantity;
      const lineTax = this.tax.calculateTax(lineSubtotal);
      return {
        id: this.repo.nextId("snap"),
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: line.quantity,
        unitPrice: variant.price,
        taxAmount: lineTax,
        discountAmount: 0,
        imageUrl: media?.url,
      };
    });

    const orderResult = this.orders.createFromCheckout(ctx, {
      customerId: input.customerId ?? ctx.customerId,
      guestEmail: input.guestEmail,
      quote: quoteResult.data,
      lines: lineSnapshots,
      paymentRef: paymentResult.data.providerRef,
      shippingMethodCode: input.shippingMethodCode,
    });
    if (!orderResult.ok) {
      this.inventory?.releaseCartReservations(ctx, input.cartId);
      return orderResult;
    }

    if (this.inventory) {
      const saleResult = this.inventory.convertReservationToSale(
        ctx,
        input.cartId,
        orderResult.data.id
      );
      if (!saleResult.ok) return saleResult;
      this.inventory.refreshProjections?.(ctx);
    } else {
      for (const line of cart.lines) {
        const variant = store.variants.find((v) => v.id === line.variantId);
        if (variant) variant.stock -= line.quantity;
      }
    }

    if (quoteResult.data.promotionCode) {
      const promo = store.promotions.find(
        (p) => p.code === quoteResult.data.promotionCode && p.organizationId === ctx.organizationId
      );
      if (promo) this.promo.applyUsage(ctx, promo.id);
    }

    this.cart.clear(ctx, input.cartId);
    this.onOrderPaid?.(ctx, orderResult.data);
    return orderResult;
  }
}
