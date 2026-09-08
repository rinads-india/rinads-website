import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

function readMigration(filename: string): string {
  return readFileSync(join(process.cwd(), "../../supabase/migrations", filename), "utf8");
}

describe("salon communications delivery migration (20260908100000)", () => {
  const sql = readMigration("20260908100000_salon_communications_delivery.sql");

  it("widens notification_outbox.status to include the new honest delivery states", () => {
    assert.match(sql, /ALTER TABLE notification_outbox DROP CONSTRAINT IF EXISTS notification_outbox_status_check/i);
    assert.match(
      sql,
      /ADD CONSTRAINT notification_outbox_status_check CHECK \(status IN \(\s*'pending', 'processing', 'sent', 'delivered', 'read', 'failed', 'not_configured', 'dead_letter'/i
    );
  });

  it("adds provider tracking and backoff columns without dropping existing data", () => {
    for (const column of ["provider", "provider_message_id", "next_attempt_at", "campaign_recipient_id"]) {
      assert.match(sql, new RegExp(`ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS ${column}`, "i"));
    }
  });

  it("does not add a FK for campaign_recipient_id yet (the target table doesn't exist in this migration)", () => {
    assert.doesNotMatch(sql, /campaign_recipient_id[\s\S]*REFERENCES salon_campaign_recipients/i);
  });

  it("creates notification_delivery_events with an idempotency-guaranteeing unique constraint", () => {
    assert.match(sql, /create table if not exists notification_delivery_events/i);
    assert.match(sql, /UNIQUE \(provider, provider_message_id, provider_status\)/);
  });

  it("enables RLS on notification_delivery_events with an is_org_member select policy", () => {
    assert.match(sql, /ALTER TABLE notification_delivery_events ENABLE ROW LEVEL SECURITY/i);
    assert.match(sql, /notification_delivery_events_select_member[\s\S]{0,200}private\.is_org_member\(organization_id\)/);
  });
});

describe("salon segments + campaigns migration (20260908100001)", () => {
  const sql = readMigration("20260908100001_salon_segments_and_campaigns.sql");

  it("adds the salon.campaigns.manage permission scoped to admin and manager only, not staff", () => {
    assert.match(sql, /INSERT INTO permissions \(key, description\) VALUES\s*\n\s*\('salon\.campaigns\.manage'/i);
    const grant = sql.match(/WHERE r\.key IN \('admin', 'manager'\)\s*\n\s*AND p\.key = 'salon\.campaigns\.manage'/i);
    assert.ok(grant, "expected salon.campaigns.manage to be granted to admin and manager only");
    assert.doesNotMatch(sql, /r\.key IN \([^)]*'staff'[^)]*\)\s*\n\s*AND p\.key = 'salon\.campaigns\.manage'/i);
  });

  it("enables RLS on every new table", () => {
    for (const table of ["salon_segments", "salon_campaigns", "salon_campaign_recipients"]) {
      assert.match(sql, new RegExp(`create table if not exists ${table}`, "i"));
      assert.match(sql, new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, "i"));
    }
  });

  it("gates campaign drafting behind salon.campaigns.manage, distinct from the approve/send gate", () => {
    assert.match(sql, /salon_campaigns_update_draft[\s\S]{0,200}status = 'draft' AND private\.has_permission\(organization_id, 'salon\.campaigns\.manage'\)/);
    assert.match(sql, /salon_campaigns_update_approve[\s\S]{0,200}private\.has_permission\(organization_id, 'org\.manage'\)/);
  });

  it("gates campaign_recipients insert/update behind org.manage, not the lighter drafting permission", () => {
    assert.match(
      sql,
      /salon_campaign_recipients_insert_approver[\s\S]{0,200}private\.has_permission\(organization_id, 'org\.manage'\)/
    );
    assert.match(
      sql,
      /salon_campaign_recipients_update_approver[\s\S]{0,200}private\.has_permission\(organization_id, 'org\.manage'\)/
    );
  });

  it("adds the deferred campaign_recipient_id FK now that the target table exists, guarded against re-adding", () => {
    assert.match(sql, /notification_outbox_campaign_recipient_id_fkey/);
    assert.match(sql, /FOREIGN KEY \(campaign_recipient_id\) REFERENCES salon_campaign_recipients\(id\) ON DELETE SET NULL/);
    assert.match(sql, /SELECT 1 FROM pg_constraint WHERE conname = 'notification_outbox_campaign_recipient_id_fkey'/);
  });

  it("enforces one recipient row per (campaign, customer) to make sendCampaign idempotent", () => {
    assert.match(sql, /salon_campaign_recipients[\s\S]*UNIQUE \(campaign_id, customer_id\)/);
  });

  it("recomputes campaign counts from a fresh COUNT(*) rather than incrementing/decrementing", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION salon_recompute_campaign_counts/i);
    assert.match(sql, /count\(\*\) FILTER \(WHERE status = 'sent'\)/);
    assert.doesNotMatch(sql, /sent_count = sent_count \+ 1/);
  });

  it("never downgrades a converted recipient when syncing from the outbox", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION salon_sync_campaign_recipient_from_outbox/i);
    assert.match(sql, /WHERE id = NEW\.campaign_recipient_id\s*\n\s*AND status <> 'converted'/);
  });

  it("maps dead_letter and not_configured outbox states to a recipient 'failed' status, never fabricating success", () => {
    assert.match(sql, /WHEN 'dead_letter' THEN 'failed'/);
    assert.match(sql, /WHEN 'not_configured' THEN 'failed'/);
  });

  it("attributes a conversion only within a bounded 30-day window on an unconverted sent/delivered recipient", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION salon_appointments_attribute_campaign_conversion/i);
    assert.match(sql, /r\.status IN \('sent', 'delivered'\)/);
    assert.match(sql, /r\.converted_at IS NULL/);
    assert.match(sql, /now\(\) - interval '30 days'/);
  });

  it("emits business events for segment and campaign lifecycle transitions via the shared helper", () => {
    assert.match(sql, /private\.emit_business_event/);
    assert.match(sql, /salon\.segment\.created/);
    assert.match(sql, /salon\.campaign\.created/);
    assert.match(sql, /salon\.campaign\.approved/);
    assert.match(sql, /salon\.campaign\.started/);
    assert.match(sql, /salon\.campaign\.completed/);
    assert.match(sql, /salon\.campaign\.failed/);
    assert.match(sql, /salon\.campaign\.cancelled/);
    assert.match(sql, /salon\.reactivation\.sent/);
    assert.match(sql, /salon\.reactivation\.converted/);
  });
});
