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
  | "ops_confirm_proposal"
  // Salon READ tools (R GLOW Phase D)
  | "get_salon_business_summary"
  | "get_today_appointments"
  | "get_staff_utilization"
  | "get_empty_slots"
  | "get_customer_history"
  | "get_reactivation_candidates"
  | "get_revenue_summary"
  | "get_service_performance"
  | "get_pending_payments"
  | "get_customer_communication_preferences"
  // Salon WRITE/EXECUTE tools
  | "create_appointment"
  | "reschedule_appointment"
  | "cancel_appointment"
  | "create_customer_followup"
  | "send_appointment_confirmation"
  | "send_appointment_reminder"
  | "create_reactivation_campaign"
  | "create_staff_task"
  | "create_customer_note"
  | "issue_receipt_or_invoice"
  // Growth READ tools (R GLOW Phase E, Slice 1)
  | "get_customer_segments"
  | "preview_segment"
  | "get_campaign_performance"
  | "get_message_failures"
  | "get_retention_summary"
  | "get_growth_opportunities"
  // Growth WRITE tools
  | "create_segment"
  | "create_campaign_draft"
  | "create_reactivation_draft"
  // Salon SENSITIVE tools
  | "record_payment"
  | "initiate_refund"
  | "modify_pricing"
  | "modify_discount"
  // Growth SENSITIVE tools (requesting: salon.campaigns.manage; approval enforced at org.manage via RLS)
  | "approve_campaign"
  | "send_campaign"
  | "send_reactivation_batch"
  | "retry_failed_message";

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
