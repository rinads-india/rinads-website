import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const sql = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20260916100001_salon_reviews_automation.sql"),
  "utf8"
);

describe("salon review and recovery migration", () => {
  it("creates all tenant tables with RLS and member/manage policies", () => {
    for (const table of ["salon_automation_rules", "salon_automation_runs", "salon_review_requests", "salon_feedback"]) {
      assert.match(sql, new RegExp(`CREATE TABLE ${table}`, "i"));
      assert.match(sql, new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, "i"));
    }
    assert.match(sql, /private\.is_org_member\(organization_id\)/);
    assert.match(sql, /private\.has_permission\(organization_id, 'salon\.reviews\.manage'\)/);
  });

  it("enforces tenant linkage and deterministic idempotency", () => {
    assert.match(sql, /FOREIGN KEY \(customer_id, organization_id\) REFERENCES salon_customers\(id, organization_id\)/);
    assert.match(sql, /FOREIGN KEY \(appointment_id, organization_id\) REFERENCES salon_appointments\(id, organization_id\)/);
    assert.match(sql, /UNIQUE \(organization_id, idempotency_key\)/);
    assert.match(sql, /UNIQUE \(organization_id, appointment_id\)/);
  });

  it("uses a constrained public RPC with no sentiment-dependent destination", () => {
    assert.match(sql, /FUNCTION submit_salon_feedback\(p_token UUID, p_rating SMALLINT, p_comment TEXT DEFAULT NULL\)/i);
    assert.match(sql, /SECURITY DEFINER SET search_path = public/);
    assert.match(sql, /REVOKE ALL ON FUNCTION submit_salon_feedback/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION submit_salon_feedback[\s\S]*TO anon, authenticated, service_role/);
    assert.doesNotMatch(sql, /redirect|google|public review/i);
  });

  it("escalates low ratings through the existing staff-task path and attributes recovery conversion", () => {
    assert.match(sql, /IF p_rating <= 3 THEN[\s\S]*INSERT INTO salon_notes/);
    assert.match(sql, /kind IN \('no_show_recovery', 'unconfirmed_booking_recovery'\)[\s\S]*status = 'queued'/);
    assert.match(sql, /status = 'converted', converted_at = now\(\), converted_appointment_id = NEW\.id/);
    assert.match(sql, /salon_stop_inapplicable_automations/);
    assert.match(sql, /SET status = 'cancelled'[\s\S]*appointment status changed/i);
    assert.match(sql, /trg_salon_attribute_unconfirmed_conversion/);
  });

  it("emits review, feedback, recovery queued, and conversion events", () => {
    for (const event of ["salon.review.requested", "salon.feedback.received", "salon.recovery.queued", "salon.recovery.converted"]) {
      assert.match(sql, new RegExp(event.replaceAll(".", "\\.")));
    }
  });
});

