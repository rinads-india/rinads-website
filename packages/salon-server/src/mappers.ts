import type {
  AppointmentStatus,
  CampaignChannel,
  CampaignStatus,
  CampaignType,
  NoteEntityType,
  NoteStatus,
  NoteVisibility,
  PaymentMethod,
  PaymentStatus,
  PreferredChannel,
  RecipientStatus,
  RefundStatus,
  SaleStatus,
  SalonAppointment,
  SalonAppointmentService,
  SalonBranch,
  SalonCampaign,
  SalonCampaignRecipient,
  SalonCustomer,
  SalonFeedback,
  SalonNote,
  SalonPayment,
  SalonRefund,
  SalonSale,
  SalonSaleLine,
  SalonSegment,
  SalonLoyaltyAccount,
  SalonLoyaltyLedgerEntry,
  SalonLoyaltyProgram,
  SalonLoyaltyRedemption,
  SalonService,
  SalonStaff,
  SegmentCriteria,
  WeeklyHours,
} from "@rinads/salon";
import type { SalonRow } from "./client";

function str(row: SalonRow, key: string): string {
  return String(row[key]);
}

export function mapLoyaltyProgramRow(row: SalonRow): SalonLoyaltyProgram {
  return {
    id: str(row, "id"), organizationId: str(row, "organization_id"), name: str(row, "name"),
    isActive: Boolean(row.is_active), currency: str(row, "currency"),
    earnCurrencyUnits: Number(row.earn_currency_units), earnPoints: Number(row.earn_points),
    pointsPerCurrencyUnit: Number(row.points_per_currency_unit),
    tiers: Array.isArray(row.tiers) ? row.tiers as SalonLoyaltyProgram["tiers"] : [],
    createdAt: optStr(row, "created_at"), updatedAt: optStr(row, "updated_at"),
  };
}

export function mapLoyaltyAccountRow(row: SalonRow): SalonLoyaltyAccount {
  return {
    id: str(row, "id"), organizationId: str(row, "organization_id"), programId: str(row, "program_id"),
    customerId: str(row, "customer_id"), lifetimeEarnedPoints: Number(row.lifetime_earned_points ?? 0),
    createdAt: optStr(row, "created_at"), updatedAt: optStr(row, "updated_at"),
  };
}

export function mapLoyaltyLedgerRow(row: SalonRow): SalonLoyaltyLedgerEntry {
  return {
    id: str(row, "id"), organizationId: str(row, "organization_id"), accountId: str(row, "account_id"),
    entryType: str(row, "entry_type") as SalonLoyaltyLedgerEntry["entryType"], points: Number(row.points),
    saleId: optStr(row, "sale_id"), refundId: optStr(row, "refund_id"), redemptionId: optStr(row, "redemption_id"),
    reason: optStr(row, "reason"), idempotencyKey: str(row, "idempotency_key"),
    createdBy: optStr(row, "created_by"), createdAt: optStr(row, "created_at"),
  };
}

export function mapLoyaltyRedemptionRow(row: SalonRow): SalonLoyaltyRedemption {
  return {
    id: str(row, "id"), organizationId: str(row, "organization_id"), accountId: str(row, "account_id"),
    saleId: optStr(row, "sale_id"), points: Number(row.points), currencyValue: Number(row.currency_value),
    status: str(row, "status") as SalonLoyaltyRedemption["status"], idempotencyKey: str(row, "idempotency_key"),
    createdBy: optStr(row, "created_by"), createdAt: optStr(row, "created_at"),
  };
}

function optStr(row: SalonRow, key: string): string | undefined {
  const v = row[key];
  return v === null || v === undefined ? undefined : String(v);
}

function asWeeklyHours(value: unknown): WeeklyHours {
  return (value as WeeklyHours) ?? {};
}

