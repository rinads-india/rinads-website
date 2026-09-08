import {
  canTransitionAppointmentStatus,
  fail,
  ok,
  type AppointmentStatus,
  type BusyRange,
  type Result,
  type SalonAppointment,
  type SalonAppointmentService,
  type SalonBranch,
  type SalonCustomer,
  type SalonService,
  type SalonStaff,
  type WeeklyHours,
} from "@rinads/salon";
import type { SalonSupabaseClient } from "./client";
import {
  mapAppointmentRow,
  mapAppointmentServiceRow,
  mapBranchRow,
  mapCustomerRow,
  mapServiceRow,
  mapStaffRow,
} from "./mappers";

export type CreateBranchInput = {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  timezone?: string;
  workingHours?: WeeklyHours;
};

export type CreateServiceInput = {
  name: string;
  category?: string;
  description?: string;
  durationMin: number;
  price: number;
  currency?: string;
};

export type CreateStaffInput = {
  memberId?: string;
  branchId?: string;
  displayName: string;
  specialties?: string[];
  workingHours?: WeeklyHours;
};

export type CreateAppointmentInput = {
  branchId: string;
  staffId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  serviceIds: string[];
};

export type CreatePublicBookingInput = {
  organizationId: string;
  branchId: string;
  staffId: string;
  serviceIds: string[];
  startsAt: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
};

export type PublicBookingResult = {
  appointmentId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
};

export type AppointmentListFilter = {
  branchId?: string;
  staffId?: string;
  from?: string;
  to?: string;
};

/**
 * Direct-to-Supabase repository for the salon domain. Unlike the
 * commerce/operations packages this has no in-memory-first store: every
 * call reads or writes the `salon_*` tables straight away, so RLS is the
 * single source of authorization truth and there is no risk of an
 * in-memory tenant snapshot drifting from the database (see the R GLOW
 * production audit's durability warning).
 */
export class SalonRepository {
  constructor(private readonly client: SalonSupabaseClient) {}

