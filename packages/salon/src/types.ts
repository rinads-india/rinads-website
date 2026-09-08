export type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: string, message: string, fieldErrors?: Record<string, string>): Result<T> {
  return { ok: false, error: { code, message, fieldErrors } };
}

export type SalonContext = {
  organizationId: string;
  userId?: string;
  roleKey?: string;
};

/** "HH:MM" 24h, e.g. "10:00". */
export type TimeOfDay = string;

export type DayHours = { open: TimeOfDay; close: TimeOfDay } | null;

export type WeeklyHours = Partial<{
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
}>;

export const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  mon: { open: "10:00", close: "20:00" },
  tue: { open: "10:00", close: "20:00" },
  wed: { open: "10:00", close: "20:00" },
  thu: { open: "10:00", close: "20:00" },
  fri: { open: "10:00", close: "20:00" },
  sat: { open: "10:00", close: "20:00" },
  sun: null,
};

export type SalonBranch = {
  id: string;
  organizationId: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  timezone: string;
  workingHours: WeeklyHours;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SalonService = {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  description?: string;
  durationMin: number;
  /** Minutes blocked after the service for cleanup/prep, before the next booking can start. */
  bufferMin: number;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SalonStaff = {
  id: string;
  organizationId: string;
  memberId?: string;
  branchId?: string;
  displayName: string;
  specialties: string[];
  workingHours: WeeklyHours;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PreferredChannel = "whatsapp" | "sms" | "email" | "none";

export type SalonCustomer = {
  id: string;
  organizationId: string;
  phone: string;
  name?: string;
  email?: string;
  notes?: string;
  marketingConsent: boolean;
  preferredChannel: PreferredChannel;
  optedOutAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_service"
  | "completed"
  | "cancelled"
  | "no_show";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_service",
  "completed",
  "cancelled",
  "no_show",
];

export type SalonAppointment = {
  id: string;
  organizationId: string;
  branchId: string;
  staffId: string;
  customerId: string;
  status: AppointmentStatus;
  /** ISO 8601 timestamp. */
  startsAt: string;
  /** ISO 8601 timestamp. */
  endsAt: string;
  notes?: string;
  bookingNumber?: string;
  cancelReason?: string;
  idempotencyKey?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SalonAppointmentService = {
  id: string;
  organizationId: string;
  appointmentId: string;
  serviceId: string;
  priceAtBooking: number;
  durationMinAtBooking: number;
};

export type AppointmentWithServices = SalonAppointment & {
  services: SalonAppointmentService[];
};

export type TimeRange = {
  /** ISO 8601 timestamp. */
  start: string;
  /** ISO 8601 timestamp. */
  end: string;
};

// ---------------------------------------------------------------------------
// POS / checkout (Part B)
// ---------------------------------------------------------------------------

export type SaleStatus = "draft" | "awaiting_payment" | "paid" | "partially_refunded" | "refunded" | "void";

export const SALE_STATUSES: SaleStatus[] = [
  "draft",
  "awaiting_payment",
  "paid",
  "partially_refunded",
  "refunded",
  "void",
];

export type SalonSale = {
  id: string;
  organizationId: string;
  branchId: string;
  appointmentId?: string;
  customerId?: string;
  staffId?: string;
  status: SaleStatus;
  saleNumber?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SalonSaleLine = {
  id: string;
  organizationId: string;
  saleId: string;
  appointmentServiceId?: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRatePct: number;
  taxAmount: number;
  lineTotal: number;
  createdAt?: string;
};

export type SaleWithLines = SalonSale & { lines: SalonSaleLine[] };

export type PaymentMethod = "cash" | "upi" | "card" | "razorpay";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type SalonPayment = {
  id: string;
  organizationId: string;
  saleId: string;
  method: PaymentMethod;
  provider?: string;
  providerReference?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  recordedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RefundStatus = "pending" | "approved" | "processed" | "rejected";

export type SalonRefund = {
  id: string;
  organizationId: string;
  saleId: string;
  paymentId?: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  requestedBy?: string;
  approvedBy?: string;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Mirrors RefundService's pending -> approved -> processed state machine. */
const REFUND_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["processed", "rejected"],
  processed: [],
  rejected: [],
};

export function canTransitionRefundStatus(from: RefundStatus, to: RefundStatus): boolean {
  if (from === to) return false;
  return REFUND_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Notes / staff tasks (Part A)
// ---------------------------------------------------------------------------

export type NoteEntityType = "appointment" | "customer" | "staff_task";
export type NoteVisibility = "internal" | "customer_visible";
export type NoteStatus = "open" | "done" | "cancelled";

export type SalonNote = {
  id: string;
  organizationId: string;
  entityType: NoteEntityType;
  entityId: string;
  body: string;
  visibility: NoteVisibility;
  status: NoteStatus;
  assignedTo?: string;
  dueAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ---------------------------------------------------------------------------
// Customer relationship layer (Part C)
// ---------------------------------------------------------------------------

export type CustomerSpendSummary = {
  customerId: string;
  totalSpend: number;
  visitCount: number;
  lastVisitAt?: string;
  currency: string;
};

export type CustomerProfile = {
  customer: SalonCustomer;
  spend: CustomerSpendSummary;
  history: AppointmentWithServices[];
  notes: SalonNote[];
  preferredStaffId?: string;
  preferredServiceId?: string;
};
