import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const sql = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20261019120000_salon_gst_invoice.sql"),
  "utf8"
);

describe("salon GST invoice migration (20261019120000)", () => {
  it("adds branch GSTIN columns without dropping existing salon tables", () => {
    assert.match(sql, /ALTER TABLE public\.salon_branches/i);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS gstin TEXT/i);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS state_code TEXT/i);
    assert.doesNotMatch(sql, /DROP TABLE/i);
  });

  it("gates billing RPCs on org.manage and validates GSTIN", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.update_salon_billing_settings/i);
    assert.match(sql, /has_permission\(p_organization_id, 'org\.manage'\)/);
    assert.match(sql, /invalid GSTIN/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.update_salon_billing_settings[\s\S]*TO authenticated/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.update_salon_billing_settings[\s\S]*FROM PUBLIC, anon, service_role/);
  });

  it("does not enable WhatsApp invoice delivery or create object storage", () => {
    assert.doesNotMatch(sql, /notify-whatsapp|twilio|storage\.objects|s3/i);
  });
});
