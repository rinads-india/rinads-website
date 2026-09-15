import type { RinpoToolName } from "./types";

export type RinpoToolCategory = "READ" | "DRAFT" | "ACTION" | "WRITE" | "SENSITIVE";

export type RinpoToolDefinition = {
  key: RinpoToolName | string;
  category: RinpoToolCategory;
  description: string;
  requiredPermission?: string;
  customerFacing?: boolean;
  ownerOnly?: boolean;
  /** Which vertical-specific executor handles this tool (undefined = the generic commerce/ops executor in tools.ts). */
  vertical?: "salon";
  /**
   * SENSITIVE tools with `requiresApproval: true` never execute directly
   * from a tool call — they create a pending `rinpo_actions` row instead
   * (see `@rinads/salon-server`'s `RinpoActionsRepository`) and only run
   * once an `org.manage` approver resolves it. `record_payment` is the one
   * documented exception: it is SENSITIVE (financial) but executes
   * immediately, because the caller already physically received the
   * funds — a second sign-off would break checkout, not secure it.
   */
  requiresApproval?: boolean;
};

const REGISTRY: RinpoToolDefinition[] = [
  { key: "similar_products", category: "READ", description: "Related catalog products", customerFacing: true },
  { key: "compare_variants", category: "READ", description: "Variant comparison for a product", customerFacing: true },
  { key: "add_to_cart", category: "DRAFT", description: "Add variant to cart (draft until checkout)", customerFacing: true },
  { key: "order_status", category: "READ", description: "Order tracking for customer", customerFacing: true },
  { key: "create_ticket", category: "DRAFT", description: "Create support ticket", customerFacing: true },
  { key: "ops_daily_briefing", category: "READ", description: "Owner operational daily brief", ownerOnly: true, requiredPermission: "org.manage" },
  { key: "ops_low_stock", category: "READ", description: "List low-stock SKUs", ownerOnly: true, requiredPermission: "org.manage" },
  { key: "ops_pending_po", category: "READ", description: "Purchase orders awaiting approval", ownerOnly: true, requiredPermission: "org.manage" },
  { key: "ops_propose_adjustment", category: "DRAFT", description: "Propose inventory adjustment", ownerOnly: true, requiredPermission: "org.manage" },
  { key: "ops_confirm_proposal", category: "ACTION", description: "Execute confirmed inventory adjustment", ownerOnly: true, requiredPermission: "org.manage" },

  // ---------------------------------------------------------------------
  // Salon READ tools (R GLOW Phase D) — org-membership + salon-staff
  // branch-scoping only, no approval needed.
  // ---------------------------------------------------------------------
  { key: "get_salon_business_summary", category: "READ", description: "What needs attention now: ranked signals across bookings, payments, and customers", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_today_appointments", category: "READ", description: "Today's appointments by status", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_staff_utilization", category: "READ", description: "Booked vs. available minutes per staff member", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_empty_slots", category: "READ", description: "Bookable empty slots today per staff member at a branch", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_customer_history", category: "READ", description: "A customer's visit history, spend, and preferences", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_reactivation_candidates", category: "READ", description: "Customers who haven't booked in N days", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_revenue_summary", category: "READ", description: "Revenue total for a date range", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_service_performance", category: "READ", description: "Booking counts per service", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_pending_payments", category: "READ", description: "Sales awaiting payment", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_customer_communication_preferences", category: "READ", description: "A customer's preferred channel and opt-out status", vertical: "salon", requiredPermission: "org.read" },

  // ---------------------------------------------------------------------
  // Salon WRITE/EXECUTE tools — permission-gated, executed immediately;
  // every execution writes a business_events row + rinpo_audit_log row.
  // ---------------------------------------------------------------------
  { key: "create_appointment", category: "WRITE", description: "Book an appointment for a customer", vertical: "salon", requiredPermission: "salon.pos.manage" },
  { key: "reschedule_appointment", category: "WRITE", description: "Move an appointment to a new time", vertical: "salon", requiredPermission: "salon.pos.manage" },
  { key: "cancel_appointment", category: "WRITE", description: "Cancel an appointment with a reason", vertical: "salon", requiredPermission: "salon.pos.manage" },
  { key: "create_customer_followup", category: "WRITE", description: "Create a follow-up staff task for a customer", vertical: "salon", requiredPermission: "salon.pos.manage" },
  { key: "send_appointment_confirmation", category: "WRITE", description: "Queue a booking confirmation message", vertical: "salon", requiredPermission: "salon.pos.manage" },
  { key: "send_appointment_reminder", category: "WRITE", description: "Queue an appointment reminder message", vertical: "salon", requiredPermission: "salon.pos.manage" },
  { key: "create_reactivation_campaign", category: "WRITE", description: "Queue reactivation messages for inactive customers", vertical: "salon", requiredPermission: "org.manage" },
  { key: "create_staff_task", category: "WRITE", description: "Assign a task to a staff member", vertical: "salon", requiredPermission: "salon.pos.manage" },
  { key: "create_customer_note", category: "WRITE", description: "Add a note to a customer record", vertical: "salon", requiredPermission: "salon.pos.manage" },
  { key: "issue_receipt_or_invoice", category: "WRITE", description: "Finalize a sale into an invoice/receipt", vertical: "salon", requiredPermission: "salon.pos.manage" },

  // ---------------------------------------------------------------------
  // Growth READ tools (R GLOW Phase E, Slice 1) — segmentation, campaign
  // performance, and growth-intelligence signals. Same org.read gate as
  // the rest of the salon READ tools.
  // ---------------------------------------------------------------------
  { key: "get_customer_segments", category: "READ", description: "List saved audience segments", vertical: "salon", requiredPermission: "org.read" },
  { key: "preview_segment", category: "READ", description: "Preview who matches a segment/campaign's criteria, including exclusions", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_campaign_performance", category: "READ", description: "Sent/delivered/failed/converted counts per campaign", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_message_failures", category: "READ", description: "Count of failed, dead-lettered, and not-configured outbound messages", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_retention_summary", category: "READ", description: "Repeat-visit rate across all customers", vertical: "salon", requiredPermission: "org.read" },
  { key: "get_growth_opportunities", category: "READ", description: "Ranked growth signals: message failures, pending campaign approvals, low repeat rate", vertical: "salon", requiredPermission: "org.read" },

  // ---------------------------------------------------------------------
  // Growth WRITE tools — drafting only, never sends anything. Gated by
  // salon.campaigns.manage (admin/manager only — see the migration's
  // permission note, bulk messaging is more sensitive than front-desk
  // POS ops).
  // ---------------------------------------------------------------------
  { key: "create_segment", category: "WRITE", description: "Save a reusable audience segment", vertical: "salon", requiredPermission: "salon.campaigns.manage" },
  { key: "create_campaign_draft", category: "WRITE", description: "Draft a campaign against a segment or ad-hoc criteria (does not send)", vertical: "salon", requiredPermission: "salon.campaigns.manage" },
  { key: "create_reactivation_draft", category: "WRITE", description: "Draft a reactivation campaign for customers inactive N+ days (does not send)", vertical: "salon", requiredPermission: "salon.campaigns.manage" },

  // ---------------------------------------------------------------------
  // Salon SENSITIVE tools
  // ---------------------------------------------------------------------
  { key: "record_payment", category: "SENSITIVE", description: "Record a cash/UPI/card/Razorpay payment against a sale", vertical: "salon", requiredPermission: "salon.pos.manage", requiresApproval: false },
  { key: "initiate_refund", category: "SENSITIVE", description: "Request a refund against a sale", vertical: "salon", requiredPermission: "salon.pos.manage", requiresApproval: true },
  // Requesting only needs pos.manage (front-desk staff can ask RINPO to
  // apply a price/discount change); *applying* it after approval still
  // goes through the normal RLS gate (org.manage for prices, pos.manage
  // for discounts — see updateServicePrice/applySaleLineDiscount), which
  // the approver (an admin with org.manage) always satisfies.
  { key: "modify_pricing", category: "SENSITIVE", description: "Change a service's price", vertical: "salon", requiredPermission: "salon.pos.manage", requiresApproval: true },
  { key: "modify_discount", category: "SENSITIVE", description: "Apply a discount to a sale line", vertical: "salon", requiredPermission: "salon.pos.manage", requiresApproval: true },

  // ---------------------------------------------------------------------
  // Growth SENSITIVE tools — requesting only needs salon.campaigns.manage
  // (a manager can ask RINPO to approve/send/retry); the actual DB write
  // on resolution is still gated by RLS (org.manage for
  // salon_campaigns_update_approve / salon_campaign_recipients, exactly
  // like modify_pricing/modify_discount above never re-check permissions
  // in application code — the approver's own RLS-enforced client is the
  // real gate).
  // ---------------------------------------------------------------------
  { key: "approve_campaign", category: "SENSITIVE", description: "Approve a drafted campaign so it can be sent", vertical: "salon", requiredPermission: "salon.campaigns.manage", requiresApproval: true },
  { key: "send_campaign", category: "SENSITIVE", description: "Send an approved campaign (re-validates the audience first)", vertical: "salon", requiredPermission: "salon.campaigns.manage", requiresApproval: true },
  { key: "send_reactivation_batch", category: "SENSITIVE", description: "Send an approved reactivation campaign", vertical: "salon", requiredPermission: "salon.campaigns.manage", requiresApproval: true },
  { key: "retry_failed_message", category: "SENSITIVE", description: "Retry a single failed/dead-lettered outbound message", vertical: "salon", requiredPermission: "salon.campaigns.manage", requiresApproval: true },
];

export function listRinpoTools(filter?: { ownerOnly?: boolean; customerFacing?: boolean; vertical?: "salon" }): RinpoToolDefinition[] {
  return REGISTRY.filter((t) => {
    if (filter?.ownerOnly && !t.ownerOnly) return false;
    if (filter?.customerFacing && !t.customerFacing) return false;
    if (filter?.vertical && t.vertical !== filter.vertical) return false;
    return true;
  });
}

export function getRinpoTool(key: string): RinpoToolDefinition | undefined {
  return REGISTRY.find((t) => t.key === key);
}

export function isRegisteredRinpoTool(key: string): boolean {
  return REGISTRY.some((t) => t.key === key);
}
