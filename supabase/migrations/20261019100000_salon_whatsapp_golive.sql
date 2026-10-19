-- R GLOW WhatsApp go-live readiness (additive, send stays OFF by default).
-- Per-organization flag + sandbox/live mode live in feature_flags /
-- organization_settings.settings.communications.whatsapp. The worker still
-- requires an explicit org allowlist and Twilio secrets; this migration
-- never enables delivery.

INSERT INTO public.feature_flags (key, description, default_enabled)
VALUES (
  'salon.whatsapp.send_enabled',
  'Allow the communications worker to deliver WhatsApp for this organization. Default off. Sandbox allowlist still applies when settings.communications.whatsapp.mode = sandbox.',
  false
)
ON CONFLICT (key) DO NOTHING;

COMMENT ON COLUMN public.organization_settings.settings IS
  'JSONB bag. R GLOW WhatsApp keys live at communications.whatsapp: { mode: off|sandbox|live, sandboxAllowlist: text[], updatedAt: timestamptz }. Default missing/empty is mode=off.';

-- Scope the atomic claim to an explicit tenant allowlist. The previous
-- one-argument form still works (p_organization_ids defaults to NULL = all
-- due WhatsApp rows). Production worker always passes the env allowlist.
DROP FUNCTION IF EXISTS public.claim_due_salon_notification_outbox(INT);

CREATE FUNCTION public.claim_due_salon_notification_outbox(
  p_limit INT DEFAULT 25,
  p_organization_ids UUID[] DEFAULT NULL
)
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
      AND (p_organization_ids IS NULL OR organization_id = ANY (p_organization_ids))
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

REVOKE ALL ON FUNCTION public.claim_due_salon_notification_outbox(INT, UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_salon_notification_outbox(INT, UUID[]) TO service_role;

-- Operator (org.manage) can save sandbox/live mode + allowlist without
-- touching vertical_key or other settings keys.
CREATE OR REPLACE FUNCTION public.update_salon_whatsapp_settings(
  p_organization_id UUID,
  p_mode TEXT,
  p_sandbox_allowlist TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_settings JSONB;
  v_allowlist JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_permission(p_organization_id, 'org.manage') THEN
    RAISE EXCEPTION 'not authorized to update WhatsApp settings';
  END IF;
  IF p_mode IS NULL OR p_mode NOT IN ('off', 'sandbox', 'live') THEN
    RAISE EXCEPTION 'invalid WhatsApp mode';
  END IF;

  v_allowlist := COALESCE(
    (
      SELECT jsonb_agg(DISTINCT trimmed)
      FROM (
        SELECT NULLIF(BTRIM(value), '') AS trimmed
        FROM unnest(COALESCE(p_sandbox_allowlist, ARRAY[]::TEXT[])) AS value
      ) cleaned
      WHERE trimmed IS NOT NULL
    ),
    '[]'::jsonb
  );

  UPDATE public.organization_settings
  SET
    settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
      'communications',
      COALESCE(settings->'communications', '{}'::jsonb) || jsonb_build_object(
        'whatsapp',
        jsonb_build_object(
          'mode', p_mode,
          'sandboxAllowlist', v_allowlist,
          'updatedAt', now()
        )
      )
    ),
    updated_at = now()
  WHERE organization_id = p_organization_id
  RETURNING settings INTO v_settings;

  IF v_settings IS NULL THEN
    RAISE EXCEPTION 'organization settings not found';
  END IF;

  RETURN v_settings->'communications'->'whatsapp';
END;
$$;

REVOKE ALL ON FUNCTION public.update_salon_whatsapp_settings(UUID, TEXT, TEXT[]) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_salon_whatsapp_settings(UUID, TEXT, TEXT[]) TO authenticated;

-- Operator (org.manage) can flip the per-org send flag. Default remains
-- false; this RPC never inserts a true default for other orgs.
CREATE OR REPLACE FUNCTION public.set_salon_whatsapp_send_enabled(
  p_organization_id UUID,
  p_enabled BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_permission(p_organization_id, 'org.manage') THEN
    RAISE EXCEPTION 'not authorized to update WhatsApp send flag';
  END IF;

  UPDATE public.feature_flag_overrides
  SET enabled = p_enabled
  WHERE flag_key = 'salon.whatsapp.send_enabled'
    AND organization_id = p_organization_id
    AND user_id IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.feature_flag_overrides (flag_key, organization_id, enabled)
    VALUES ('salon.whatsapp.send_enabled', p_organization_id, p_enabled);
  END IF;

  RETURN p_enabled;
END;
$$;

REVOKE ALL ON FUNCTION public.set_salon_whatsapp_send_enabled(UUID, BOOLEAN) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.set_salon_whatsapp_send_enabled(UUID, BOOLEAN) TO authenticated;
