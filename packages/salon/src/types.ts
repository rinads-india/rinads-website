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

export type SalonCustomer = {
  id: string;
  organizationId: string;
  phone: string;
  name?: string;
  email?: string;
  notes?: string;
  marketingConsent: boolean;
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
