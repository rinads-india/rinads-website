-- Phase 11: Platform SaaS control plane schema

-- Plans & subscriptions (foundation — not live billing)
CREATE TABLE IF NOT EXISTS plans (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL REFERENCES plans(key),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  UNIQUE (organization_id)
);

CREATE TABLE IF NOT EXISTS organization_limits (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  limits JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization settings
CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency TEXT NOT NULL DEFAULT 'INR',
  vertical_key TEXT NOT NULL DEFAULT 'ambady-nursery',
  storefront_slug TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant provisioning jobs
CREATE TABLE IF NOT EXISTS tenant_provisioning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  idempotency_key TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (organization_id, idempotency_key)
);

-- Member invites
CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_org ON tenant_provisioning_jobs(organization_id, status);

-- Seed default plans
INSERT INTO plans (key, name, description, limits) VALUES
  ('starter', 'Starter', 'Single location, core commerce', '{"modules":["commerce","inventory"],"seats":5,"orders_per_month":500}'),
  ('growth', 'Growth', 'Full ERP operations', '{"modules":["commerce","inventory","procurement","fulfilment"],"seats":25,"orders_per_month":5000}'),
  ('platform', 'Platform', 'All modules + priority support', '{"modules":["commerce","inventory","procurement","fulfilment","crm","tasks"],"seats":100,"orders_per_month":50000}')
ON CONFLICT (key) DO NOTHING;

-- Seed platform feature flags
INSERT INTO feature_flags (key, description, default_enabled) VALUES
  ('commerce.enabled', 'Storefront and checkout', true),
  ('erp.inventory', 'Inventory ledger module', true),
  ('erp.procurement', 'Procurement module', true),
  ('erp.fulfilment', 'Fulfilment module', true),
  ('rinpo.ops', 'RINPO operational tools', false)
ON CONFLICT (key) DO NOTHING;

-- RLS on platform tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_provisioning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_read ON plans FOR SELECT TO authenticated USING (true);

CREATE POLICY org_subscriptions_member_select ON organization_subscriptions
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

CREATE POLICY org_settings_member_select ON organization_settings
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

CREATE POLICY org_limits_member_select ON organization_limits
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

CREATE POLICY org_domains_member_select ON organization_domains
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

CREATE POLICY provisioning_jobs_member_select ON tenant_provisioning_jobs
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

CREATE POLICY org_invites_member_select ON organization_invites
  FOR SELECT TO authenticated USING (private.is_org_member(organization_id));

-- Provision tenant RPC (service role or authenticated self-service)
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
BEGIN
  v_org := public.create_organization(p_name, p_slug);

  INSERT INTO organization_settings (organization_id, vertical_key, storefront_slug)
  VALUES (v_org.id, p_template_key, p_slug)
  ON CONFLICT (organization_id) DO UPDATE SET vertical_key = EXCLUDED.vertical_key;

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

REVOKE ALL ON FUNCTION public.provision_tenant(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_tenant(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Suspend tenant (privileged — typically service role)
CREATE OR REPLACE FUNCTION public.set_organization_status(
  p_org_id UUID,
  p_status TEXT
)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org public.organizations;
BEGIN
  IF p_status NOT IN ('active', 'suspended', 'archived') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.organizations
  SET status = p_status, updated_at = now()
  WHERE id = p_org_id
  RETURNING * INTO v_org;

  INSERT INTO audit_logs (organization_id, actor_type, actor_id, action, entity, entity_id, after)
  VALUES (p_org_id, 'user', auth.uid()::text, 'tenant.status_changed', 'organization', p_org_id::text,
    jsonb_build_object('status', p_status));

  RETURN v_org;
END;
$$;

REVOKE ALL ON FUNCTION public.set_organization_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_organization_status(UUID, TEXT) TO authenticated;
