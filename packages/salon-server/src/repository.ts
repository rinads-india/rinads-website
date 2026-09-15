import {
  canRescheduleAppointment,
  canTransitionAppointmentStatus,
  canTransitionRefundStatus,
  fail,
  ok,
  type AppointmentStatus,
  type AppointmentWithServices,
  type BusyRange,
  type CustomerProfile,
  type CustomerSpendSummary,
  type NoteEntityType,
  type NoteStatus,
  type NoteVisibility,
  type PaymentMethod,
  type PreferredChannel,
  type Result,
  type SalonAppointment,
  type SalonAppointmentService,
  type SalonBranch,
  type SalonCustomer,
  type SalonNote,
  type SalonPayment,
  type SalonRefund,
  type SalonSale,
  type SalonSaleLine,
  type SalonService,
  type SalonStaff,
  type SaleWithLines,
  type WeeklyHours,
} from "@rinads/salon";
import type { SalonRow, SalonSupabaseClient } from "./client";
import {
  mapAppointmentRow,
  mapAppointmentServiceRow,
  mapBranchRow,
  mapCustomerRow,
  mapNoteRow,
  mapPaymentRow,
  mapRefundRow,
  mapSaleLineRow,
  mapSaleRow,
  mapServiceRow,
  mapStaffRow,
} from "./mappers";

export type PublicSalonOrganization = {
  organizationId: string;
  name: string;
  slug: string;
};

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
  bufferMin?: number;
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
  idempotencyKey?: string;
};

export type PublicBookingResult = {
  appointmentId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  bookingNumber?: string;
  idempotentReplay: boolean;
};

export type AppointmentListFilter = {
  branchId?: string;
  staffId?: string;
  customerId?: string;
  from?: string;
  to?: string;
};

export type CreateNoteInput = {
  entityType: NoteEntityType;
  entityId: string;
  body: string;
  visibility?: NoteVisibility;
  assignedTo?: string;
  dueAt?: string;
  createdBy?: string;
};

export type CreateSaleInput = {
  branchId: string;
  appointmentId?: string;
  customerId?: string;
  staffId?: string;
  createdBy?: string;
};

export type AddSaleLineInput = {
  serviceId?: string;
  appointmentServiceId?: string;
  description: string;
  quantity?: number;
  unitPrice: number;
  discountAmount?: number;
};

export type RecordPaymentInput = {
  method: PaymentMethod;
  amount: number;
  currency?: string;
  provider?: string;
  providerReference?: string;
  idempotencyKey: string;
  recordedBy?: string;
  status?: "pending" | "succeeded" | "failed";
};

