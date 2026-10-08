import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const sql = readFileSync(
  join(process.cwd(), "../../supabase/migrations", "20261008100000_rglow_public_booking_safety.sql"),
  "utf8"
);

describe("R GLOW public booking safety migration", () => {
  it("stores affirmative marketing consent provenance", () => {
    assert.match(sql, /ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ/i);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS marketing_consent_source TEXT/i);
    assert.match(sql, /CASE WHEN p_marketing_consent THEN 'public_booking' ELSE NULL END/i);
  });

  it("keeps transactional confirmations independent from marketing consent", () => {
    assert.match(sql, /Booking confirmations are transactional/i);
    assert.match(sql, /v_customer_opted_out IS NULL/i);
    assert.doesNotMatch(
      sql,
      /IF\s+p_marketing_consent[\s\S]{0,120}INSERT INTO notification_outbox/i
    );
  });

  it("rate-limits anonymous attempts without storing a raw client address", () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS salon_public_booking_rate_limits/i);
    assert.match(sql, /identifier_hash TEXT NOT NULL/i);
    assert.doesNotMatch(sql, /\bip_address\b/i);
    assert.match(sql, /IF v_request_count > 20/i);
    assert.match(sql, /IF v_recent_phone_bookings >= 5/i);
  });

  it("validates phone numbers and requires every requested service to be active", () => {
    assert.match(sql, /v_normalized_phone !~ '\^\\\+\?\[0-9\]\{8,15\}\$'/i);
    assert.match(sql, /v_active_service_count <> cardinality\(p_service_ids\)/i);
  });

  it("does not expose the limiter table through RLS", () => {
    assert.match(sql, /ALTER TABLE salon_public_booking_rate_limits ENABLE ROW LEVEL SECURITY/i);
    assert.match(sql, /REVOKE ALL ON TABLE salon_public_booking_rate_limits FROM PUBLIC, anon, authenticated/i);
  });
});
