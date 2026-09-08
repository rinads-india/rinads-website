import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SalonRepository, type SalonRow, type SalonSupabaseClient } from "../src/index";

function createMockClient(): SalonSupabaseClient & { tables: Map<string, SalonRow[]> } {
  const tables = new Map<string, SalonRow[]>();
  let seq = 0;

  const client: SalonSupabaseClient & { tables: Map<string, SalonRow[]> } = {
    tables,
    from(table: string) {
      if (!tables.has(table)) tables.set(table, []);
      return {
        select: () => ({
          eq: async (col: string, val: string | boolean) => {
            const rows = (tables.get(table) ?? []).filter((r) => r[col] === val);
            return { data: rows, error: null };
          },
        }),
        insert: (row: SalonRow) => ({
          select: () => ({
            single: async () => {
              const id = String(row.id ?? `${table}_${++seq}`);
              const now = new Date().toISOString();
              const stored: SalonRow = { id, created_at: now, updated_at: now, ...row };
              tables.set(table, [...(tables.get(table) ?? []), stored]);
              return { data: stored, error: null };
            },
          }),
        }),
        update: (patch: SalonRow) => ({
          eq: async (col: string, val: string | boolean) => {
            const existing = tables.get(table) ?? [];
            const idx = existing.findIndex((r) => r[col] === val);
            if (idx === -1) return { error: { message: "Not found" } };
            existing[idx] = { ...existing[idx], ...patch };
            tables.set(table, existing);
            return { error: null };
          },
        }),
      };
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "get_public_salon_organization") {
        return { data: [{ organization_id: "org_salon_test", name: "R GLOW", slug: "r-glow" }], error: null };
      }
      if (fn === "get_public_salon_branches") {
        const rows = (tables.get("salon_branches") ?? []).filter((r) => r.organization_id === args.p_organization_id);
        return { data: rows, error: null };
      }
      if (fn === "get_public_salon_services") {
        const rows = (tables.get("salon_services") ?? []).filter((r) => r.organization_id === args.p_organization_id);
        return { data: rows, error: null };
      }
      if (fn === "get_public_salon_staff") {
        const rows = (tables.get("salon_staff") ?? []).filter((r) => r.organization_id === args.p_organization_id);
        return { data: rows, error: null };
      }
      if (fn === "get_public_salon_staff_for_service") {
        return { data: [], error: null };
      }
      if (fn === "get_public_salon_busy_slots") {
        const rows = (tables.get("salon_appointments") ?? []).filter(
          (r) => r.staff_id === args.p_staff_id && r.organization_id === args.p_organization_id
        );
        return {
          data: rows.map((r) => ({ starts_at: r.starts_at, ends_at: r.ends_at })),
          error: null,
        };
      }
      if (fn === "create_public_salon_booking") {
        const id = `appt_${++seq}`;
        const customerId = `cust_${seq}`;
        const row: SalonRow = {
          id,
          organization_id: args.p_organization_id,
          branch_id: args.p_branch_id,
          staff_id: args.p_staff_id,
          customer_id: customerId,
          status: "pending",
          starts_at: args.p_starts_at,
          ends_at: args.p_starts_at,
        };
        tables.set("salon_appointments", [...(tables.get("salon_appointments") ?? []), row]);
        return {
          data: { appointment_id: id, customer_id: customerId, starts_at: args.p_starts_at, ends_at: args.p_starts_at },
          error: null,
        };
      }
      return { data: null, error: { message: `Unknown rpc: ${fn}` } };
    },
  };
  return client;
}

