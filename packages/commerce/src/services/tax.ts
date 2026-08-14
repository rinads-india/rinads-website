import type { CommerceRepository } from "../repository";
import { roundMoney } from "../result";

export class TaxService {
  constructor(private readonly repo: CommerceRepository) {}

  /** Centralized GST calculation — single entry for cart, checkout, invoice. */
  calculateTax(subtotalAfterDiscount: number): number {
    const rate = this.repo.getStore().taxRatePercent;
    return roundMoney((subtotalAfterDiscount * rate) / 100);
  }

  getRatePercent(): number {
    return this.repo.getStore().taxRatePercent;
  }
}
