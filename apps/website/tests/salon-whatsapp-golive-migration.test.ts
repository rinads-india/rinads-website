import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const sql = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20261019100000_salon_whatsapp_golive.sql"),
  "utf8"
);

describe("salon WhatsApp go-live migration (20261019100000)", () => {
  it("seeds salon.whatsapp.send_enabled off by default and never enables delivery", () => {
    assert.match(sql, /INSERT INTO public\.feature_flags/);
    assert.match(sql, /'salon\.whatsapp\.send_enabled'/);
    assert.match(sql, /'salon\.whatsapp\.send_enabled'[\s\S]{0,400}?false/);
    assert.doesNotMatch(sql, /default_enabled\s*,\s*true/i);
    assert.doesNotMatch(sql, /RINADS_COMMUNICATIONS_WORKER_ENABLED/);
  });

  it("scopes the claim RPC to an optional organization allowlist", () => {
    assert.match(sql, /DROP FUNCTION IF EXISTS public\.claim_due_salon_notification_outbox\(INT\)/);
    assert.match(sql, /p_organization_ids UUID\[\] DEFAULT NULL/);
    assert.match(sql, /p_organization_ids IS NULL OR organization_id = ANY \(p_organization_ids\)/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.claim_due_salon_notification_outbox\(INT, UUID\[\]\) TO service_role/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.claim_due_salon_notification_outbox\(INT, UUID\[\]\) FROM PUBLIC, anon, authenticated/);
  });

  it("adds permission-checked RPCs for mode/allowlist and the send flag", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.update_salon_whatsapp_settings/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.set_salon_whatsapp_send_enabled/);
    assert.match(sql, /private\.has_permission\(p_organization_id, 'org\.manage'\)/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.update_salon_whatsapp_settings\(UUID, TEXT, TEXT\[\]\) TO authenticated/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.set_salon_whatsapp_send_enabled\(UUID, BOOLEAN\) TO authenticated/);
  });
});
