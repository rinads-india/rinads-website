import type { CommerceRepository } from "../repository";
import { err, ok, roundMoney } from "../result";
import type { Cart, CommerceContext, Result } from "../types";
import { CatalogService } from "./catalog";

export class CartService {
  private catalog: CatalogService;

  constructor(private readonly repo: CommerceRepository) {
    this.catalog = new CatalogService(this.repo);
  }

  getOrCreate(ctx: CommerceContext, cartId?: string, guestToken?: string): Cart {
    const store = this.repo.getStore();
    let cart = cartId ? store.carts.find((c) => c.id === cartId) : undefined;
    if (!cart && ctx.customerId) {
      cart = store.carts.find((c) => c.customerId === ctx.customerId && c.organizationId === ctx.organizationId);
    }
    if (!cart && guestToken) {
      cart = store.carts.find((c) => c.guestToken === guestToken && c.organizationId === ctx.organizationId);
    }
    if (!cart) {
      cart = {
        id: this.repo.nextId("cart"),
        organizationId: ctx.organizationId,
        customerId: ctx.customerId,
        guestToken,
        currency: "INR",
        lines: [],
        updatedAt: new Date().toISOString(),
      };
      store.carts.push(cart);
      this.repo.saveStore(store);
    }
    return cart;
  }

  addLine(ctx: CommerceContext, cartId: string, variantId: string, quantity: number): Result<Cart> {
    if (quantity < 1) return err("INVALID_QUANTITY", "Quantity must be at least 1.");
    const variant = this.catalog.getVariant(ctx, variantId);
    if (!variant) return err("VARIANT_NOT_FOUND", "Variant not found.");
    if (variant.stock < quantity) return err("OUT_OF_STOCK", "Not enough stock available.");
    const store = this.repo.getStore();
    const cart = store.carts.find((c) => c.id === cartId && c.organizationId === ctx.organizationId);
    if (!cart) return err("CART_NOT_FOUND", "Cart not found.");
    const existing = cart.lines.find((l) => l.variantId === variantId);
    if (existing) existing.quantity += quantity;
    else cart.lines.push({ id: this.repo.nextId("line"), variantId, quantity });
    cart.updatedAt = new Date().toISOString();
    this.repo.saveStore(store);
    return ok(cart);
  }

  updateQuantity(ctx: CommerceContext, cartId: string, lineId: string, quantity: number): Result<Cart> {
    const store = this.repo.getStore();
    const cart = store.carts.find((c) => c.id === cartId && c.organizationId === ctx.organizationId);
    if (!cart) return err("CART_NOT_FOUND", "Cart not found.");
    const line = cart.lines.find((l) => l.id === lineId);
    if (!line) return err("LINE_NOT_FOUND", "Cart line not found.");
    if (quantity <= 0) {
      cart.lines = cart.lines.filter((l) => l.id !== lineId);
    } else {
      const variant = this.catalog.getVariant(ctx, line.variantId);
      if (!variant || variant.stock < quantity) return err("OUT_OF_STOCK", "Not enough stock available.");
      line.quantity = quantity;
    }
    cart.updatedAt = new Date().toISOString();
    this.repo.saveStore(store);
    return ok(cart);
  }

  removeLine(ctx: CommerceContext, cartId: string, lineId: string): Result<Cart> {
    return this.updateQuantity(ctx, cartId, lineId, 0);
  }

  clear(ctx: CommerceContext, cartId: string): Result<Cart> {
    const store = this.repo.getStore();
    const cart = store.carts.find((c) => c.id === cartId && c.organizationId === ctx.organizationId);
    if (!cart) return err("CART_NOT_FOUND", "Cart not found.");
    cart.lines = [];
    cart.updatedAt = new Date().toISOString();
    this.repo.saveStore(store);
    return ok(cart);
  }

  validate(ctx: CommerceContext, cartId: string): Result<{ cart: Cart; subtotal: number; issues: string[] }> {
    const store = this.repo.getStore();
    const cart = store.carts.find((c) => c.id === cartId && c.organizationId === ctx.organizationId);
    if (!cart) return err("CART_NOT_FOUND", "Cart not found.");
    const issues: string[] = [];
    let subtotal = 0;
    for (const line of cart.lines) {
      const variant = this.catalog.getVariant(ctx, line.variantId);
      if (!variant) {
        issues.push(`Variant ${line.variantId} no longer exists.`);
        continue;
      }
      if (variant.stock < line.quantity) issues.push(`${variant.name} has insufficient stock.`);
      subtotal += variant.price * line.quantity;
    }
    if (issues.length) return err("CART_INVALID", issues.join(" "), undefined, ctx.requestId);
    return ok({ cart, subtotal: roundMoney(subtotal), issues });
  }

  freeShippingProgress(ctx: CommerceContext, cartId: string): { remaining: number; threshold?: number } | null {
    const store = this.repo.getStore();
    const method = store.shippingMethods.find((m) => m.organizationId === ctx.organizationId && m.isActive);
    if (!method?.freeAbove) return null;
    const validated = this.validate(ctx, cartId);
    if (!validated.ok) return null;
    const remaining = roundMoney(Math.max(0, method.freeAbove - validated.data.subtotal));
    return { remaining, threshold: method.freeAbove };
  }
}
