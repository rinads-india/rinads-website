import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SalonRepository } from "../src/index";
import { createSalonMockClient } from "./mock-client";

const orgId = "org_filter_test";

describe("listAppointments / listSales SQL filter pushdown", () => {
  it("filters appointments by branch and starts_at range without returning other branches", async () => {
    const client = createSalonMockClient();
    const repo = new SalonRepository(client);
    const branchA = await repo.createBranch(orgId, { name: "A" });
    const branchB = await repo.createBranch(orgId, { name: "B" });
    const staff = await repo.createStaff(orgId, { displayName: "Asha" });
    assert.ok(branchA.ok && branchB.ok && staff.ok);
    if (!branchA.ok || !branchB.ok || !staff.ok) return;

    await repo.createAppointment(orgId, {
      branchId: branchA.data.id,
      staffId: staff.data.id,
      customerId: "cust_1",
      startsAt: "2026-10-19T09:00:00.000Z",
      endsAt: "2026-10-19T10:00:00.000Z",
      serviceIds: ["svc_1"],
    });
    await repo.createAppointment(orgId, {
      branchId: branchA.data.id,
      staffId: staff.data.id,
      customerId: "cust_2",
      startsAt: "2026-10-20T09:00:00.000Z",
      endsAt: "2026-10-20T10:00:00.000Z",
      serviceIds: ["svc_1"],
    });
    await repo.createAppointment(orgId, {
      branchId: branchB.data.id,
      staffId: staff.data.id,
      customerId: "cust_3",
      startsAt: "2026-10-19T11:00:00.000Z",
      endsAt: "2026-10-19T12:00:00.000Z",
      serviceIds: ["svc_1"],
    });

    const day = await repo.listAppointments(orgId, {
      branchId: branchA.data.id,
      from: "2026-10-19T00:00:00.000Z",
      to: "2026-10-20T00:00:00.000Z",
    });
    assert.ok(day.ok);
    if (!day.ok) return;
    assert.equal(day.data.length, 1);
    assert.equal(day.data[0].customerId, "cust_1");
  });

  it("filters sales by status and branch in the query", async () => {
    const client = createSalonMockClient();
    const repo = new SalonRepository(client);
    const branch = await repo.createBranch(orgId, { name: "POS Branch" });
    assert.ok(branch.ok);
    if (!branch.ok) return;

    const draft = await repo.createSale(orgId, { branchId: branch.data.id, customerId: "cust_1" });
    const toPay = await repo.createSale(orgId, { branchId: branch.data.id, customerId: "cust_2" });
    assert.ok(draft.ok && toPay.ok);
    if (!draft.ok || !toPay.ok) return;

    await repo.addSaleLine(orgId, toPay.data.id, { description: "Cut", unitPrice: 500 });
    const finalized = await repo.finalizeSale(orgId, toPay.data.id);
    assert.ok(finalized.ok);
    if (!finalized.ok) return;
    const paid = await repo.recordPayment(orgId, toPay.data.id, {
      method: "cash",
      amount: finalized.data.total,
      idempotencyKey: "pay-filter-1",
    });
    assert.ok(paid.ok);

    const drafts = await repo.listSales(orgId, { status: "draft", branchId: branch.data.id });
    assert.ok(drafts.ok);
    if (!drafts.ok) return;
    assert.equal(drafts.data.length, 1);
    assert.equal(drafts.data[0].id, draft.data.id);

    const paidList = await repo.listSales(orgId, { status: "paid" });
    assert.ok(paidList.ok);
    if (!paidList.ok) return;
    assert.equal(paidList.data.length, 1);
    assert.equal(paidList.data[0].id, toPay.data.id);
  });
});
