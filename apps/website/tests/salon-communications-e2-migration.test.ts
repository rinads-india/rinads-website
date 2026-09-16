import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const sql = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20260916100002_salon_communications_e2.sql"),
  "utf8"
);

describe("salon communications E.2 migration", () => {
  it("seeds view/retry permissions and explicitly denies authenticated direct updates", () => {
    assert.match(sql, /'salon\.communications\.view'/);
    assert.match(sql, /'salon\.communications\.retry'/);
    assert.match(sql, /REVOKE UPDATE ON TABLE notification_outbox FROM PUBLIC, authenticated, anon/i);
  });

  it("checks retry permission inside a SECURITY DEFINER RPC and restricts grants", () => {
    assert.match(sql, /retry_salon_notification_outbox[\s\S]*SECURITY DEFINER/i);
    assert.match(sql, /private\.has_permission\(p_organization_id, 'salon\.communications\.retry'\)/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.retry_salon_notification_outbox[\s\S]*FROM PUBLIC, anon, service_role/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.retry_salon_notification_outbox[\s\S]*TO authenticated/i);
  });

  it("uses a bounded SKIP LOCKED retry and resets attempts/errors while synchronizing recipients", () => {
    assert.match(sql, /FOR UPDATE OF o SKIP LOCKED/i);
    assert.match(sql, /LEAST\(GREATEST\(COALESCE\(p_limit, 50\), 1\), 100\)/i);
    assert.match(sql, /attempts = 0[\s\S]*last_error = NULL[\s\S]*next_attempt_at = NULL/i);
    assert.match(sql, /UPDATE salon_campaign_recipients r[\s\S]*SET status = 'pending'/i);
    assert.match(sql, /'has_more', v_has_more/i);
  });

  it("exposes atomic due claims to service_role only", () => {
    assert.match(sql, /claim_due_salon_notification_outbox[\s\S]*FOR UPDATE SKIP LOCKED/i);
    assert.match(sql, /SET status = 'processing'/i);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.claim_due_salon_notification_outbox[\s\S]*authenticated/i);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.claim_due_salon_notification_outbox\(INT\) TO service_role/i);
  });
});
