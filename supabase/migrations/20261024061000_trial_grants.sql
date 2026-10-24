-- Release B2: governed seven-day trial entitlement.
-- Browser clients cannot write this table directly. The SECURITY DEFINER RPC
-- validates the database launch gate, ownership, confirmed email, prior-grant
-- history and paid status.

INSERT INTO public.plans (key, name, description, limits, is_active)
VALUES (
  'trial-starter',
  'Trial Starter',
  'Seven-day RINADS Business OS evaluation entitlement.',
  '{"modules":["commerce","inventory","crm","tasks"],"seats":3,"orders_per_month":100}'::jsonb,
  true
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active;

-- Database-authoritative kill switch. There is intentionally no authenticated
-- UPDATE policy on feature_flags, so a browser cannot enable public trials.
INSERT INTO public.feature_flags (key, description, default_enabled)
VALUES (
  'trial.signup.enabled',
  'Allow self-serve governed seven-day trial grants.',
  false
)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.trial_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL DEFAULT 'trial-starter' REFERENCES public.plans(key),
  manifest JSONB NOT NULL DEFAULT '{"modules":["commerce","inventory","crm","tasks"]}'::jsonb,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_trial_grants_org_expires
  ON public.trial_grants (organization_id, expires_at DESC);

ALTER TABLE public.trial_grants ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.trial_grants FROM anon, authenticated;
GRANT SELECT ON TABLE public.trial_grants TO authenticated;

DROP POLICY IF EXISTS trial_grants_member_select ON public.trial_grants;
CREATE POLICY trial_grants_member_select
  ON public.trial_grants
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.is_org_member(organization_id)
  );

CREATE OR REPLACE FUNCTION public.grant_trial(p_org_id UUID)
RETURNS public.trial_grants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_grant public.trial_grants;
  v_existing public.trial_grants;
  v_email_confirmed_at TIMESTAMPTZ;
  v_owner UUID;
  v_template_key TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.feature_flags
    WHERE key = 'trial.signup.enabled'
      AND default_enabled = true
  ) THEN
    RAISE EXCEPTION 'Self-serve trial activation is not enabled';
  END IF;

  SELECT created_by
    INTO v_owner
  FROM public.organizations
  WHERE id = p_org_id
    AND status = 'active';

  IF v_owner IS NULL OR v_owner <> v_uid THEN
    RAISE EXCEPTION 'Only the organization owner may grant its trial';
  END IF;

  IF NOT private.is_org_member(p_org_id) THEN
    RAISE EXCEPTION 'Active organization membership required';
  END IF;

  SELECT email_confirmed_at
    INTO v_email_confirmed_at
  FROM auth.users
  WHERE id = v_uid;

  IF v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Email confirmation required before trial activation';
  END IF;

  SELECT * INTO v_existing
  FROM public.trial_grants
  WHERE organization_id = p_org_id OR user_id = v_uid
  ORDER BY created_at ASC
  LIMIT 1;

  IF FOUND THEN
    -- Idempotent retry for the exact same owner/org pair. A trial is never
    -- extended by repeating the RPC.
    IF v_existing.organization_id = p_org_id AND v_existing.user_id = v_uid THEN
      RETURN v_existing;
    END IF;
    RAISE EXCEPTION 'Trial already used by this user or organization';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organization_subscriptions
    WHERE organization_id = p_org_id
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Organization already has an active paid subscription';
  END IF;

  SELECT vertical_key
    INTO v_template_key
  FROM public.organization_settings
  WHERE organization_id = p_org_id;

  IF v_template_key IS NULL THEN
    v_template_key := 'starter-business';
  END IF;

  INSERT INTO public.trial_grants (
    organization_id,
    user_id,
    plan_key,
    manifest,
    expires_at
  )
  VALUES (
    p_org_id,
    v_uid,
    'trial-starter',
    '{"modules":["commerce","inventory","crm","tasks"]}'::jsonb,
    now() + interval '7 days'
  )
  RETURNING * INTO v_grant;

  INSERT INTO public.tenant_provisioning_jobs (
    organization_id,
    template_key,
    status,
    idempotency_key
  )
  VALUES (
    p_org_id,
    v_template_key,
    'pending',
    'provision:' || p_org_id::text
  )
  ON CONFLICT (organization_id, idempotency_key) DO NOTHING;

  INSERT INTO public.audit_logs (
    organization_id,
    actor_type,
    actor_id,
    action,
    entity,
    entity_id,
    after,
    source
  )
  VALUES (
    p_org_id,
    'user',
    v_uid::text,
    'trial.granted',
    'trial_grants',
    v_grant.id::text,
    jsonb_build_object(
      'plan_key', v_grant.plan_key,
      'granted_at', v_grant.granted_at,
      'expires_at', v_grant.expires_at,
      'template_key', v_template_key
    ),
    'rpc'
  );

  RETURN v_grant;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_trial(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_trial(UUID) TO authenticated;
