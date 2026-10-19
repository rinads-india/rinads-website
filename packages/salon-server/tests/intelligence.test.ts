import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_WEEKLY_HOURS } from "@rinads/salon";
import { getBusinessSummary, zonedDateKey } from "../src/intelligence";
import { SalonRepository } from "../src/repository";
import { createSalonMockClient } from "./mock-client";

const ORG_ID = "org_dash";

describe("getBusinessSummary dashboard parity", () => {
  it("returns collected-today and staff utilization from real tenant rows, not demo data", async () => {
    const client = createSalonMockClient();
    const repo = new SalonRepository(client);
    const branch = await repo.createBranch(ORG_ID, { name: "MG Road", timezone: "Asia/Kolkata", workingHours: DEFAULT_WEEKLY_HOURS });
    assert.ok(branch.ok);
    if (!branch.ok) return;
    const staff = await repo.createStaff(ORG_ID, { displayName: "Asha", branchId: branch.data.id, workingHours: DEFAULT_WEEKLY_HOURS });
    const service = await repo.createService(ORG_ID, { name: "Cut", durationMin: 30, price: 500 });
    const customer = await repo.upsertCustomerByPhone(ORG_ID, { phone: "9000000001", name: "Priya" });
    assert.ok(staff.ok && service.ok && customer.ok);
    if (!staff.ok || !service.ok || !customer.ok) return;

    const now = new Date("2026-10-19T06:00:00.000Z");
    const startsAt = new Date(Date.UTC(2026, 9, 19, 6, 0, 0)).toISOString();
    await repo.createAppointment(ORG_ID, {
      branchId: branch.data.id,
      staffId: staff.data.id,
      customerId: customer.data.id,
      startsAt,
      endsAt: new Date(new Date(startsAt).getTime() + 30 * 60_000).toISOString(),
      serviceIds: [service.data.id],
    });

    const sale = await repo.createSale(ORG_ID, { branchId: branch.data.id, customerId: customer.data.id, staffId: staff.data.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    await repo.addSaleLine(ORG_ID, sale.data.id, { description: "Cut", unitPrice: 500 });
    await repo.finalizeSale(ORG_ID, sale.data.id);
    await repo.recordPayment(ORG_ID, sale.data.id, { method: "cash", amount: 500, idempotencyKey: "pay-1" });

    const summary = await getBusinessSummary(repo, ORG_ID, { now, branchId: branch.data.id });
    assert.equal(summary.todayAppointments.total, 1);
    assert.equal(summary.collectedToday.saleCount, 1);
    assert.ok(summary.collectedToday.totalRevenue > 0);
    assert.equal(summary.timeZone, "Asia/Kolkata");
    assert.equal(summary.staffUtilization.length, 1);
    assert.equal(zonedDateKey(now, "Asia/Kolkata"), "2026-10-19");
  });

  it("scopes appointments and sales to the selected branch", async () => {
    const client = createSalonMockClient();
    const repo = new SalonRepository(client);
    const a = await repo.createBranch(ORG_ID, { name: "A", timezone: "Asia/Kolkata" });
    const b = await repo.createBranch(ORG_ID, { name: "B", timezone: "Asia/Kolkata" });
    assert.ok(a.ok && b.ok);
    if (!a.ok || !b.ok) return;
    const staffA = await repo.createStaff(ORG_ID, { displayName: "Asha", branchId: a.data.id });
    const staffB = await repo.createStaff(ORG_ID, { displayName: "Bina", branchId: b.data.id });
    const service = await repo.createService(ORG_ID, { name: "Cut", durationMin: 30, price: 400 });
    const customer = await repo.upsertCustomerByPhone(ORG_ID, { phone: "9000000002", name: "Neha" });
    assert.ok(staffA.ok && staffB.ok && service.ok && customer.ok);
    if (!staffA.ok || !staffB.ok || !service.ok || !customer.ok) return;
    const startsAt = "2026-10-19T06:00:00.000Z";
    await repo.createAppointment(ORG_ID, {
      branchId: a.data.id,
      staffId: staffA.data.id,
      customerId: customer.data.id,
      startsAt,
      endsAt: "2026-10-19T06:30:00.000Z",
      serviceIds: [service.data.id],
    });
    await repo.createAppointment(ORG_ID, {
      branchId: b.data.id,
      staffId: staffB.data.id,
      customerId: customer.data.id,
      startsAt,
      endsAt: "2026-10-19T06:30:00.000Z",
      serviceIds: [service.data.id],
    });
    const now = new Date("2026-10-19T06:00:00.000Z");
    const onlyA = await getBusinessSummary(repo, ORG_ID, { now, branchId: a.data.id });
    const all = await getBusinessSummary(repo, ORG_ID, { now });
    assert.equal(onlyA.todayAppointments.total, 1);
    assert.equal(all.todayAppointments.total, 2);
  });
});
