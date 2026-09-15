-- R GLOW Phase E — Slice 1: segmentation + campaign lifecycle.
--
-- Segment -> Draft campaign -> Audience preview -> Approve -> Send -> real
-- Twilio delivery -> webhook-driven states -> conversion attribution. This
-- migration adds the three new tables, a new permission key
-- (`salon.campaigns.manage`, deliberately excluding `staff` — bulk
-- messaging is more sensitive than front-desk POS ops), RLS mirroring the
-- exact `is_org_member`/`has_permission` idiom used throughout Phase D, and
-- the SQL triggers that keep campaign aggregates and conversion
-- attribution consistent regardless of whether the status-changing write
-- came from the Node worker (`processSalonNotificationOutbox`) or the Deno
-- webhook (`notify-whatsapp-webhook`) — neither runtime duplicates this
-- aggregation logic in application code.

-- ---------------------------------------------------------------------------
-- New permission key — admin/manager only, staff excluded deliberately.
-- ---------------------------------------------------------------------------

INSERT INTO permissions (key, description) VALUES
  ('salon.campaigns.manage', 'Draft and manage marketing/reactivation campaigns and customer segments')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key IN ('admin', 'manager')
  AND p.key = 'salon.campaigns.manage'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- salon_segments — saved audience criteria (JSONB, shape matches
-- @rinads/salon's SegmentCriteria type). Segments are reusable and
-- optionally referenced by a campaign; a campaign always keeps its own
-- `criteria` snapshot too, so editing/deleting a segment later never
-- silently changes a campaign that already drafted/sent against it.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_segments_org ON salon_segments(organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- salon_campaigns — draft -> approved -> sending -> completed/
-- partially_failed/failed, with cancelled available before sending starts.
-- Aggregate counts (attempted/sent/delivered/failed/converted) are never
-- written directly by application code — they are only ever recomputed by
-- `salon_recompute_campaign_counts()` below, so they can never drift from
-- the actual `salon_campaign_recipients` rows.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  segment_id UUID REFERENCES salon_segments(id) ON DELETE SET NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  campaign_type TEXT NOT NULL DEFAULT 'custom' CHECK (campaign_type IN ('custom', 'reactivation')),
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
  template_key TEXT NOT NULL DEFAULT 'salon.campaign.custom',
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'approved', 'sending', 'completed', 'partially_failed', 'failed', 'cancelled'
  )),
  scheduled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  estimated_audience INT NOT NULL DEFAULT 0,
  attempted_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  converted_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_campaigns_org ON salon_campaigns(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salon_campaigns_status ON salon_campaigns(organization_id, status);

-- ---------------------------------------------------------------------------
-- salon_campaign_recipients — one row per customer *considered* for the
-- campaign at send time, including skipped ones (with skip_reason) so the
-- campaign detail view can show exclusions honestly, not just successes.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES salon_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES salon_customers(id) ON DELETE CASCADE,
  notification_outbox_id UUID REFERENCES notification_outbox(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'failed', 'skipped', 'converted'
  )),
  skip_reason TEXT,
  converted_at TIMESTAMPTZ,
  converted_appointment_id UUID REFERENCES salon_appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_campaign_recipients_campaign ON salon_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_salon_campaign_recipients_customer ON salon_campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_salon_campaign_recipients_conversion_lookup
  ON salon_campaign_recipients(customer_id, status, converted_at) WHERE converted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Deferred FK from the previous migration (20260908100000): the target
-- table didn't exist yet there.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_outbox_campaign_recipient_id_fkey'
  ) THEN
    ALTER TABLE notification_outbox
      ADD CONSTRAINT notification_outbox_campaign_recipient_id_fkey
      FOREIGN KEY (campaign_recipient_id) REFERENCES salon_campaign_recipients(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION salon_campaigns_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_segments_updated_at ON salon_segments;
CREATE TRIGGER trg_salon_segments_updated_at
  BEFORE UPDATE ON salon_segments
  FOR EACH ROW EXECUTE FUNCTION salon_campaigns_set_updated_at();

DROP TRIGGER IF EXISTS trg_salon_campaigns_updated_at ON salon_campaigns;
CREATE TRIGGER trg_salon_campaigns_updated_at
  BEFORE UPDATE ON salon_campaigns
  FOR EACH ROW EXECUTE FUNCTION salon_campaigns_set_updated_at();

DROP TRIGGER IF EXISTS trg_salon_campaign_recipients_updated_at ON salon_campaign_recipients;
CREATE TRIGGER trg_salon_campaign_recipients_updated_at
  BEFORE UPDATE ON salon_campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION salon_campaigns_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE salon_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY salon_segments_select_member ON salon_segments
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_segments_insert_manage ON salon_segments
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'salon.campaigns.manage'));