export type RequestRefundInput = {
  saleId: string;
  paymentId?: string;
  amount: number;
  reason: string;
  requestedBy?: string;
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

  /** Direct insert into the existing `rinpo_audit_log` table — every RINPO WRITE/EXECUTE tool call is audited here. */
  async writeRinpoAuditLog(
    organizationId: string,
    entry: { actorId?: string; action: string; resourceType: string; resourceId: string; metadata?: Record<string, unknown> }
  ): Promise<void> {
    await this.client.from("rinpo_audit_log").insert({
      organization_id: organizationId,
      actor_type: "rinpo",
      actor_id: entry.actorId ?? null,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      metadata: entry.metadata ?? {},
    });
  }

  /** Price override — gated at the RLS layer by `org.manage`; RINPO's `modify_pricing` tool only calls this after approval. */
  async updateServicePrice(serviceId: string, newPrice: number): Promise<Result<true>> {
    if (newPrice < 0) return fail("invalid_input", "Price cannot be negative.");
    const { error } = await this.client.from("salon_services").update({ price: newPrice }).eq("id", serviceId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  async getAppointment(appointmentId: string): Promise<Result<SalonAppointment>> {
    const { data, error } = await this.client.from("salon_appointments").select("*").eq("id", appointmentId).maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "Appointment not found.");
    return ok(mapAppointmentRow(data));
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
        buffer_min: input.bufferMin ?? 0,
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

  /** Editable working-hours grid for a branch (Part A gap: previously write-only at creation time). */
  async updateBranchWorkingHours(branchId: string, workingHours: WeeklyHours): Promise<Result<true>> {
    const { error } = await this.client.from("salon_branches").update({ working_hours: workingHours }).eq("id", branchId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  /** Editable working-hours grid for a staff member — intersected with branch hours at slot-generation time. */
  async updateStaffWorkingHours(staffId: string, workingHours: WeeklyHours): Promise<Result<true>> {
    const { error } = await this.client.from("salon_staff").update({ working_hours: workingHours }).eq("id", staffId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  async listCustomers(organizationId: string): Promise<Result<SalonCustomer[]>> {
    const { data, error } = await this.client.from("salon_customers").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapCustomerRow));
  }

  async getCustomer(customerId: string): Promise<Result<SalonCustomer>> {
    const { data, error } = await this.client.from("salon_customers").select("*").eq("id", customerId).maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "Customer not found.");
    return ok(mapCustomerRow(data));
  }

  /** Front-desk / POS walk-in customer lookup-or-create by phone (mirrors the public booking RPC's upsert). */
  async upsertCustomerByPhone(
    organizationId: string,
    input: { phone: string; name?: string; email?: string }
  ): Promise<Result<SalonCustomer>> {
    const phone = input.phone.trim();
    if (!phone) return fail("invalid_input", "Phone number is required.");
    const { data, error } = await this.client
      .from("salon_customers")
      .upsert(
        { organization_id: organizationId, phone, name: input.name ?? null, email: input.email ?? null },
        { onConflict: "organization_id,phone" }
      )
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No customer returned after upsert.");
    return ok(mapCustomerRow(data));
  }

  async updateCustomerCommunicationPreferences(
    customerId: string,
    input: { preferredChannel?: PreferredChannel; optedOutAt?: string | null }
  ): Promise<Result<true>> {
    const patch: SalonRow = {};
    if (input.preferredChannel) patch.preferred_channel = input.preferredChannel;
    if (input.optedOutAt !== undefined) patch.opted_out_at = input.optedOutAt;
    const { error } = await this.client.from("salon_customers").update(patch).eq("id", customerId);
    if (error) return fail("db_error", error.message);
    return ok(true);
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
    if (filter.customerId) rows = rows.filter((r) => r.customerId === filter.customerId);
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

  async listAppointmentServices(appointmentId: string): Promise<Result<SalonAppointmentService[]>> {
    const { data, error } = await this.client
      .from("salon_appointment_services")
      .select("*")
      .eq("appointment_id", appointmentId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapAppointmentServiceRow));
  }

  /** Org-wide listing (denormalized organization_id column) — used by intelligence/service-performance signals. */
  async listAllAppointmentServices(organizationId: string): Promise<Result<SalonAppointmentService[]>> {
    const { data, error } = await this.client
      .from("salon_appointment_services")
      .select("*")
      .eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapAppointmentServiceRow));
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
    toStatus: AppointmentStatus,
    cancelReason?: string
  ): Promise<Result<true>> {
    if (!canTransitionAppointmentStatus(fromStatus, toStatus)) {
      return fail("invalid_transition", `Cannot move an appointment from "${fromStatus}" to "${toStatus}".`);
    }
    const patch: SalonRow = { status: toStatus };
    if (toStatus === "cancelled" && cancelReason) patch.cancel_reason = cancelReason;
    const { error } = await this.client.from("salon_appointments").update(patch).eq("id", appointmentId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  /**
   * Reschedule: only allowed from `pending`/`confirmed` (per the state
   * machine's `canRescheduleAppointment`). Relies on the same DB EXCLUDE
   * constraint as booking to reject a conflicting new time — this never
   * bypasses that guard.
   */
  async rescheduleAppointment(
    appointmentId: string,
    currentStatus: AppointmentStatus,
    newStartsAt: string,
    newEndsAt: string
  ): Promise<Result<true>> {
    if (!canRescheduleAppointment(currentStatus)) {
      return fail("invalid_transition", `Cannot reschedule an appointment in "${currentStatus}" status.`);
    }
    const { error } = await this.client
      .from("salon_appointments")
      .update({ starts_at: newStartsAt, ends_at: newEndsAt })
      .eq("id", appointmentId);
    if (error) {
      const message = /exclusion|conflict/i.test(error.message)
        ? "This staff member already has an appointment overlapping the new time."
        : error.message;
      return fail("db_error", message);
    }
    return ok(true);
  }

  // -------------------------------------------------------------------------
  // Notes / staff tasks (Part A) — one polymorphic table for appointment
  // notes, customer notes, and staff tasks.
  // -------------------------------------------------------------------------

  async createNote(organizationId: string, input: CreateNoteInput): Promise<Result<SalonNote>> {
    if (!input.body.trim()) return fail("invalid_input", "Note body is required.");
    const { data, error } = await this.client
      .from("salon_notes")
      .insert({
        organization_id: organizationId,
        entity_type: input.entityType,
        entity_id: input.entityId,
        body: input.body.trim(),
        visibility: input.visibility ?? "internal",
        status: "open",
        assigned_to: input.assignedTo ?? null,
        due_at: input.dueAt ?? null,
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No note returned after insert.");
    return ok(mapNoteRow(data));
  }

  async listNotes(entityType: NoteEntityType, entityId: string): Promise<Result<SalonNote[]>> {
    const { data, error } = await this.client
      .from("salon_notes")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapNoteRow));
  }

  async listOpenStaffTasks(organizationId: string): Promise<Result<SalonNote[]>> {
    const { data, error } = await this.client
      .from("salon_notes")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("entity_type", "staff_task")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapNoteRow));
  }

  async updateNoteStatus(noteId: string, status: NoteStatus): Promise<Result<true>> {
    const { error } = await this.client.from("salon_notes").update({ status }).eq("id", noteId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  // -------------------------------------------------------------------------
  // Customer relationship layer (Part C)
  // -------------------------------------------------------------------------

  async getCustomerSpendSummary(customerId: string): Promise<Result<CustomerSpendSummary>> {
    const { data, error } = await this.client.from("salon_sales").select("*").eq("customer_id", customerId);
    if (error) return fail("db_error", error.message);
    const sales = (data ?? [])
      .map(mapSaleRow)
      .filter((s) => s.status === "paid" || s.status === "partially_refunded" || s.status === "refunded");
    const totalSpend = sales.reduce((sum, s) => sum + s.total, 0);
    const dates = sales.map((s) => s.createdAt).filter((d): d is string => Boolean(d)).sort();
    return ok({
      customerId,
      totalSpend,
      visitCount: sales.length,
      lastVisitAt: dates.length ? dates[dates.length - 1] : undefined,
      currency: sales[0]?.currency ?? "INR",
    });
  }

  /** Full profile for the `/clients/[id]` console page and RINPO's `get_customer_history` tool. */
  async getCustomerProfile(organizationId: string, customerId: string): Promise<Result<CustomerProfile>> {
    const customerResult = await this.getCustomer(customerId);
    if (!customerResult.ok) return customerResult;

    const [appointmentsResult, spendResult, notesResult] = await Promise.all([
      this.listAppointments(organizationId, { customerId }),
      this.getCustomerSpendSummary(customerId),
      this.listNotes("customer", customerId),
    ]);
    if (!appointmentsResult.ok) return appointmentsResult;
    if (!spendResult.ok) return spendResult;
    if (!notesResult.ok) return notesResult;

    const history: AppointmentWithServices[] = [];
    const staffCount = new Map<string, number>();
    const serviceCount = new Map<string, number>();
    for (const appt of appointmentsResult.data) {
      const servicesResult = await this.listAppointmentServices(appt.id);
      const services = servicesResult.ok ? servicesResult.data : [];
      history.push({ ...appt, services });
      staffCount.set(appt.staffId, (staffCount.get(appt.staffId) ?? 0) + 1);
      for (const svc of services) serviceCount.set(svc.serviceId, (serviceCount.get(svc.serviceId) ?? 0) + 1);
    }

    const preferredStaffId = [...staffCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const preferredServiceId = [...serviceCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return ok({
      customer: customerResult.data,
      spend: spendResult.data,
      history: history.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()),
      notes: notesResult.data,
      preferredStaffId,
      preferredServiceId,
    });
  }

  /**
   * Customers whose most recent non-cancelled appointment is older than
   * `daysInactive` days. Excludes customers with no prior appointment at
   * all — there's no "reactivation" evidence for someone who never booked.
   */
  async getReactivationCandidates(
    organizationId: string,
    daysInactive: number
  ): Promise<Result<Array<{ customer: SalonCustomer; lastVisitAt: string }>>> {
    const [customersResult, appointmentsResult] = await Promise.all([
      this.listCustomers(organizationId),
      this.listAppointments(organizationId),
    ]);
    if (!customersResult.ok) return customersResult;
    if (!appointmentsResult.ok) return appointmentsResult;

    const lastVisitByCustomer = new Map<string, string>();
    for (const appt of appointmentsResult.data) {
      if (appt.status === "cancelled") continue;
      const existing = lastVisitByCustomer.get(appt.customerId);
      if (!existing || new Date(appt.startsAt).getTime() > new Date(existing).getTime()) {
        lastVisitByCustomer.set(appt.customerId, appt.startsAt);
      }
    }

    const cutoffMs = Date.now() - daysInactive * 24 * 60 * 60 * 1000;
    const candidates: Array<{ customer: SalonCustomer; lastVisitAt: string }> = [];
    for (const customer of customersResult.data) {
      const lastVisitAt = lastVisitByCustomer.get(customer.id);
      if (lastVisitAt && new Date(lastVisitAt).getTime() < cutoffMs) {
        candidates.push({ customer, lastVisitAt });
      }
    }
    return ok(candidates.sort((a, b) => new Date(a.lastVisitAt).getTime() - new Date(b.lastVisitAt).getTime()));
  }

  // -------------------------------------------------------------------------
  // POS / checkout (Part B) — server-authoritative: finalizeSale() always
  // recomputes totals from current salon_sale_lines + salon_services.price,
  // never trusting a client-submitted total.
  // -------------------------------------------------------------------------

  async createSale(organizationId: string, input: CreateSaleInput): Promise<Result<SalonSale>> {
    const { data, error } = await this.client
      .from("salon_sales")
      .insert({
        organization_id: organizationId,
        branch_id: input.branchId,
        appointment_id: input.appointmentId ?? null,
        customer_id: input.customerId ?? null,
        staff_id: input.staffId ?? null,
        status: "draft",
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No sale returned after insert.");
    return ok(mapSaleRow(data));
  }

  /** Convenience: start a sale pre-filled from an appointment's booked services at their booking-time price. */
  async createSaleFromAppointment(
    organizationId: string,
    appointment: SalonAppointment,
    createdBy?: string
  ): Promise<Result<SaleWithLines>> {
    const saleResult = await this.createSale(organizationId, {
      branchId: appointment.branchId,
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      staffId: appointment.staffId,
      createdBy,
    });
    if (!saleResult.ok) return saleResult;

    const servicesResult = await this.listAppointmentServices(appointment.id);
    const services = servicesResult.ok ? servicesResult.data : [];
    const lines: SalonSaleLine[] = [];
    for (const svc of services) {
      const lineResult = await this.addSaleLine(organizationId, saleResult.data.id, {
        serviceId: svc.serviceId,
        appointmentServiceId: svc.id,
        description: "Service",
        unitPrice: svc.priceAtBooking,
      });
      if (lineResult.ok) lines.push(lineResult.data);
    }
    return ok({ ...saleResult.data, lines });
  }

  async getSale(saleId: string): Promise<Result<SaleWithLines>> {
    const { data, error } = await this.client.from("salon_sales").select("*").eq("id", saleId).maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "Sale not found.");
    const linesResult = await this.listSaleLines(saleId);
    return ok({ ...mapSaleRow(data), lines: linesResult.ok ? linesResult.data : [] });
  }

  async listSales(organizationId: string, filter: { status?: string; branchId?: string } = {}): Promise<Result<SalonSale[]>> {
    const { data, error } = await this.client.from("salon_sales").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    let rows = (data ?? []).map(mapSaleRow);
    if (filter.status) rows = rows.filter((r) => r.status === filter.status);
    if (filter.branchId) rows = rows.filter((r) => r.branchId === filter.branchId);
    return ok(rows.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()));
  }

  async listSaleLines(saleId: string): Promise<Result<SalonSaleLine[]>> {
    const { data, error } = await this.client.from("salon_sale_lines").select("*").eq("sale_id", saleId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapSaleLineRow));
  }

  async addSaleLine(organizationId: string, saleId: string, input: AddSaleLineInput): Promise<Result<SalonSaleLine>> {
    if (input.unitPrice < 0) return fail("invalid_input", "Unit price cannot be negative.");
    const { data, error } = await this.client
      .from("salon_sale_lines")
      .insert({
        organization_id: organizationId,
        sale_id: saleId,
        service_id: input.serviceId ?? null,
        appointment_service_id: input.appointmentServiceId ?? null,
        description: input.description,
        quantity: input.quantity ?? 1,
        unit_price: input.unitPrice,
        discount_amount: input.discountAmount ?? 0,
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No sale line returned after insert.");
    return ok(mapSaleLineRow(data));
  }

  /** Discount/price overrides — gated at the RLS layer by `salon.pricing.override`; this call only fails there. */
  async applySaleLineDiscount(lineId: string, discountAmount: number): Promise<Result<true>> {
    if (discountAmount < 0) return fail("invalid_input", "Discount cannot be negative.");
    const { error } = await this.client.from("salon_sale_lines").update({ discount_amount: discountAmount }).eq("id", lineId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  /**
   * Recomputes subtotal/tax_total/total from the *current* salon_sale_lines
   * (each line's unit_price is already a server-recorded value — either
   * from `salon_services.price` at line-add time, or a POS-entered custom
   * amount stored server-side, never a value trusted from a raw client
   * total field) and the org's active `tax_rules`, then moves the sale to
   * `awaiting_payment`. This is the server-side price authority gate that
   * must run before any payment can be recorded.
   */
  async finalizeSale(organizationId: string, saleId: string): Promise<Result<SaleWithLines>> {
    const linesResult = await this.listSaleLines(saleId);
    if (!linesResult.ok) return linesResult;
    if (!linesResult.data.length) return fail("invalid_input", "Cannot finalize a sale with no line items.");

    const taxRateResult = await this.client
      .from("tax_rules")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    const taxRatePct = taxRateResult.error ? 0 : Number((taxRateResult.data as SalonRow | null)?.rate_percent ?? 0);

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    for (const line of linesResult.data) {
      const lineGross = line.quantity * line.unitPrice - line.discountAmount;
      const lineTax = Math.max(0, lineGross) * (taxRatePct / 100);
      const lineTotal = Math.max(0, lineGross) + lineTax;
      subtotal += line.quantity * line.unitPrice;
      discountTotal += line.discountAmount;
      taxTotal += lineTax;

      const { error: lineUpdateError } = await this.client
        .from("salon_sale_lines")
        .update({ tax_rate_pct: taxRatePct, tax_amount: lineTax, line_total: lineTotal })
        .eq("id", line.id);
      if (lineUpdateError) return fail("db_error", lineUpdateError.message);
    }

    const total = subtotal - discountTotal + taxTotal;
    const { data, error } = await this.client
      .from("salon_sales")
      .update({ subtotal, discount_total: discountTotal, tax_total: taxTotal, total, status: "awaiting_payment" })
      .eq("id", saleId)
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No sale returned after finalize.");

    const finalLinesResult = await this.listSaleLines(saleId);
    return ok({ ...mapSaleRow(data), lines: finalLinesResult.ok ? finalLinesResult.data : [] });
  }

  /**
   * Records a payment. `idempotencyKey` is enforced unique per organization
   * at the DB level (`salon_payments`'s `UNIQUE (organization_id,
   * idempotency_key)`) — a retried submission (double-tap "pay") returns
   * the existing row via `upsert(..., { ignoreDuplicates: true })` followed
   * by a re-select, rather than raising a duplicate-payment error or
   * recording the money twice.
   */
  async recordPayment(organizationId: string, saleId: string, input: RecordPaymentInput): Promise<Result<SalonPayment>> {
    if (input.amount <= 0) return fail("invalid_input", "Payment amount must be positive.");

    const { error: upsertError } = await this.client
      .from("salon_payments")
      .upsert(
        {
          organization_id: organizationId,
          sale_id: saleId,
          method: input.method,
          provider: input.provider ?? null,
          provider_reference: input.providerReference ?? null,
          amount: input.amount,
          currency: input.currency ?? "INR",
          status: input.status ?? "succeeded",
          idempotency_key: input.idempotencyKey,
          recorded_by: input.recordedBy ?? null,
        },
        { onConflict: "organization_id,idempotency_key", ignoreDuplicates: true }
      );
    if (upsertError) return fail("db_error", upsertError.message);

    const { data, error } = await this.client
      .from("salon_payments")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("idempotency_key", input.idempotencyKey)
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No payment record found after recording.");
    const payment = mapPaymentRow(data);

    if (payment.status === "succeeded") {
      await this.maybeMarkSalePaid(saleId);
    }
    return ok(payment);
  }

  private async maybeMarkSalePaid(saleId: string): Promise<void> {
    const saleResult = await this.getSale(saleId);
    if (!saleResult.ok || saleResult.data.status === "paid") return;
    const paymentsResult = await this.listPaymentsForSale(saleId);
    if (!paymentsResult.ok) return;
    const paidTotal = paymentsResult.data.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + p.amount, 0);
    if (paidTotal >= saleResult.data.total) {
      await this.client.from("salon_sales").update({ status: "paid" }).eq("id", saleId);
    }
  }

  async listPaymentsForSale(saleId: string): Promise<Result<SalonPayment[]>> {
    const { data, error } = await this.client.from("salon_payments").select("*").eq("sale_id", saleId);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapPaymentRow));
  }

  async listPendingPayments(organizationId: string): Promise<Result<SalonSale[]>> {
    return this.listSales(organizationId, { status: "awaiting_payment" });
  }

  // -- Refunds: mirrors RefundService's pending -> approved -> processed chain.

  async requestRefund(organizationId: string, input: RequestRefundInput): Promise<Result<SalonRefund>> {
    if (input.amount <= 0) return fail("invalid_input", "Refund amount must be positive.");
    const { data, error } = await this.client
      .from("salon_refunds")
      .insert({
        organization_id: organizationId,
        sale_id: input.saleId,
        payment_id: input.paymentId ?? null,
        amount: input.amount,
        reason: input.reason,
        status: "pending",
        requested_by: input.requestedBy ?? null,
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No refund returned after insert.");
    return ok(mapRefundRow(data));
  }

  async listRefunds(organizationId: string, filter: { status?: string } = {}): Promise<Result<SalonRefund[]>> {
    const { data, error } = await this.client.from("salon_refunds").select("*").eq("organization_id", organizationId);
    if (error) return fail("db_error", error.message);
    let rows = (data ?? []).map(mapRefundRow);
    if (filter.status) rows = rows.filter((r) => r.status === filter.status);
    return ok(rows);
  }

  /** Approve is gated at RLS by `refund.approve`; this call only fails there if the caller lacks it. */
  async approveRefund(refundId: string, currentStatus: SalonRefund["status"], approvedBy?: string): Promise<Result<true>> {
    if (!canTransitionRefundStatus(currentStatus, "approved")) {
      return fail("invalid_transition", `Cannot approve a refund in "${currentStatus}" status.`);
    }
    const { error } = await this.client
      .from("salon_refunds")
      .update({ status: "approved", approved_by: approvedBy ?? null })
      .eq("id", refundId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  async processRefund(refundId: string, currentStatus: SalonRefund["status"]): Promise<Result<true>> {
    if (!canTransitionRefundStatus(currentStatus, "processed")) {
      return fail("invalid_transition", `Cannot process a refund in "${currentStatus}" status.`);
    }
    const { error } = await this.client
      .from("salon_refunds")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", refundId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  async rejectRefund(refundId: string, currentStatus: SalonRefund["status"]): Promise<Result<true>> {
    if (!canTransitionRefundStatus(currentStatus, "rejected")) {
      return fail("invalid_transition", `Cannot reject a refund in "${currentStatus}" status.`);
    }
    const { error } = await this.client.from("salon_refunds").update({ status: "rejected" }).eq("id", refundId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  /** Anonymous org lookup by public slug, scoped server-side to published salon-os tenants. */
  async getPublicOrganizationBySlug(slug: string): Promise<Result<PublicSalonOrganization>> {
    const { data, error } = await this.client.rpc("get_public_salon_organization", { p_slug: slug });
    if (error) return fail("db_error", error.message);
    const rows = (data as Array<{ organization_id: string; name: string; slug: string }> | null) ?? [];
    const row = rows[0];
    if (!row) return fail("not_found", "No salon found for this link.");
    return ok({ organizationId: row.organization_id, name: row.name, slug: row.slug });
  }

  /** Anonymous branch listing — calls `get_public_salon_branches`, never reads the table directly. */
  async getPublicBranches(organizationId: string): Promise<Result<SalonBranch[]>> {
    const { data, error } = await this.client.rpc("get_public_salon_branches", { p_organization_id: organizationId });
    if (error) return fail("db_error", error.message);
    const rows = (data as SalonRow[] | null) ?? [];
    return ok(rows.map(mapBranchRow));
  }

  /** Anonymous service menu — calls `get_public_salon_services`, never reads the table directly. */
  async getPublicServices(organizationId: string): Promise<Result<SalonService[]>> {
    const { data, error } = await this.client.rpc("get_public_salon_services", { p_organization_id: organizationId });
    if (error) return fail("db_error", error.message);
    const rows = (data as SalonRow[] | null) ?? [];
    return ok(rows.map(mapServiceRow));
  }

  /** Anonymous staff directory — calls `get_public_salon_staff`, never reads the table directly. */
  async getPublicStaff(organizationId: string, branchId?: string): Promise<Result<SalonStaff[]>> {
    const { data, error } = await this.client.rpc("get_public_salon_staff", {
      p_organization_id: organizationId,
      p_branch_id: branchId ?? null,
    });
    if (error) return fail("db_error", error.message);
    const rows = (data as SalonRow[] | null) ?? [];
    return ok(rows.map(mapStaffRow));
  }

  /**
   * Staff eligible for a service. An empty mapping means "no explicit
   * restriction configured" — callers should treat that as "any active
   * staff at the branch is eligible", matching how `salon_service_staff`
   * is optional at booking-setup time.
   */
  async getPublicStaffIdsForService(serviceId: string): Promise<Result<string[]>> {
    const { data, error } = await this.client.rpc("get_public_salon_staff_for_service", { p_service_id: serviceId });
    if (error) return fail("db_error", error.message);
    const rows = (data as Array<{ staff_id: string }> | null) ?? [];
    return ok(rows.map((r) => r.staff_id));
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
      p_idempotency_key: input.idempotencyKey ?? null,
    });
    if (error) return fail("booking_failed", error.message);

    const row = data as {
      appointment_id: string;
      customer_id: string;
      starts_at: string;
      ends_at: string;
      booking_number?: string;
      idempotent_replay?: boolean;
    } | null;
    if (!row) return fail("booking_failed", "No booking confirmation returned.");
    return ok({
      appointmentId: row.appointment_id,
      customerId: row.customer_id,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      bookingNumber: row.booking_number,
      idempotentReplay: Boolean(row.idempotent_replay),
    });
  }
}
