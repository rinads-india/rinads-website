import { err, ok } from "../result";
import type { Result } from "../types";

export type PaymentVerifyInput = {
  provider: string;
  reference: string;
  amount: number;
  currency: string;
};

/** Payment abstraction — verify via provider callback only; never store PAN/CVV. */
export class PaymentService {
  verify(input: PaymentVerifyInput): Result<{ status: "paid" | "failed"; providerRef: string }> {
    if (!input.reference?.trim()) {
      return err("PAYMENT_REFERENCE_REQUIRED", "Payment reference is required.");
    }
    if (input.amount <= 0) {
      return err("PAYMENT_INVALID_AMOUNT", "Payment amount must be positive.");
    }
    // Demo provider: references starting with "fail_" simulate failure.
    if (input.reference.startsWith("fail_")) {
      return ok({ status: "failed", providerRef: input.reference });
    }
    return ok({ status: "paid", providerRef: input.reference });
  }
}