CREATE POLICY salon_segments_update_manage ON salon_segments
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'salon.campaigns.manage'))
  WITH CHECK (private.has_permission(organization_id, 'salon.campaigns.manage'));

CREATE POLICY salon_segments_delete_manage ON salon_segments
  FOR DELETE TO authenticated
  USING (private.has_permission(organization_id, 'salon.campaigns.manage'));

CREATE POLICY salon_campaigns_select_member ON salon_campaigns
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_campaigns_insert_manage ON salon_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'salon.campaigns.manage') AND status = 'draft');

-- Drafting/editing: only while still a draft, only for salon.campaigns.manage.
CREATE POLICY salon_campaigns_update_draft ON salon_campaigns
  FOR UPDATE TO authenticated
  USING (status = 'draft' AND private.has_permission(organization_id, 'salon.campaigns.manage'))
  WITH CHECK (status = 'draft' AND private.has_permission(organization_id, 'salon.campaigns.manage'));

-- Approve/send/cancel/status-progression: org.manage only. Combined with
-- the policy above via Postgres's OR-of-permissive-policies semantics for
-- multiple UPDATE policies on the same table (mirrors
-- salon_sale_lines_update_pos's dual-condition style in
-- 20260901100000_salon_pos_checkout.sql).
CREATE POLICY salon_campaigns_update_approve ON salon_campaigns
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

CREATE POLICY salon_campaign_recipients_select_member ON salon_campaign_recipients
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

-- Recipient rows are only ever created by sendCampaign(), which only runs
-- once a campaign has been approved by an org.manage user — so the insert
-- gate matches that, not the lighter salon.campaigns.manage draft gate.
CREATE POLICY salon_campaign_recipients_insert_approver ON salon_campaign_recipients
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

CREATE POLICY salon_campaign_recipients_update_approver ON salon_campaign_recipients
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

-- ---------------------------------------------------------------------------
-- salon_sync_campaign_recipient_from_outbox() — the single place a plain
-- `UPDATE notification_outbox SET status = ...` (issued identically by the
-- Node worker and the Deno webhook function) propagates into the
-- corresponding campaign_recipients row. Never downgrades a recipient
-- that has already converted.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION salon_sync_campaign_recipient_from_outbox()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_status TEXT;
BEGIN
  IF NEW.campaign_recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_recipient_status := CASE NEW.status
    WHEN 'sent' THEN 'sent'
    WHEN 'delivered' THEN 'delivered'
    WHEN 'read' THEN 'delivered'
    WHEN 'failed' THEN 'failed'
    WHEN 'dead_letter' THEN 'failed'
    WHEN 'not_configured' THEN 'failed'
    ELSE NULL
  END;

  IF v_recipient_status IS NOT NULL THEN
    UPDATE salon_campaign_recipients
    SET status = v_recipient_status, notification_outbox_id = NEW.id
    WHERE id = NEW.campaign_recipient_id
      AND status <> 'converted';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_outbox_sync_campaign_recipient ON notification_outbox;
CREATE TRIGGER trg_notification_outbox_sync_campaign_recipient
  AFTER UPDATE OF status, provider_message_id ON notification_outbox
  FOR EACH ROW
  WHEN (NEW.campaign_recipient_id IS NOT NULL)
  EXECUTE FUNCTION salon_sync_campaign_recipient_from_outbox();

-- ---------------------------------------------------------------------------
-- salon_recompute_campaign_counts() — always a fresh COUNT(*) over
-- salon_campaign_recipients, never an increment/decrement, so it is immune
-- to double-counting from re-fired triggers or out-of-order webhook
-- callbacks. Flips salon_campaigns.status to completed/partially_failed/
-- failed once no recipient is left `pending`.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION salon_recompute_campaign_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
  v_current_status TEXT;
  v_total INT;
  v_pending INT;
  v_sent INT;
  v_delivered INT;
  v_failed INT;
  v_converted INT;
  v_skipped INT;
  v_attempted INT;
