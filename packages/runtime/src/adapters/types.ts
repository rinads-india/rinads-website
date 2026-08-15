export type NotificationAdapterResult = { ok: true } | { ok: false; error: string };

export type NotificationAdapter = {
  channel: string;
  send(input: {
    recipient: string;
    templateKey: string;
    payload: Record<string, unknown>;
  }): Promise<NotificationAdapterResult>;
};

export type ShippingAdapter = {
  createShipment(input: Record<string, unknown>): Promise<{ ok: true; trackingId: string } | { ok: false; error: string }>;
};

export type PaymentAdapter = {
  verifyPayment(input: Record<string, unknown>): Promise<{ ok: true; status: string } | { ok: false; error: string }>;
};