describe("SalonRepository", () => {
  const orgId = "org_salon_test";

  it("creates and lists branches", async () => {
    const repo = new SalonRepository(createMockClient());
    const created = await repo.createBranch(orgId, { name: "MG Road" });
    assert.ok(created.ok);
    const list = await repo.listBranches(orgId);
    assert.ok(list.ok);
    if (list.ok) {
      assert.equal(list.data.length, 1);
      assert.equal(list.data[0].name, "MG Road");
    }
  });

  it("rejects a service with invalid duration", async () => {
    const repo = new SalonRepository(createMockClient());
    const result = await repo.createService(orgId, { name: "Haircut", durationMin: 0, price: 300 });
    assert.ok(!result.ok);
  });

  it("creates a staff-facing appointment and lists it back", async () => {
    const repo = new SalonRepository(createMockClient());
    const branch = await repo.createBranch(orgId, { name: "Branch A" });
    const staff = await repo.createStaff(orgId, { displayName: "Asha" });
    assert.ok(branch.ok && staff.ok);
    if (!branch.ok || !staff.ok) return;

    const appt = await repo.createAppointment(orgId, {
      branchId: branch.data.id,
      staffId: staff.data.id,
      customerId: "cust_1",
      startsAt: "2026-09-10T10:00:00.000Z",
      endsAt: "2026-09-10T11:00:00.000Z",
      serviceIds: ["svc_1"],
    });
    assert.ok(appt.ok);

    const list = await repo.listAppointments(orgId, { branchId: branch.data.id });
    assert.ok(list.ok);
    if (list.ok) assert.equal(list.data.length, 1);
  });

  it("enforces valid appointment status transitions", async () => {
    const repo = new SalonRepository(createMockClient());
    const invalid = await repo.updateAppointmentStatus("appt_x", "completed", "pending");
    assert.ok(!invalid.ok);
  });

  it("runs the public booking RPC and returns booking confirmation", async () => {
    const repo = new SalonRepository(createMockClient());
    const result = await repo.createPublicBooking({
      organizationId: orgId,
      branchId: "branch_1",
      staffId: "staff_1",
      serviceIds: ["svc_1"],
      startsAt: "2026-09-10T10:00:00.000Z",
      customerPhone: "9876543210",
      customerName: "Priya",
    });
    assert.ok(result.ok);
    if (result.ok) assert.ok(result.data.appointmentId);
  });

  it("resolves the public org, branches, services, and staff for the booking widget", async () => {
    const client = createMockClient();
    const repo = new SalonRepository(client);
    await repo.createBranch(orgId, { name: "Branch A" });
    await repo.createService(orgId, { name: "Haircut", durationMin: 30, price: 300 });
    await repo.createStaff(orgId, { displayName: "Asha" });

    const org = await repo.getPublicOrganizationBySlug("r-glow");
    assert.ok(org.ok);
    if (org.ok) assert.equal(org.data.slug, "r-glow");

    const branches = await repo.getPublicBranches(orgId);
    assert.ok(branches.ok);
    if (branches.ok) assert.equal(branches.data.length, 1);

    const services = await repo.getPublicServices(orgId);
    assert.ok(services.ok);
    if (services.ok) assert.equal(services.data.length, 1);

    const staff = await repo.getPublicStaff(orgId);
    assert.ok(staff.ok);
    if (staff.ok) assert.equal(staff.data.length, 1);

    const eligibleStaffIds = await repo.getPublicStaffIdsForService("svc_1");
    assert.ok(eligibleStaffIds.ok);
    if (eligibleStaffIds.ok) assert.equal(eligibleStaffIds.data.length, 0);
  });

  it("reads busy slots via the public RPC", async () => {
    const repo = new SalonRepository(createMockClient());
    await repo.createPublicBooking({
      organizationId: orgId,
      branchId: "branch_1",
      staffId: "staff_1",
      serviceIds: ["svc_1"],
      startsAt: "2026-09-10T10:00:00.000Z",
      customerPhone: "9876543210",
    });
    const busy = await repo.getPublicBusySlots(orgId, "staff_1", "2026-09-10T00:00:00.000Z", "2026-09-11T00:00:00.000Z");
    assert.ok(busy.ok);
    if (busy.ok) assert.equal(busy.data.length, 1);
  });
});