BEGIN
  v_campaign_id := COALESCE(NEW.campaign_id, OLD.campaign_id);

  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'pending'),
    count(*) FILTER (WHERE status = 'sent'),
    count(*) FILTER (WHERE status = 'delivered'),
    count(*) FILTER (WHERE status = 'failed'),
    count(*) FILTER (WHERE status = 'converted'),
    count(*) FILTER (WHERE status = 'skipped')
  INTO v_total, v_pending, v_sent, v_delivered, v_failed, v_converted, v_skipped
  FROM salon_campaign_recipients
  WHERE campaign_id = v_campaign_id;

  v_attempted := v_total - v_skipped;

  SELECT status INTO v_current_status FROM salon_campaigns WHERE id = v_campaign_id;

  UPDATE salon_campaigns
  SET
    attempted_count = v_attempted,
    sent_count = v_sent,
    delivered_count = v_delivered,
    failed_count = v_failed,
    converted_count = v_converted,
    status = CASE
      WHEN v_current_status = 'sending' AND v_total > 0 AND v_pending = 0 THEN
        CASE
          WHEN v_attempted > 0 AND v_failed = v_attempted THEN 'failed'
          WHEN v_failed > 0 THEN 'partially_failed'
          ELSE 'completed'
        END
      ELSE v_current_status
    END
  WHERE id = v_campaign_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_campaign_recipients_recompute ON salon_campaign_recipients;
CREATE TRIGGER trg_salon_campaign_recipients_recompute
  AFTER INSERT OR UPDATE ON salon_campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION salon_recompute_campaign_counts();

-- ---------------------------------------------------------------------------
-- salon_appointments_attribute_campaign_conversion() — a fresh booking
-- within 30 days of an unconverted 'sent'/'delivered' campaign message to
-- the same customer is attributed as a conversion. Triggers the recompute
-- above via its own UPDATE on salon_campaign_recipients.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION salon_appointments_attribute_campaign_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT r.id INTO v_recipient_id
  FROM salon_campaign_recipients r
  WHERE r.customer_id = NEW.customer_id
    AND r.status IN ('sent', 'delivered')
    AND r.converted_at IS NULL
    AND r.created_at >= now() - interval '30 days'
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    UPDATE salon_campaign_recipients
    SET status = 'converted', converted_at = now(), converted_appointment_id = NEW.id
    WHERE id = v_recipient_id;

    PERFORM private.emit_business_event(
      NEW.organization_id, 'salon.reactivation.converted', 'salon_campaign_recipient', v_recipient_id::text,
      jsonb_build_object('appointment_id', NEW.id, 'customer_id', NEW.customer_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_appointments_attribute_conversion ON salon_appointments;
CREATE TRIGGER trg_salon_appointments_attribute_conversion
  AFTER INSERT ON salon_appointments
  FOR EACH ROW EXECUTE FUNCTION salon_appointments_attribute_campaign_conversion();

-- ---------------------------------------------------------------------------
-- Event emission: salon.segment.created, salon.campaign.*
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION salon_segments_emit_created_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM private.emit_business_event(
    NEW.organization_id, 'salon.segment.created', 'salon_segment', NEW.id::text,
    jsonb_build_object('name', NEW.name)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_segments_emit_created ON salon_segments;
CREATE TRIGGER trg_salon_segments_emit_created
  AFTER INSERT ON salon_segments
  FOR EACH ROW EXECUTE FUNCTION salon_segments_emit_created_event();

CREATE OR REPLACE FUNCTION salon_campaigns_emit_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM private.emit_business_event(
      NEW.organization_id, 'salon.campaign.created', 'salon_campaign', NEW.id::text,
      jsonb_build_object('name', NEW.name, 'campaign_type', NEW.campaign_type)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_event_type := CASE NEW.status
      WHEN 'approved' THEN 'salon.campaign.approved'
      WHEN 'sending' THEN 'salon.campaign.started'
      WHEN 'completed' THEN 'salon.campaign.completed'
      WHEN 'partially_failed' THEN 'salon.campaign.completed'
      WHEN 'failed' THEN 'salon.campaign.failed'
      WHEN 'cancelled' THEN 'salon.campaign.cancelled'
      ELSE NULL
    END;
    IF v_event_type IS NOT NULL THEN
      PERFORM private.emit_business_event(
        NEW.organization_id, v_event_type, 'salon_campaign', NEW.id::text,
        jsonb_build_object('previous_status', OLD.status, 'sent_count', NEW.sent_count, 'failed_count', NEW.failed_count, 'converted_count', NEW.converted_count)
      );
    END IF;
    IF NEW.campaign_type = 'reactivation' AND NEW.status = 'sending' THEN
      PERFORM private.emit_business_event(NEW.organization_id, 'salon.reactivation.sent', 'salon_campaign', NEW.id::text, '{}'::jsonb);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_campaigns_emit_events ON salon_campaigns;
CREATE TRIGGER trg_salon_campaigns_emit_events
  AFTER INSERT OR UPDATE ON salon_campaigns
  FOR EACH ROW EXECUTE FUNCTION salon_campaigns_emit_events();
