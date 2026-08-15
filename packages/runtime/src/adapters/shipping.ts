import type { ShippingAdapter } from "./types";

export const shippingAdapter: ShippingAdapter = {
  async createShipment() {
    return { ok: true, trackingId: `TRK_${Date.now()}` };
  },
};
