-- R GLOW Phase E.2 Slice 3 — communications operations and bounded retry.
-- notification_outbox remains the delivery source of truth. Authenticated
-- users can inspect it, but can only mutate retry state through the
-- permission-checked functions below.

INSERT INTO permissions (key, description) VALUES
  ('salon.communications.view', 'View tenant communication delivery operations'),
  ('salon.communications.retry', 'Retry failed tenant communications')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.key IN ('admin', 'manager')
  AND p.key IN ('salon.communications.view', 'salon.communications.retry')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.key = 'staff' AND p.key = 'salon.communications.view'
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_notification_outbox_org_status_created
  ON notification_outbox(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_due_whatsapp
  ON notification_outbox(next_attempt_at, created_at)
  WHERE channel = 'whatsapp' AND status IN ('pending', 'failed', 'not_configured');
CREATE INDEX IF NOT EXISTS idx_notification_outbox_campaign_recipient
  ON notification_outbox(campaign_recipient_id) WHERE campaign_recipient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_delivery_events_timeline
  ON notification_delivery_events(organization_id, notification_outbox_id, created_at ASC);

-- RLS provides row visibility; the permission is intentionally stricter than
-- generic organization membership for the operational communications console.
DROP POLICY IF EXISTS notification_outbox_member_select ON notification_outbox;
CREATE POLICY notification_outbox_communications_select ON notification_outbox
  FOR SELECT TO authenticated
  USING (
    private.has_permission(organization_id, 'salon.communications.view')
    OR private.has_permission(organization_id, 'salon.communications.retry')
  );

DROP POLICY IF EXISTS notification_delivery_events_select_member ON notification_delivery_events;
CREATE POLICY notification_delivery_events_communications_select ON notification_delivery_events
  FOR SELECT TO authenticated
  USING (
    organization_id IS NOT NULL
    AND (
      private.has_permission(organization_id, 'salon.communications.view')
      OR private.has_permission(organization_id, 'salon.communications.retry')
    )
  );

REVOKE INSERT, UPDATE, DELETE ON TABLE notification_delivery_events FROM PUBLIC, authenticated, anon;

-- Close the historical PostgREST UPDATE surface. service_role bypasses RLS and
-- keeps table UPDATE for the worker/webhook; authenticated retries use only RPC.
REVOKE UPDATE ON TABLE notification_outbox FROM PUBLIC, authenticated, anon;

CREATE OR REPLACE FUNCTION public.retry_salon_notification_outbox(
  p_organization_id UUID,
  p_notification_outbox_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_rows JSONB := '[]'::jsonb;
  v_count INT := 0;
  v_has_more BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.has_permission(p_organization_id, 'salon.communications.retry') THEN
    RAISE EXCEPTION 'salon.communications.retry permission required' USING ERRCODE = '42501';
  END IF;

  WITH candidates AS (
    SELECT o.id
    FROM notification_outbox o
    LEFT JOIN salon_campaign_recipients r ON r.id = o.campaign_recipient_id
    WHERE o.organization_id = p_organization_id
      AND o.status IN ('failed', 'dead_letter', 'not_configured')
      AND (p_notification_outbox_id IS NULL OR o.id = p_notification_outbox_id)
      AND (p_campaign_id IS NULL OR r.campaign_id = p_campaign_id)
    ORDER BY o.created_at, o.id
    FOR UPDATE OF o SKIP LOCKED
    LIMIT v_limit
  ), reset_rows AS (
    UPDATE notification_outbox o
    SET status = 'pending',
        attempts = 0,
        last_error = NULL,
        next_attempt_at = NULL,
        provider = NULL,
        provider_message_id = NULL,
        updated_at = now()
    FROM candidates c
    WHERE o.id = c.id
    RETURNING o.id, o.organization_id, o.campaign_recipient_id, o.status,
              o.attempts, o.channel, o.recipient, o.template_key, o.created_at
  ), reset_recipients AS (
    UPDATE salon_campaign_recipients r
    SET status = 'pending', skip_reason = NULL, updated_at = now()
    WHERE r.id IN (
      SELECT campaign_recipient_id FROM reset_rows WHERE campaign_recipient_id IS NOT NULL
    )
      AND r.status <> 'converted'
    RETURNING r.id, r.campaign_id
  ), reset_campaigns AS (
    UPDATE salon_campaigns c
    SET status = 'sending', updated_at = now()
    WHERE c.id IN (SELECT campaign_id FROM reset_recipients)
      AND c.status IN ('failed', 'partially_failed')
    RETURNING c.id
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(reset_rows) ORDER BY created_at), '[]'::jsonb), count(*)::INT
  INTO v_rows, v_count
  FROM reset_rows;

  SELECT EXISTS (
    SELECT 1
    FROM notification_outbox o
    LEFT JOIN salon_campaign_recipients r ON r.id = o.campaign_recipient_id
    WHERE o.organization_id = p_organization_id
      AND o.status IN ('failed', 'dead_letter', 'not_configured')
      AND (p_notification_outbox_id IS NULL OR o.id = p_notification_outbox_id)
      AND (p_campaign_id IS NULL OR r.campaign_id = p_campaign_id)
  ) INTO v_has_more;

  IF v_count > 0 THEN
    INSERT INTO rinpo_audit_log (
      organization_id, actor_type, actor_id, action, resource_type, resource_id, metadata
    ) VALUES (
      p_organization_id, 'user', auth.uid()::text, 'salon.communications.retry',
      CASE WHEN p_campaign_id IS NULL THEN 'notification_outbox' ELSE 'salon_campaign' END,
      COALESCE(p_campaign_id::text, p_notification_outbox_id::text, p_organization_id::text),
      jsonb_build_object('count', v_count, 'limit', v_limit, 'has_more', v_has_more)
    );
    PERFORM private.emit_business_event(
      p_organization_id, 'salon.communications.retry_requested',
      CASE WHEN p_campaign_id IS NULL THEN 'notification_outbox' ELSE 'salon_campaign' END,
      COALESCE(p_campaign_id::text, p_notification_outbox_id::text, p_organization_id::text),
      jsonb_build_object('count', v_count, 'outbox_ids',
        (SELECT COALESCE(jsonb_agg(value->>'id'), '[]'::jsonb) FROM jsonb_array_elements(v_rows))),
      'user', auth.uid()::text
    );
  END IF;

  RETURN jsonb_build_object('rows', v_rows, 'count', v_count, 'has_more', v_has_more, 'limit', v_limit);
END;
$$;

REVOKE ALL ON FUNCTION public.retry_salon_notification_outbox(UUID, UUID, UUID, INT) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.retry_salon_notification_outbox(UUID, UUID, UUID, INT) TO authenticated;

-- One statement both locks and moves due rows to processing. Concurrent workers
-- receive disjoint sets. This is deliberately unavailable to user sessions.
CREATE OR REPLACE FUNCTION public.claim_due_salon_notification_outbox(p_limit INT DEFAULT 25)
RETURNS SETOF notification_outbox
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH candidates AS (
    SELECT id
    FROM notification_outbox
    WHERE channel = 'whatsapp'
      AND status IN ('pending', 'failed', 'not_configured')
      AND (next_attempt_at IS NULL OR next_attempt_at <= now())
    ORDER BY COALESCE(next_attempt_at, created_at), created_at, id
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100)
  )
  UPDATE notification_outbox o
  SET status = 'processing', updated_at = now()
  FROM candidates c
  WHERE o.id = c.id
  RETURNING o.*;
$$;

REVOKE ALL ON FUNCTION public.claim_due_salon_notification_outbox(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_salon_notification_outbox(INT) TO service_role;
