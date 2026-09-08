import type {
  AppointmentStatus,
  NoteEntityType,
  NoteStatus,
  NoteVisibility,
  PaymentMethod,
  PaymentStatus,
  PreferredChannel,
  RefundStatus,
  SaleStatus,
  SalonAppointment,
  SalonAppointmentService,
  SalonBranch,
  SalonCustomer,
  SalonNote,
  SalonPayment,
  SalonRefund,
  SalonSale,
  SalonSaleLine,
  SalonService,
  SalonStaff,
  WeeklyHours,
} from "@rinads/salon";
import type { SalonRow } from "./client";

function str(row: SalonRow, key: string): string {
  return String(row[key]);
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