  async listBranches(organizationId: string): Promise<Result<SalonBranch[]>> {
    const { data, error } = await this.client.from("salon_branches").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapBranchRow));
  }

  async createBranch(organizationId: string, input: CreateBranchInput): Promise<Result<SalonBranch>> {
    if (!input.name.trim()) return fail("invalid_input", "Branch name is required.");
    const { data, error } = await this.client
      .from("salon_branches")
      .insert({
        organization_id: organizationId,
        name: input.name.trim(),
        address: input.address ?? null,
        city: input.city ?? null,
        phone: input.phone ?? null,
        timezone: input.timezone ?? "Asia/Kolkata",
        working_hours: input.workingHours ?? {},
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No branch returned after insert.");
    return ok(mapBranchRow(data));
  }

  async listServices(organizationId: string): Promise<Result<SalonService[]>> {
    const { data, error } = await this.client.from("salon_services").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapServiceRow));
  }

  async createService(organizationId: string, input: CreateServiceInput): Promise<Result<SalonService>> {
    if (!input.name.trim()) return fail("invalid_input", "Service name is required.");
    if (input.durationMin <= 0) return fail("invalid_input", "Duration must be positive.");
    if (input.price < 0) return fail("invalid_input", "Price cannot be negative.");
    const { data, error } = await this.client
      .from("salon_services")
      .insert({
        organization_id: organizationId,
        name: input.name.trim(),
        category: input.category ?? "general",
        description: input.description ?? null,
        duration_min: input.durationMin,
        price: input.price,
        currency: input.currency ?? "INR",
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No service returned after insert.");
    return ok(mapServiceRow(data));
  }

  async listStaff(organizationId: string): Promise<Result<SalonStaff[]>> {
    const { data, error } = await this.client.from("salon_staff").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapStaffRow));
  }

  async createStaff(organizationId: string, input: CreateStaffInput): Promise<Result<SalonStaff>> {
    if (!input.displayName.trim()) return fail("invalid_input", "Staff display name is required.");
    const { data, error } = await this.client
      .from("salon_staff")
      .insert({
        organization_id: organizationId,
        member_id: input.memberId ?? null,
        branch_id: input.branchId ?? null,
        display_name: input.displayName.trim(),
        specialties: input.specialties ?? [],
        working_hours: input.workingHours ?? {},
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No staff record returned after insert.");
    return ok(mapStaffRow(data));
  }

  async listCustomers(organizationId: string): Promise<Result<SalonCustomer[]>> {
    const { data, error } = await this.client.from("salon_customers").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapCustomerRow));
  }

  async listAppointments(
    organizationId: string,
    filter: AppointmentListFilter = {}
  ): Promise<Result<SalonAppointment[]>> {
    const { data, error } = await this.client.from("salon_appointments").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    let rows = (data ?? []).map(mapAppointmentRow);
    if (filter.branchId) rows = rows.filter((r) => r.branchId === filter.branchId);
    if (filter.staffId) rows = rows.filter((r) => r.staffId === filter.staffId);
    if (filter.from) {
      const fromMs = new Date(filter.from).getTime();
      rows = rows.filter((r) => new Date(r.startsAt).getTime() >= fromMs);
    }
    if (filter.to) {
      const toMs = new Date(filter.to).getTime();
      rows = rows.filter((r) => new Date(r.startsAt).getTime() < toMs);
    }
    return ok(rows.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
  }

  /** Front-desk / owner-console booking. Relies on the DB EXCLUDE constraint to reject double-booking. */
  async createAppointment(
    organizationId: string,
    input: CreateAppointmentInput
  ): Promise<Result<SalonAppointment & { services: SalonAppointmentService[] }>> {
    if (!input.serviceIds.length) return fail("invalid_input", "At least one service is required.");

    const { data, error } = await this.client
      .from("salon_appointments")
      .insert({
        organization_id: organizationId,
        branch_id: input.branchId,
        staff_id: input.staffId,
        customer_id: input.customerId,
        status: "pending",
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (error) {
      const message = /exclusion|conflict/i.test(error.message)
        ? "This staff member already has an appointment overlapping this time."
        : error.message;
      return fail("db_error", message);
    }
    if (!data) return fail("db_error", "No appointment returned after insert.");

    const appointment = mapAppointmentRow(data);
    const services: SalonAppointmentService[] = [];
    for (const serviceId of input.serviceIds) {
      const svcResult = await this.client
        .from("salon_appointment_services")
        .insert({
          organization_id: organizationId,
          appointment_id: appointment.id,
          service_id: serviceId,
          price_at_booking: 0,
          duration_min_at_booking: 0,
        })
        .select("*")
        .single();
      if (svcResult.error) return fail("db_error", svcResult.error.message);
      if (svcResult.data) services.push(mapAppointmentServiceRow(svcResult.data));
    }

    return ok({ ...appointment, services });
  }

  async updateAppointmentStatus(
    appointmentId: string,
    fromStatus: AppointmentStatus,
    toStatus: AppointmentStatus
  ): Promise<Result<true>> {
    if (!canTransitionAppointmentStatus(fromStatus, toStatus)) {
      return fail("invalid_transition", `Cannot move an appointment from "${fromStatus}" to "${toStatus}".`);
    }
    const { error } = await this.client.from("salon_appointments").update({ status: toStatus }).eq("id", appointmentId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  /** Anonymous availability lookup — calls `get_public_salon_busy_slots`, never reads the table directly. */
  async getPublicBusySlots(
    organizationId: string,
    staffId: string,
    from: string,
    to: string
  ): Promise<Result<BusyRange[]>> {
    const { data, error } = await this.client.rpc("get_public_salon_busy_slots", {
      p_organization_id: organizationId,
      p_staff_id: staffId,
      p_from: from,
      p_to: to,
    });
    if (error) return fail("db_error", error.message);
    const rows = (data as Array<{ starts_at: string; ends_at: string }> | null) ?? [];
    return ok(rows.map((r) => ({ start: r.starts_at, end: r.ends_at })));
  }

  /** Anonymous booking — calls `create_public_salon_booking`, which enforces the double-booking guard server-side. */
  async createPublicBooking(input: CreatePublicBookingInput): Promise<Result<PublicBookingResult>> {
    if (!input.serviceIds.length) return fail("invalid_input", "At least one service is required.");
    if (!input.customerPhone.trim()) return fail("invalid_input", "Phone number is required.");

    const { data, error } = await this.client.rpc("create_public_salon_booking", {
      p_organization_id: input.organizationId,
      p_branch_id: input.branchId,
      p_staff_id: input.staffId,
      p_service_ids: input.serviceIds,
      p_starts_at: input.startsAt,
      p_customer_phone: input.customerPhone.trim(),
      p_customer_name: input.customerName ?? null,
      p_customer_email: input.customerEmail ?? null,
      p_notes: input.notes ?? null,
    });
    if (error) return fail("booking_failed", error.message);

    const row = data as { appointment_id: string; customer_id: string; starts_at: string; ends_at: string } | null;
    if (!row) return fail("booking_failed", "No booking confirmation returned.");
    return ok({
      appointmentId: row.appointment_id,
      customerId: row.customer_id,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    });
  }
}
