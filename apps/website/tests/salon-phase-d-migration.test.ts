import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), "../../supabase/migrations", filename), "utf8");
}

describe("salon POS/checkout migration (20260901100000)", () => {
  const sql = readMigration("20260901100000_salon_pos_checkout.sql");

  it("enables RLS on every new table", () => {
    for (const table of ["salon_sales", "salon_sale_lines", "salon_payments", "salon_refunds"]) {
      assert.match(sql, new RegExp(`create table if not exists ${table}`, "i"));
      assert.match(sql, new RegExp(`alter table ${table} enable row level security`, "i"));
    }
  });

  it("enforces a per-organization idempotency constraint on payments", () => {
    assert.match(sql, /salon_payments[\s\S]*unique\s*\(organization_id,\s*idempotency_key\)/i);
  });

  it("gates refund approval behind refund.approve, distinct from the pos.manage insert gate", () => {
    assert.match(sql, /salon_refunds_insert_pos[\s\S]{0,200}salon\.pos\.manage/);
    assert.match(sql, /salon_refunds_update_approver[\s\S]{0,200}refund\.approve/);
  });

  it("only grants salon.pricing.override to admin, not manager/staff", () => {
    const overrideGrant = sql.match(/WHERE r\.key = 'admin'\s*\n\s*AND p\.key = 'salon\.pricing\.override'/i);
    assert.ok(overrideGrant, "expected salon.pricing.override to be scoped to the admin role only");
  });
});

describe("salon notes migration (20260901100001)", () => {
  const sql = readMigration("20260901100001_salon_notes.sql");

  it("creates a polymorphic notes table scoped to entity_type/entity_id with RLS", () => {
    assert.match(sql, /create table if not exists salon_notes/i);
    assert.match(sql, /entity_type/i);
    assert.match(sql, /alter table salon_notes enable row level security/i);
  });
});

describe("salon booking enhancements migration (20260901100002)", () => {
  const sql = readMigration("20260901100002_salon_booking_enhancements.sql");

  it("adds a per-organization unique booking_number and idempotency_key", () => {
    assert.match(sql, /unique index[\s\S]{0,80}booking_number/i);
    assert.match(sql, /unique index[\s\S]{0,80}idempotency/i);
  });

  it("drops the old create_public_salon_booking signature before replacing it", () => {
    assert.match(sql, /drop function if exists public\.create_public_salon_booking/i);
    assert.match(sql, /p_idempotency_key/);
  });

  it("replays an idempotent booking instead of erroring or double-booking", () => {
    assert.match(sql, /idempotent_replay/);
  });

  it("queues a booking-confirmation notification honoring opt-out and channel preference", () => {
    assert.match(sql, /INSERT INTO notification_outbox/i);
    assert.match(sql, /v_customer_opted_out IS NULL/);
    assert.match(sql, /preferred_channel, opted_out_at INTO/);
  });

  it("keeps create_public_salon_booking callable by anon and authenticated only", () => {
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.create_public_salon_booking[\s\S]{0,120}TO anon, authenticated/);
  });
});

describe("salon events + RINPO actions migration (20260901100003)", () => {
  const sql = readMigration("20260901100003_salon_events_and_rinpo_actions.sql");

  it("only an org.manage approver can update rinpo_actions", () => {
    assert.match(sql, /rinpo_actions_update_approver[\s\S]{0,200}org\.manage/);
  });

  it("lets any org member insert their own pending rinpo_actions row, not someone else's", () => {
    assert.match(sql, /rinpo_actions_insert_member[\s\S]{0,200}user_id = auth\.uid\(\)/);
  });

  it("adds an org-member insert policy for notification_outbox (previously select-only)", () => {
    assert.match(sql, /notification_outbox_member_insert/);
  });

  it("emits salon business events through a single SECURITY DEFINER helper", () => {
    assert.match(sql, /private\.emit_business_event/);
    assert.match(sql, /salon\.booking\.created/);
    assert.match(sql, /salon\.payment\.created/);
  });
});
