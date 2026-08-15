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
  | "create_ticket"
  | "ops_daily_briefing"
  | "ops_low_stock"
  | "ops_pending_po"
  | "ops_propose_adjustment"
  | "ops_confirm_proposal";

export type RinpoToolInput = {
  tool: RinpoToolName | (string & {});
  args: Record<string, string | number | undefined>;
};

export type RinpoToolResult = {
  tool: string;
  ok: boolean;
  message: string;
  data?: unknown;
};

export const RINPO_HARD_LIMITS = {
  canSubmitPayment: false,
  canBypassConfirmation: false,
  canOverrideShippingTax: false,
  canAdjustInventory: false,
} as const;
