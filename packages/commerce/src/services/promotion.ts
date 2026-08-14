import type { CommerceRepository } from "../repository";
import { err, ok, roundMoney } from "../result";
import type { CommerceContext, Promotion, Result } from "../types";

export class PromotionService {
  constructor(private readonly repo: CommerceRepository) {}

  validate(ctx: CommerceContext, code: string, cartSubtotal: number): Result<{ promotion: Promotion; discount: number }> {
    const promo = this.repo
      .getStore()
      .promotions.find(
        (p) =>
          p.organizationId === ctx.organizationId &&
          p.code.toLowerCase() === code.trim().toLowerCase() &&
          p.isActive
      );
    if (!promo) return err("PROMO_NOT_FOUND", "Promotion code is invalid.");
    if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) {
      return err("PROMO_EXHAUSTED", "Promotion code has reached its usage limit.");
    }
    if (promo.minCartTotal != null && cartSubtotal < promo.minCartTotal) {
      return err("PROMO_MIN_NOT_MET", `Minimum cart total of ₹${promo.minCartTotal} required.`);
    }
    let discount =
      promo.type === "percentage"
        ? roundMoney((cartSubtotal * promo.value) / 100)
        : roundMoney(promo.value);
    if (promo.maxDiscount != null) discount = Math.min(discount, promo.maxDiscount);
    discount = Math.min(discount, cartSubtotal);
    return ok({ promotion: promo, discount });
  }

  applyUsage(ctx: CommerceContext, promotionId: string): void {
    const store = this.repo.getStore();
    const promo = store.promotions.find(
      (p) => p.id === promotionId && p.organizationId === ctx.organizationId
    );
    if (promo) promo.usageCount += 1;
    this.repo.saveStore(store);
  }
}
