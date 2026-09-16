import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SalonAutomationService } from "../src/automation";
import { createSalonMockClient } from "./mock-client";

const ORG = "org-automation";
const NOW = new Date("2026-09-16T12:00:00.000Z");

function seed(optedOut = false) {
  const client = createSalonMockClient();
  client.tables.set("salon_customers", [{
    id: "customer-1",
    organization_id: ORG,
    phone: "9000000000",
    preferred_channel: "whatsapp",
    marketing_consent: true,
    opted_out_at: optedOut ? "2026-09-01T00:00:00.000Z" : null,
  }]);
  client.tables.set("salon_appointments", [{
    id: "appointment-1",
    organization_id: ORG,
    branch_id: "branch-1",
    staff_id: "staff-1",
    customer_id: "customer-1",
    status: "completed",
    starts_at: "2026-09-16T07:00:00.000Z",
    ends_at: "2026-09-16T08:00:00.000Z",
  }]);
  return { client, service: new SalonAutomationService(client) };
}

describe("SalonAutomationService", () => {
  it("queues a due review once across duplicate worker calls", async () => {
    const { client, service } = seed();
    const first = await service.processDue(ORG, { now: NOW, limit: 10 });
    const second = await service.processDue(ORG, { now: NOW, limit: 10 });
    assert.ok(first.ok && second.ok);
    if (!first.ok || !second.ok) return;
    assert.equal(first.data.queued, 1);
    assert.equal(second.data.queued, 0);
    assert.equal(client.tables.get("salon_automation_runs")?.length, 1);
    assert.equal(client.tables.get("salon_review_requests")?.length, 1);
    assert.equal(client.tables.get("notification_outbox")?.length, 1);
  });

  it("never enqueues outreach for an opted-out customer", async () => {
    const { client, service } = seed(true);
    const result = await service.processDue(ORG, { now: NOW });
    assert.ok(result.ok);
    assert.equal(client.tables.get("notification_outbox")?.length ?? 0, 0);
  });

  it("rejects cross-tenant manual scheduling and flags low-rating escalation", async () => {
    const { service } = seed();
    const appointment = {
      id: "appointment-1", organizationId: "another-org", branchId: "b", staffId: "s",
      customerId: "c", status: "completed" as const, startsAt: NOW.toISOString(), endsAt: NOW.toISOString(),
    };
    const result = await service.scheduleReviewRequest(ORG, appointment);
    assert.equal(result.ok, false);
    assert.equal(service.isManagerFollowupRequired(3), true);
    assert.equal(service.isManagerFollowupRequired(4), false);
  });
});

