-- Release B1: neutral Starter Business template for self-serve RINADS tenants.
-- This migration is additive and intentionally does not grant a trial or paid
-- entitlement. Entitlement remains fail-closed until a signed billing event or
-- the dedicated trial grant flow authorizes the organization.

INSERT INTO public.vertical_templates (
  key,
  name,
  description,
  category,
  version,
  seed_module,
  is_published
)
VALUES (
  'starter-business',
  'Starter Business',
  'Neutral RINADS Business OS workspace for new companies, freelancers and trial tenants.',
  'business',
  '1.0.0',
  '{"modules":["commerce","inventory","crm","tasks"]}'::jsonb,
  true
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  version = EXCLUDED.version,
  seed_module = EXCLUDED.seed_module,
  is_published = EXCLUDED.is_published,
  updated_at = now();

ALTER TABLE public.organization_settings
  ALTER COLUMN vertical_key SET DEFAULT 'starter-business';

CREATE OR REPLACE FUNCTION public.provision_tenant(
  p_name TEXT,
  p_slug TEXT,
  p_template_key TEXT DEFAULT 'starter-business',
  p_plan_key TEXT DEFAULT 'starter'
)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org public.organizations;
  v_template public.vertical_templates;
  v_plan public.plans;
BEGIN
  SELECT * INTO v_template
  FROM public.vertical_templates
  WHERE key = p_template_key AND is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown or unpublished template: %', p_template_key;
  END IF;

  SELECT * INTO v_plan
  FROM public.plans
  WHERE key = p_plan_key AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown or inactive plan: %', p_plan_key;
  END IF;

  v_org := public.create_organization(p_name, p_slug);

  INSERT INTO public.organization_settings (organization_id, vertical_key, storefront_slug)
  VALUES (v_org.id, p_template_key, p_slug)
  ON CONFLICT (organization_id) DO UPDATE
    SET vertical_key = EXCLUDED.vertical_key,
        storefront_slug = EXCLUDED.storefront_slug;

  INSERT INTO public.organization_subscriptions (organization_id, plan_key, status)
  VALUES (v_org.id, p_plan_key, 'trialing')
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO public.audit_logs (
    organization_id,
    actor_type,
    actor_id,
    action,
    entity,
    entity_id,
    after
  )
  VALUES (
    v_org.id,
    'user',
    auth.uid()::text,
    'tenant.created_payment_pending',
    'organization',
    v_org.id::text,
    jsonb_build_object(
      'template_key', p_template_key,
      'plan_key', p_plan_key,
      'subscription_status', 'trialing',
      'provisioning_enqueued', false
    )
  );

  RETURN v_org;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_tenant(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_tenant(TEXT, TEXT, TEXT, TEXT) TO authenticated;
