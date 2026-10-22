-- Payment-gated tenant activation.
--
-- New organizations may exist before payment so identity, membership, business
-- profile and checkout can be established. Paid plan entitlements and tenant
-- seeding must remain fail-closed until a signature-verified billing event marks
-- the organization subscription active.

ALTER TABLE public.organization_subscriptions
  ALTER COLUMN status SET DEFAULT 'trialing';

CREATE OR REPLACE FUNCTION public.provision_tenant(
  p_name TEXT,
  p_slug TEXT,
  p_template_key TEXT DEFAULT 'ambady-nursery',
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

  -- `trialing` is deliberately non-entitled in @rinads/tenancy. A signed
  -- provider webhook is the only supported path that may promote this row to
  -- `active`. Browser redirects and tenant creation are never entitlement proof.
  INSERT INTO public.organization_subscriptions (organization_id, plan_key, status)
  VALUES (v_org.id, p_plan_key, 'trialing')
  ON CONFLICT (organization_id) DO NOTHING;

  -- Do not enqueue tenant_provisioning_jobs here. The billing webhook enqueues
  -- the idempotent provisioning job only after the provider lifecycle resolves
  -- to the entitlement state `active`.

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
