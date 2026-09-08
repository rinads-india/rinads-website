import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SalonRepository } from "../src/repository";
import { createSalonMockClient } from "./mock-client";

const ORG_ID = "org_pos_test";

async function seedBasics(repo: SalonRepository) {
  const branch = await repo.createBranch(ORG_ID, { name: "Indiranagar" });
  const staff = await repo.createStaff(ORG_ID, { displayName: "Kavya" });
  const service = await repo.createService(ORG_ID, { name: "Manicure", durationMin: 45, price: 400 });
  if (!branch.ok || !staff.ok || !service.ok) throw new Error("seed failed");
  return { branch: branch.data, staff: staff.data, service: service.data };
}

describe("SalonRepository — POS / checkout", () => {
  it("finalizeSale recomputes totals server-side from current sale lines, ignoring any client-submitted total", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch } = await seedBasics(repo);
    const sale = await repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;

    await repo.addSaleLine(ORG_ID, sale.data.id, { description: "Manicure", unitPrice: 400 });
    await repo.addSaleLine(ORG_ID, sale.data.id, { description: "Add-on", unitPrice: 100, discountAmount: 20 });

    const finalized = await repo.finalizeSale(ORG_ID, sale.data.id);
    assert.ok(finalized.ok);
    if (!finalized.ok) return;
    assert.equal(finalized.data.status, "awaiting_payment");
    // subtotal 500, discount 20, no tax_rules seeded -> total 480
    assert.equal(finalized.data.subtotal, 500);
    assert.equal(finalized.data.discountTotal, 20);
    assert.equal(finalized.data.total, 480);
  });

  it("refuses to finalize a sale with no line items", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch } = await seedBasics(repo);
    const sale = await repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    const finalized = await repo.finalizeSale(ORG_ID, sale.data.id);
    assert.ok(!finalized.ok);
  });

  it("createSaleFromAppointment pre-fills lines from the appointment's booked services", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch, staff, service } = await seedBasics(repo);
    const customer = await repo.upsertCustomerByPhone(ORG_ID, { phone: "9000000001" });
    assert.ok(customer.ok);
    if (!customer.ok) return;

    const appt = await repo.createAppointment(ORG_ID, {
      branchId: branch.id,
      staffId: staff.id,
      customerId: customer.data.id,
      startsAt: "2026-09-10T10:00:00.000Z",
      endsAt: "2026-09-10T10:45:00.000Z",
      serviceIds: [service.id],
    });
    assert.ok(appt.ok);
    if (!appt.ok) return;

    const sale = await repo.createSaleFromAppointment(ORG_ID, appt.data);
    assert.ok(sale.ok);
    if (!sale.ok) return;
    assert.equal(sale.data.appointmentId, appt.data.id);
    assert.equal(sale.data.lines.length, 1);
  });

  it("recordPayment is idempotent — a retried submission with the same idempotencyKey never double-records", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch } = await seedBasics(repo);
    const sale = await repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    await repo.addSaleLine(ORG_ID, sale.data.id, { description: "Manicure", unitPrice: 400 });
    await repo.finalizeSale(ORG_ID, sale.data.id);

    const first = await repo.recordPayment(ORG_ID, sale.data.id, { method: "cash", amount: 400, idempotencyKey: "pay-abc" });
    assert.ok(first.ok);
    const second = await repo.recordPayment(ORG_ID, sale.data.id, { method: "cash", amount: 400, idempotencyKey: "pay-abc" });
    assert.ok(second.ok);
    if (first.ok && second.ok) assert.equal(first.data.id, second.data.id);

    const payments = await repo.listPaymentsForSale(sale.data.id);
    assert.ok(payments.ok);
    if (payments.ok) assert.equal(payments.data.length, 1);

    const refreshedSale = await repo.getSale(sale.data.id);
    assert.ok(refreshedSale.ok);
    if (refreshedSale.ok) assert.equal(refreshedSale.data.status, "paid");
  });

  it("rejects a non-positive payment amount", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch } = await seedBasics(repo);
    const sale = await repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    const result = await repo.recordPayment(ORG_ID, sale.data.id, { method: "cash", amount: 0, idempotencyKey: "pay-zero" });
    assert.ok(!result.ok);
  });
});

