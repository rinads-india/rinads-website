import type { CommerceRepository } from "../repository";
import { err, ok, roundMoney } from "../result";
import type { CommerceContext, Result, ShippingMethod } from "../types";

export class ShippingService {
  constructor(private readonly repo: CommerceRepository) {}

  listMethods(ctx: CommerceContext): ShippingMethod[] {
    return this.repo
      .getStore()
      .shippingMethods.filter((m) => m.organizationId === ctx.organizationId && m.isActive);
  }

  calculate(
    ctx: CommerceContext,
    methodCode: string,
    cartSubtotal: number
  ): Result<{ method: ShippingMethod; amount: number }> {
    const method = this.listMethods(ctx).find((m) => m.code === methodCode);
    if (!method) return err("SHIPPING_METHOD_NOT_FOUND", "Shipping method not found.");
    if (method.freeAbove != null && cartSubtotal >= method.freeAbove) {
      return ok({ method, amount: 0 });
    }
    return ok({ method, amount: roundMoney(method.baseRate) });
  }
}
