-- Phase 12: Vertical marketplace, production billing, custom domains, feature flag overrides

-- A. Vertical marketplace
CREATE TABLE IF NOT EXISTS vertical_templates (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'retail',
  version TEXT NOT NULL DEFAULT '1.0.0',
  seed_module JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vertical_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL REFERENCES vertical_templates(key) ON DELETE CASCADE,
  version TEXT NOT NULL,
  seed_module JSONB NOT NULL DEFAULT '{}',
  changelog TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_key, version)
);

INSERT INTO vertical_templates (key, name, description, category, version, seed_module, is_published) VALUES
  ('ambady-nursery', 'Ambady Nursery & Garden', 'Pebbles, landscaping products, full ERP starter catalog and inventory.', 'nursery', '1.0.0', '{"modules":["commerce","inventory","procurement","fulfilment"]}', true),
  ('generic-retail', 'Generic Retail', 'Minimal catalog, single location, basic shipping for general retail.', 'retail', '1.0.0', '{"modules":["commerce","inventory"]}', true)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_published = EXCLUDED.is_published;

-- B. Production billing (Razorpay)
CREATE TABLE IF NOT EXISTS billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_customer_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider),
  UNIQUE (provider, provider_customer_id)
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_subscription_id TEXT NOT NULL,
  plan_key TEXT NOT NULL REFERENCES plans(key),
  status TEXT NOT NULL DEFAULT 'created',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subscription_id)
);

CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, idempotency_key)
);

CREATE TABLE IF NOT EXISTS usage_counters (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  period_start DATE NOT NULL,
  value INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, metric_key, period_start)
);

CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events(organization_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_counters_org ON usage_counters(organization_id, metric_key, period_start);

-- C. Custom domains (extend organization_domains)
ALTER TABLE organization_domains ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE organization_domains ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'txt'
  CHECK (verification_method IN ('txt', 'cname'));
ALTER TABLE organization_domains ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE organization_domains ADD COLUMN IF NOT EXISTS vercel_domain_id TEXT;
ALTER TABLE organization_domains ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- D. Feature flag overrides
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL REFERENCES feature_flags(key) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (organization_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_flag_override_org
  ON feature_flag_overrides(flag_key, organization_id) WHERE organization_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_flag_override_user
  ON feature_flag_overrides(flag_key, user_id) WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE vertical_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY vertical_templates_read ON vertical_templates FOR SELECT TO authenticated
  USING (is_published = true OR private.has_permission(NULL, 'org.manage'));

CREATE POLICY vertical_template_versions_read ON vertical_template_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY billing_customers_member_select ON billing_customers
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

CREATE POLICY billing_subscriptions_member_select ON billing_subscriptions
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

CREATE POLICY billing_events_member_select ON billing_events
  FOR SELECT TO authenticated USING (organization_id IS NULL OR private.is_org_member(organization_id));

CREATE POLICY usage_counters_member_select ON usage_counters
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

CREATE POLICY feature_flag_overrides_member_select ON feature_flag_overrides
  FOR SELECT TO authenticated USING (
    (organization_id IS NOT NULL AND private.is_org_member(organization_id))
    OR user_id = auth.uid()
  );

CREATE POLICY feature_flag_overrides_org_manage ON feature_flag_overrides
  FOR ALL TO authenticated USING (private.has_permission(organization_id, 'flags.read'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

-- Update provision_tenant to validate template
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
  v_template vertical_templates;
BEGIN
  SELECT * INTO v_template FROM vertical_templates
  WHERE key = p_template_key AND is_published = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown or unpublished template: %', p_template_key;
  END IF;

  v_org := public.create_organization(p_name, p_slug);

  INSERT INTO organization_settings (organization_id, vertical_key, storefront_slug)
  VALUES (v_org.id, p_template_key, p_slug)
  ON CONFLICT (organization_id) DO UPDATE SET vertical_key = EXCLUDED.vertical_key, storefront_slug = EXCLUDED.storefront_slug;

  INSERT INTO organization_subscriptions (organization_id, plan_key, status)
  VALUES (v_org.id, p_plan_key, 'active')
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO tenant_provisioning_jobs (organization_id, template_key, status, idempotency_key)
  VALUES (v_org.id, p_template_key, 'pending', 'provision:' || v_org.id::text)
  ON CONFLICT DO NOTHING;

  INSERT INTO audit_logs (organization_id, actor_type, actor_id, action, entity, entity_id, after)
  VALUES (v_org.id, 'user', auth.uid()::text, 'tenant.provisioned', 'organization', v_org.id::text,
    jsonb_build_object('template_key', p_template_key, 'plan_key', p_plan_key));

  RETURN v_org;
END;
$$;