describe("SalonRepository — refund lifecycle", () => {
  it("walks pending -> approved -> processed", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch } = await seedBasics(repo);
    const sale = await repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;

    const refund = await repo.requestRefund(ORG_ID, { saleId: sale.data.id, amount: 150, reason: "unhappy" });
    assert.ok(refund.ok);
    if (!refund.ok) return;
    assert.equal(refund.data.status, "pending");

    const approved = await repo.approveRefund(refund.data.id, "pending", "admin_1");
    assert.ok(approved.ok);

    const processed = await repo.processRefund(refund.data.id, "approved");
    assert.ok(processed.ok);

    const refunds = await repo.listRefunds(ORG_ID);
    assert.ok(refunds.ok);
    if (refunds.ok) assert.equal(refunds.data[0].status, "processed");
  });

  it("rejects a pending refund without ever reaching approved", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch } = await seedBasics(repo);
    const sale = await repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    const refund = await repo.requestRefund(ORG_ID, { saleId: sale.data.id, amount: 50, reason: "duplicate charge" });
    assert.ok(refund.ok);
    if (!refund.ok) return;

    const rejected = await repo.rejectRefund(refund.data.id, "pending");
    assert.ok(rejected.ok);

    const invalidApprove = await repo.approveRefund(refund.data.id, "rejected");
    assert.ok(!invalidApprove.ok);
  });

  it("refuses to process a refund that was never approved", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch } = await seedBasics(repo);
    const sale = await repo.createSale(ORG_ID, { branchId: branch.id });
    assert.ok(sale.ok);
    if (!sale.ok) return;
    const refund = await repo.requestRefund(ORG_ID, { saleId: sale.data.id, amount: 50, reason: "test" });
    assert.ok(refund.ok);
    if (!refund.ok) return;
    const processed = await repo.processRefund(refund.data.id, "pending");
    assert.ok(!processed.ok);
  });

  it("rejects a non-positive refund amount", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const result = await repo.requestRefund(ORG_ID, { saleId: "sale_x", amount: 0, reason: "test" });
    assert.ok(!result.ok);
  });
});

describe("SalonRepository — notes and staff tasks", () => {
  it("creates and lists notes for an entity, most recent first", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const note1 = await repo.createNote(ORG_ID, { entityType: "customer", entityId: "cust_1", body: "Loves lavender scents." });
    assert.ok(note1.ok);
    await new Promise((r) => setTimeout(r, 2));
    const note2 = await repo.createNote(ORG_ID, { entityType: "customer", entityId: "cust_1", body: "Prefers evening slots." });
    assert.ok(note2.ok);

    const notes = await repo.listNotes("customer", "cust_1");
    assert.ok(notes.ok);
    if (notes.ok) {
      assert.equal(notes.data.length, 2);
      assert.equal(notes.data[0].body, "Prefers evening slots.");
    }
  });

  it("rejects an empty note body", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const result = await repo.createNote(ORG_ID, { entityType: "appointment", entityId: "appt_1", body: "   " });
    assert.ok(!result.ok);
  });

  it("lists open staff tasks and lets them be resolved", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const task = await repo.createNote(ORG_ID, { entityType: "staff_task", entityId: "staff_1", body: "Restock shampoo", assignedTo: "staff_1" });
    assert.ok(task.ok);
    if (!task.ok) return;

    const open = await repo.listOpenStaffTasks(ORG_ID);
    assert.ok(open.ok);
    if (open.ok) assert.equal(open.data.length, 1);

    const resolved = await repo.updateNoteStatus(task.data.id, "done");
    assert.ok(resolved.ok);

    const openAfter = await repo.listOpenStaffTasks(ORG_ID);
    assert.ok(openAfter.ok);
    if (openAfter.ok) assert.equal(openAfter.data.length, 0);
  });
});

