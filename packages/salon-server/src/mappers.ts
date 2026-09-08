import type {
  AppointmentStatus,
  SalonAppointment,
  SalonAppointmentService,
  SalonBranch,
  SalonCustomer,
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