export function mapBranchRow(row: SalonRow): SalonBranch {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    name: str(row, "name"),
    address: optStr(row, "address"),
    city: optStr(row, "city"),
    phone: optStr(row, "phone"),
    timezone: str(row, "timezone"),
    workingHours: asWeeklyHours(row.working_hours),
    isActive: Boolean(row.is_active),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapServiceRow(row: SalonRow): SalonService {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    name: str(row, "name"),
    category: str(row, "category"),
    description: optStr(row, "description"),
    durationMin: Number(row.duration_min),
    bufferMin: Number(row.buffer_min ?? 0),
    price: Number(row.price),
    currency: str(row, "currency"),
    isActive: Boolean(row.is_active),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapStaffRow(row: SalonRow): SalonStaff {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    memberId: optStr(row, "member_id"),
    branchId: optStr(row, "branch_id"),
    displayName: str(row, "display_name"),
    specialties: Array.isArray(row.specialties) ? (row.specialties as string[]) : [],
    workingHours: asWeeklyHours(row.working_hours),
    isActive: Boolean(row.is_active),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapCustomerRow(row: SalonRow): SalonCustomer {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    phone: str(row, "phone"),
    name: optStr(row, "name"),
    email: optStr(row, "email"),
    notes: optStr(row, "notes"),
    marketingConsent: Boolean(row.marketing_consent),
    preferredChannel: (optStr(row, "preferred_channel") as PreferredChannel | undefined) ?? "whatsapp",
    optedOutAt: optStr(row, "opted_out_at"),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapAppointmentRow(row: SalonRow): SalonAppointment {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    branchId: str(row, "branch_id"),
    staffId: str(row, "staff_id"),
    customerId: str(row, "customer_id"),
    status: str(row, "status") as AppointmentStatus,
    startsAt: str(row, "starts_at"),
    endsAt: str(row, "ends_at"),
    notes: optStr(row, "notes"),
    bookingNumber: optStr(row, "booking_number"),
    cancelReason: optStr(row, "cancel_reason"),
    idempotencyKey: optStr(row, "idempotency_key"),
    createdBy: optStr(row, "created_by"),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapAppointmentServiceRow(row: SalonRow): SalonAppointmentService {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    appointmentId: str(row, "appointment_id"),
    serviceId: str(row, "service_id"),
    priceAtBooking: Number(row.price_at_booking),
    durationMinAtBooking: Number(row.duration_min_at_booking),
  };
}

export function mapSaleRow(row: SalonRow): SalonSale {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    branchId: str(row, "branch_id"),
    appointmentId: optStr(row, "appointment_id"),
    customerId: optStr(row, "customer_id"),
    staffId: optStr(row, "staff_id"),
    status: str(row, "status") as SaleStatus,
    saleNumber: optStr(row, "sale_number"),
    subtotal: Number(row.subtotal ?? 0),
    discountTotal: Number(row.discount_total ?? 0),
    taxTotal: Number(row.tax_total ?? 0),
    total: Number(row.total ?? 0),
    currency: str(row, "currency"),
    createdBy: optStr(row, "created_by"),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapSaleLineRow(row: SalonRow): SalonSaleLine {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    saleId: str(row, "sale_id"),
    appointmentServiceId: optStr(row, "appointment_service_id"),
    serviceId: optStr(row, "service_id"),
    description: str(row, "description"),
    quantity: Number(row.quantity ?? 1),
    unitPrice: Number(row.unit_price ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    taxRatePct: Number(row.tax_rate_pct ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    lineTotal: Number(row.line_total ?? 0),
    createdAt: optStr(row, "created_at"),
  };
}

export function mapPaymentRow(row: SalonRow): SalonPayment {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    saleId: str(row, "sale_id"),
    method: str(row, "method") as PaymentMethod,
    provider: optStr(row, "provider"),
    providerReference: optStr(row, "provider_reference"),
    amount: Number(row.amount ?? 0),
    currency: str(row, "currency"),
    status: str(row, "status") as PaymentStatus,
    idempotencyKey: str(row, "idempotency_key"),
    recordedBy: optStr(row, "recorded_by"),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapRefundRow(row: SalonRow): SalonRefund {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    saleId: str(row, "sale_id"),
    paymentId: optStr(row, "payment_id"),
    amount: Number(row.amount ?? 0),
    reason: str(row, "reason"),
    status: str(row, "status") as RefundStatus,
    requestedBy: optStr(row, "requested_by"),
    approvedBy: optStr(row, "approved_by"),
    processedAt: optStr(row, "processed_at"),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapNoteRow(row: SalonRow): SalonNote {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    entityType: str(row, "entity_type") as NoteEntityType,
    entityId: str(row, "entity_id"),
    body: str(row, "body"),
    visibility: str(row, "visibility") as NoteVisibility,
    status: str(row, "status") as NoteStatus,
    assignedTo: optStr(row, "assigned_to"),
    dueAt: optStr(row, "due_at"),
    createdBy: optStr(row, "created_by"),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapFeedbackRow(row: SalonRow): SalonFeedback {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    reviewRequestId: str(row, "review_request_id"),
    appointmentId: str(row, "appointment_id"),
    customerId: str(row, "customer_id"),
    rating: Number(row.rating),
    comment: optStr(row, "comment"),
    status: str(row, "status") as SalonFeedback["status"],
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapSegmentRow(row: SalonRow): SalonSegment {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    name: str(row, "name"),
    criteria: (row.criteria as SegmentCriteria) ?? {},
    createdBy: optStr(row, "created_by"),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapCampaignRow(row: SalonRow): SalonCampaign {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    name: str(row, "name"),
    segmentId: optStr(row, "segment_id"),
    criteria: (row.criteria as SegmentCriteria) ?? {},
    campaignType: str(row, "campaign_type") as CampaignType,
    channel: str(row, "channel") as CampaignChannel,
    templateKey: str(row, "template_key"),
    messageBody: str(row, "message_body"),
    status: str(row, "status") as CampaignStatus,
    scheduledAt: optStr(row, "scheduled_at"),
    createdBy: optStr(row, "created_by"),
    approvedBy: optStr(row, "approved_by"),
    approvedAt: optStr(row, "approved_at"),
    estimatedAudience: Number(row.estimated_audience ?? 0),
    attemptedCount: Number(row.attempted_count ?? 0),
    sentCount: Number(row.sent_count ?? 0),
    deliveredCount: Number(row.delivered_count ?? 0),
    failedCount: Number(row.failed_count ?? 0),
    convertedCount: Number(row.converted_count ?? 0),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}

export function mapCampaignRecipientRow(row: SalonRow): SalonCampaignRecipient {
  return {
    id: str(row, "id"),
    organizationId: str(row, "organization_id"),
    campaignId: str(row, "campaign_id"),
    customerId: str(row, "customer_id"),
    notificationOutboxId: optStr(row, "notification_outbox_id"),
    status: str(row, "status") as RecipientStatus,
    skipReason: optStr(row, "skip_reason"),
    convertedAt: optStr(row, "converted_at"),
    convertedAppointmentId: optStr(row, "converted_appointment_id"),
    createdAt: optStr(row, "created_at"),
    updatedAt: optStr(row, "updated_at"),
  };
}