describe("SalonRepository — customer relationship layer", () => {
  it("upsertCustomerByPhone creates once and updates on repeat calls with the same phone", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const first = await repo.upsertCustomerByPhone(ORG_ID, { phone: "9123456789", name: "Ritu" });
    assert.ok(first.ok);
    const second = await repo.upsertCustomerByPhone(ORG_ID, { phone: "9123456789", name: "Ritu Sharma" });
    assert.ok(second.ok);
    if (first.ok && second.ok) {
      assert.equal(first.data.id, second.data.id);
      assert.equal(second.data.name, "Ritu Sharma");
    }
    const list = await repo.listCustomers(ORG_ID);
    assert.ok(list.ok);
    if (list.ok) assert.equal(list.data.length, 1);
  });

  it("rejects an empty phone number", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const result = await repo.upsertCustomerByPhone(ORG_ID, { phone: "  " });
    assert.ok(!result.ok);
  });

  it("builds a customer profile with spend, history, and notes", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch, staff, service } = await seedBasics(repo);
    const customer = await repo.upsertCustomerByPhone(ORG_ID, { phone: "9333333333", name: "Divya" });
    assert.ok(customer.ok);
    if (!customer.ok) return;

    const appt = await repo.createAppointment(ORG_ID, {
      branchId: branch.id,
      staffId: staff.id,
      customerId: customer.data.id,
      startsAt: "2026-09-05T10:00:00.000Z",
      endsAt: "2026-09-05T10:45:00.000Z",
      serviceIds: [service.id],
    });
    assert.ok(appt.ok);
    await repo.createNote(ORG_ID, { entityType: "customer", entityId: customer.data.id, body: "VIP customer." });

    const profile = await repo.getCustomerProfile(ORG_ID, customer.data.id);
    assert.ok(profile.ok);
    if (!profile.ok) return;
    assert.equal(profile.data.customer.id, customer.data.id);
    assert.equal(profile.data.history.length, 1);
    assert.equal(profile.data.notes.length, 1);
    assert.equal(profile.data.spend.visitCount, 0); // no paid sale yet
  });
});

describe("SalonRepository — reschedule + status blocking", () => {
  it("allows rescheduling a pending appointment and preserves its duration", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch, staff, service } = await seedBasics(repo);
    const customer = await repo.upsertCustomerByPhone(ORG_ID, { phone: "9444444444" });
    assert.ok(customer.ok);
    if (!customer.ok) return;
    const appt = await repo.createAppointment(ORG_ID, {
      branchId: branch.id,
      staffId: staff.id,
      customerId: customer.data.id,
      startsAt: "2026-09-10T10:00:00.000Z",
      endsAt: "2026-09-10T10:45:00.000Z",
      serviceIds: [service.id],
    });
    assert.ok(appt.ok);
    if (!appt.ok) return;

    const rescheduled = await repo.rescheduleAppointment(appt.data.id, "pending", "2026-09-11T14:00:00.000Z", "2026-09-11T14:45:00.000Z");
    assert.ok(rescheduled.ok);

    const refreshed = await repo.getAppointment(appt.data.id);
    assert.ok(refreshed.ok);
    if (refreshed.ok) {
      assert.equal(refreshed.data.startsAt, "2026-09-11T14:00:00.000Z");
      assert.equal(refreshed.data.endsAt, "2026-09-11T14:45:00.000Z");
    }
  });

  it("blocks rescheduling an appointment that has already started or finished", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const blocked = await repo.rescheduleAppointment("appt_x", "completed", "2026-09-11T14:00:00.000Z", "2026-09-11T14:45:00.000Z");
    assert.ok(!blocked.ok);
    const blockedCheckedIn = await repo.rescheduleAppointment("appt_x", "checked_in", "2026-09-11T14:00:00.000Z", "2026-09-11T14:45:00.000Z");
    assert.ok(!blockedCheckedIn.ok);
  });
});

describe("SalonRepository — updateServicePrice validation", () => {
  it("updates the price when valid", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { service } = await seedBasics(repo);
    const updated = await repo.updateServicePrice(service.id, 650);
    assert.ok(updated.ok);
    const services = await repo.listServices(ORG_ID);
    assert.ok(services.ok);
    if (services.ok) assert.equal(services.data[0].price, 650);
  });

  it("rejects a negative price", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { service } = await seedBasics(repo);
    const updated = await repo.updateServicePrice(service.id, -10);
    assert.ok(!updated.ok);
  });
});
