import type { PaymentAdapter } from "./types";

export const paymentAdapter: PaymentAdapter = {
  async verifyPayment() {
    return { ok: true, status: "paid" };
  },
};
