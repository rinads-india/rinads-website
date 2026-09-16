import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_WEEKLY_HOURS } from "@rinads/salon";
import { SalonRepository } from "../src/repository";
import { createSalonMockClient } from "./mock-client";

const ORG = "org-a";
const OTHER_ORG = "org-b";

async function seed(repo: SalonRepository) {
  const branch = await repo.createBranch(ORG, { name: "Main", workingHours: DEFAULT_WEEKLY_HOURS });
  if (!branch.ok) throw new Error("branch seed failed");
  const staff = await repo.createStaff(ORG, { displayName: "Asha", branchId: branch.data.id, workingHours: DEFAULT_WEEKLY_HOURS });
  const service = await repo.createService(ORG, { name: "Cut", durationMin: 30, bufferMin: 15, price: 500 });
  assert.ok(branch.ok && staff.ok && service.ok);
  if (!branch.ok || !staff.ok || !service.ok) throw new Error("seed failed");
  return { branch: branch.data, staff: staff.data, service: service.data };
}

describe("front-desk booking closure", () => {
  it("validates phone, availability, buffers, and conflict ranges", async () => {
    const repo = new SalonRepository(createSalonMockClient());
    const { branch, staff, service } = await seed(repo);
    const invalidPhone = await repo.createFrontDeskBooking(ORG, {
      branchId: branch.id, staffId: staff.id, serviceIds: [service.id],
      startsAt: "2099-09-17T05:00:00.000Z", customerPhone: "12", idempotencyKey: "bad-phone",
    });
    assert.equal(invalidPhone.ok, false);

    const past = await repo.createFrontDeskBooking(ORG, {
      branchId: branch.id, staffId: staff.id, serviceIds: [service.id],
      startsAt: "2020-09-17T05:00:00.000Z", customerPhone: "9876543210", idempotencyKey: "past",
    });
    assert.equal(past.ok, false);
    if (!past.ok) assert.match(past.error.message, /future/i);

    const first = await repo.createFrontDeskBooking(ORG, {
      branchId: branch.id, staffId: staff.id, serviceIds: [service.id],
      startsAt: "2099-09-17T05:00:00.000Z", customerPhone: "9876543210", idempotencyKey: "booking-1",
    });
    assert.equal(first.ok, true);
    if (first.ok) {
      assert.equal(new Date(first.data.endsAt).getTime() - new Date(first.data.startsAt).getTime(), 45 * 60_000);
      assert.equal(first.data.services[0].priceAtBooking, 500);
    }
    const conflict = await repo.createFrontDeskBooking(ORG, {
      branchId: branch.id, staffId: staff.id, serviceIds: [service.id],
      startsAt: "2099-09-17T05:30:00.000Z", customerPhone: "9999999999", idempotencyKey: "booking-2",
    });
    assert.equal(conflict.ok, false);
    if (!conflict.ok) assert.match(conflict.error.message, /overlapping/i);
  });

  it("replays an idempotency key without creating another appointment or customer", async () => {
    const client = createSalonMockClient();
    const repo = new SalonRepository(client);
    const { branch, staff, service } = await seed(repo);
    const input = {
      branchId: branch.id, staffId: staff.id, serviceIds: [service.id],
      startsAt: "2099-09-18T05:00:00.000Z", customerPhone: "9876543210", idempotencyKey: "same-key",
    };
    const first = await repo.createFrontDeskBooking(ORG, input);
    const replay = await repo.createFrontDeskBooking(ORG, input);
    assert.ok(first.ok && replay.ok);
    if (first.ok && replay.ok) assert.equal(replay.data.id, first.data.id);
    assert.equal(client.tables.get("salon_appointments")?.length, 1);
    assert.equal(client.tables.get("salon_customers")?.length, 1);
  });

  it("rejects branch, staff, and service IDs owned by another tenant", async () => {
    const client = createSalonMockClient();
    const repo = new SalonRepository(client);
    const { branch, staff, service } = await seed(repo);
    client.tables.get("salon_services")?.push({
      id: "foreign-service", organization_id: OTHER_ORG, name: "Foreign", category: "general",
      duration_min: 30, buffer_min: 0, price: 10, currency: "INR", is_active: true,
    });
    const result = await repo.createFrontDeskBooking(ORG, {
      branchId: branch.id, staffId: staff.id, serviceIds: [service.id, "foreign-service"],
      startsAt: "2099-09-18T06:00:00.000Z", customerPhone: "9876543210", idempotencyKey: "foreign",
    });
    assert.equal(result.ok, false);
  });
});

describe("low-rating follow-up closure", () => {
  it("lists and resolves only feedback in the requested organization", async () => {
    const client = createSalonMockClient();
    const repo = new SalonRepository(client);
    client.tables.set("salon_customers", [
      { id: "customer-a", organization_id: ORG, phone: "9876543210" },
      { id: "customer-b", organization_id: OTHER_ORG, phone: "9999999999" },
    ]);
    client.tables.set("salon_feedback", [
      { id: "feedback-a", organization_id: ORG, review_request_id: "r-a", appointment_id: "a-a", customer_id: "customer-a", rating: 2, comment: "Late", status: "escalated" },
      { id: "feedback-b", organization_id: OTHER_ORG, review_request_id: "r-b", appointment_id: "a-b", customer_id: "customer-b", rating: 1, status: "escalated" },
    ]);
    client.tables.set("salon_notes", [
      { id: "task-a", organization_id: ORG, entity_type: "staff_task", entity_id: "customer-a", body: "Manager follow-up required for customer feedback rated 2/5.", visibility: "internal", status: "open" },
    ]);
    const queue = await repo.listLowRatingFollowUps(ORG);
    assert.ok(queue.ok);
    if (queue.ok) assert.deepEqual(queue.data.map((item) => item.feedback.id), ["feedback-a"]);
    assert.equal((await repo.resolveLowRatingFollowUp(ORG, "feedback-b")).ok, false);
    assert.equal((await repo.resolveLowRatingFollowUp(ORG, "feedback-a")).ok, true);
    assert.equal(client.tables.get("salon_feedback")?.find((row) => row.id === "feedback-a")?.status, "resolved");
    assert.equal(client.tables.get("salon_notes")?.find((row) => row.id === "task-a")?.status, "done");
    assert.equal(client.tables.get("salon_feedback")?.find((row) => row.id === "feedback-b")?.status, "escalated");
  });
});
