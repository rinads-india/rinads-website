export type RinpoRouteContext = {
  route: string;
  productId?: string;
  cartId?: string;
  orderId?: string;
  customerId?: string;
};

export type RinpoToolName =
  | "similar_products"
  | "compare_variants"
  | "add_to_cart"
  | "order_status"
  | "create_ticket";

export type RinpoToolInput = {
  tool: RinpoToolName;
  args: Record<string, string | number | undefined>;
};

export type RinpoToolResult = {
  tool: RinpoToolName;
  ok: boolean;
  message: string;
  data?: unknown;
};

export const RINPO_HARD_LIMITS = {
  canSubmitPayment: false,
  canBypassConfirmation: false,
  canOverrideShippingTax: false,
} as const;
