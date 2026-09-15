-- R GLOW Phase E — Slice 1: real communications delivery state.
--
-- Widens the existing `notification_outbox` table (20260818100000) with
-- honest delivery states driven by real Twilio webhook callbacks
-- ('delivered', 'read', 'not_configured', 'dead_letter' — never fabricated)
-- plus provider identifiers and a bounded-backoff `next_attempt_at`. The
-- `campaign_recipient_id` column is added here without a foreign key
-- (the `salon_campaign_recipients` table it will reference doesn't exist
-- yet) — the FK constraint itself is added in the very next migration
-- (20260908100001) once that table exists.
--
-- `notification_delivery_events` mirrors the existing
-- `payment_webhook_events` idempotency pattern
-- (20260824100000_rinads_services_foundation.sql): a `UNIQUE
-- (provider, provider_message_id, provider_status)` constraint means a
-- retried Twilio status callback (Twilio itself retries webhooks that
-- don't 200 quickly) can never double-apply the same status transition.

-- ---------------------------------------------------------------------------
-- Widen notification_outbox.status; add provider/delivery-tracking columns
-- ---------------------------------------------------------------------------

ALTER TABLE notification_outbox DROP CONSTRAINT IF EXISTS notification_outbox_status_check;
ALTER TABLE notification_outbox ADD CONSTRAINT notification_outbox_status_check CHECK (status IN (
  'pending', 'processing', 'sent', 'delivered', 'read', 'failed', 'not_configured', 'dead_letter'
));

ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;
-- Added without a FK here — see migration header note; FK added in
-- 20260908100001_salon_segments_and_campaigns.sql once the target table exists.
ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS campaign_recipient_id UUID;

CREATE INDEX IF NOT EXISTS idx_notification_outbox_provider_message_id
  ON notification_outbox(provider, provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_outbox_next_attempt
  ON notification_outbox(status, next_attempt_at);

-- ---------------------------------------------------------------------------
-- notification_delivery_events — append-only audit of every Twilio status
-- callback received, keyed for idempotent webhook processing.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notification_delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  notification_outbox_id UUID REFERENCES notification_outbox(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'twilio',
  provider_message_id TEXT NOT NULL,
  provider_status TEXT NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_message_id, provider_status)
);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_events_outbox
  ON notification_delivery_events(notification_outbox_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_events_org
  ON notification_delivery_events(organization_id, created_at DESC);

ALTER TABLE notification_delivery_events ENABLE ROW LEVEL SECURITY;

-- Service-role/edge-function writes bypass RLS as usual (see notify-whatsapp
-- and payment-webhook, which both run with the service role key); org
-- members can read their own organization's delivery events (e.g. the
-- future /campaigns detail page).
CREATE POLICY notification_delivery_events_select_member ON notification_delivery_events
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND private.is_org_member(organization_id));
