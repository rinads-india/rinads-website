-- RINADS Services + RINPO foundation (v5.1 unified architecture)
-- Additive migration — does not drop legacy concepts from uploads.
-- Tenant boundary: organization_id (see ADR-005; legacy docs say business_id).

-- ---------------------------------------------------------------------------
-- Service catalog & delivery network (platform-operated)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  pod_id UUID REFERENCES service_pods(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  pillar TEXT NOT NULL CHECK (pillar IN ('build', 'grow', 'automate', 'transform')),
  pricing_model TEXT NOT NULL DEFAULT 'fixed'
    CHECK (pricing_model IN ('fixed', 'quote', 'retainer', 'hourly')),
  base_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'INR',
  estimated_delivery_days INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_services_platform_slug
  ON services(slug) WHERE organization_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_org_slug
  ON services(organization_id, slug) WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_services_pillar ON services(pillar) WHERE is_active;

CREATE TABLE IF NOT EXISTS service_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pod_id UUID REFERENCES service_pods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  level TEXT NOT NULL DEFAULT 'trainee'
    CHECK (level IN ('trainee', 'seed', 'grower', 'senior', 'lead')),
  skills TEXT[] NOT NULL DEFAULT '{}',
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  current_tasks INT NOT NULL DEFAULT 0,
  max_tasks INT NOT NULL DEFAULT 15,
  completed_tasks INT NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'offboarded')),
  upi_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_partners_pod ON service_partners(pod_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_service_partners_user ON service_partners(user_id);

-- ---------------------------------------------------------------------------
-- Client service orders (tenant-scoped)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  order_number TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'paid', 'assigned', 'in_progress', 'qa', 'revision',
      'client_review', 'delivered', 'cancelled'
    )),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  scope JSONB NOT NULL DEFAULT '{}',
  requirements JSONB NOT NULL DEFAULT '{}',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_service_orders_org_status ON service_orders(organization_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_orders_razorpay_payment
  ON service_orders(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS service_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES service_partners(id) ON DELETE SET NULL,
  pod_id UUID REFERENCES service_pods(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN (
      'assigned', 'acknowledged', 'in_progress', 'submitted', 'qa', 'revision',
      'approved', 'client_review', 'delivered', 'cancelled'
    )),
  payout_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deliverable_url TEXT,
  revision_notes TEXT,
  client_rating INT CHECK (client_rating BETWEEN 1 AND 5),
  client_feedback TEXT,
  revision_count INT NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_tasks_order ON service_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_service_tasks_partner ON service_tasks(partner_id, status);

CREATE TABLE IF NOT EXISTS service_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES service_tasks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  storage_path TEXT,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'qa_passed', 'client_visible', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES service_partners(id) ON DELETE CASCADE,
  task_id UUID REFERENCES service_tasks(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('task', 'commission', 'bonus', 'referral')),
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES service_partners(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  rate_pct NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Webhook idempotency + comms audit
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS whatsapp_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  template TEXT,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  provider_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_log_order ON whatsapp_log(order_id);

CREATE TABLE IF NOT EXISTS organization_health_scores (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  signals JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RINPO tables (extends rinpo_memory_facts from runtime_2)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rinpo_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  context JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rinpo_conversations_org ON rinpo_conversations(organization_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS rinpo_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'executed', 'failed', 'rejected')),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rinpo_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'rinpo', 'system', 'edge_function')),
  actor_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rinpo_audit_org_created ON rinpo_audit_log(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rinpo_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  content_hash TEXT,
  embedding JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, table_name, record_id)
);

CREATE TABLE IF NOT EXISTS rinpo_training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  config JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Order number sequence
-- ---------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS service_order_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_service_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'RINADS-SVC-' || lpad(nextval('service_order_number_seq')::text, 4, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_orders_number ON service_orders;
CREATE TRIGGER trg_service_orders_number
  BEFORE INSERT OR UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION generate_service_order_number();

-- ---------------------------------------------------------------------------
-- assign_service_order — deterministic delivery routing (NOT RINPO)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assign_service_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order service_orders%ROWTYPE;
  v_service services%ROWTYPE;
  v_partner service_partners%ROWTYPE;
  v_task_id UUID;
  v_payout NUMERIC(12,2);
  v_required_skills TEXT[];
BEGIN
  SELECT * INTO v_order FROM service_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'service order not found: %', p_order_id;
  END IF;
  IF v_order.status NOT IN ('paid', 'pending') THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'order not assignable', 'status', v_order.status);
  END IF;

  SELECT * INTO v_service FROM services WHERE id = v_order.service_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'service not found for order %', p_order_id;
  END IF;

  IF v_service.metadata ? 'required_skills' AND jsonb_typeof(v_service.metadata->'required_skills') = 'array' THEN
    SELECT ARRAY_AGG(x) INTO v_required_skills
    FROM jsonb_array_elements_text(v_service.metadata->'required_skills') AS x;
  ELSE
    v_required_skills := ARRAY[]::TEXT[];
  END IF;

  SELECT sp.* INTO v_partner
  FROM service_partners sp
  WHERE sp.status = 'active'
    AND sp.level <> 'trainee'
    AND sp.current_tasks < sp.max_tasks
    AND (v_service.pod_id IS NULL OR sp.pod_id = v_service.pod_id)
    AND (
      COALESCE(array_length(v_required_skills, 1), 0) = 0
      OR sp.skills && v_required_skills
    )
  ORDER BY sp.current_tasks ASC, sp.average_rating DESC, sp.completed_tasks DESC
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE service_orders SET status = 'paid', updated_at = now() WHERE id = p_order_id;
    RETURN jsonb_build_object('assigned', false, 'reason', 'no available partner');
  END IF;

  v_payout := COALESCE((v_service.metadata->>'default_payout')::numeric, 0);

  INSERT INTO service_tasks (order_id, partner_id, pod_id, status, payout_amount, due_date)
  VALUES (p_order_id, v_partner.id, v_partner.pod_id, 'assigned', v_payout, v_order.due_date)
  RETURNING id INTO v_task_id;

  UPDATE service_partners
  SET current_tasks = current_tasks + 1, updated_at = now()
  WHERE id = v_partner.id;

  UPDATE service_orders
  SET status = 'assigned', updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO rinpo_audit_log (organization_id, actor_type, actor_id, action, resource_type, resource_id, metadata)
  VALUES (
    v_order.organization_id, 'system', 'assign_service_order', 'service.assigned',
    'service_order', p_order_id::text,
    jsonb_build_object('task_id', v_task_id, 'partner_id', v_partner.id, 'partner_name', v_partner.name)
  );

  RETURN jsonb_build_object(
    'assigned', true,
    'task_id', v_task_id,
    'partner_id', v_partner.id,
    'partner_name', v_partner.name,
    'pod_id', v_partner.pod_id
  );
END;
$$;

REVOKE ALL ON FUNCTION assign_service_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assign_service_order(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- Seed delivery pods
-- ---------------------------------------------------------------------------

INSERT INTO service_pods (key, name, description, skills) VALUES
  ('social', 'Social Pod', 'Social posts, stories, reels, captions', ARRAY['social', 'content', 'design']),
  ('growth', 'Growth Pod', 'Meta/Google ads, SEO, campaigns', ARRAY['ads', 'seo', 'analytics']),
  ('web', 'Web Pod', 'Websites, landing pages, dashboards', ARRAY['web', 'frontend', 'ecommerce']),
  ('ai_automation', 'AI / Automation Pod', 'Chatbots, workflows, WhatsApp automation', ARRAY['automation', 'ai', 'integrations']),
  ('design', 'Design / Content Pod', 'Branding, creatives, video', ARRAY['design', 'video', 'brand'])
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE service_pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rinpo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rinpo_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rinpo_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rinpo_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rinpo_training_jobs ENABLE ROW LEVEL SECURITY;

-- Platform catalog: authenticated users can read active services/pods
CREATE POLICY services_read ON services FOR SELECT TO authenticated
  USING (is_active AND (organization_id IS NULL OR private.is_org_member(organization_id)));

CREATE POLICY service_pods_read ON service_pods FOR SELECT TO authenticated
  USING (is_active);

CREATE POLICY service_orders_org ON service_orders FOR ALL TO authenticated
  USING (private.is_org_member(organization_id))
  WITH CHECK (private.is_org_member(organization_id));

CREATE POLICY service_tasks_org ON service_tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_orders o
      WHERE o.id = service_tasks.order_id
        AND private.is_org_member(o.organization_id)
    )
    OR EXISTS (
      SELECT 1 FROM service_partners sp
      WHERE sp.id = service_tasks.partner_id AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY service_deliverables_org ON service_deliverables FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY rinpo_conversations_org ON rinpo_conversations FOR ALL TO authenticated
  USING (private.is_org_member(organization_id) AND user_id = auth.uid())
  WITH CHECK (private.is_org_member(organization_id) AND user_id = auth.uid());

CREATE POLICY rinpo_actions_org ON rinpo_actions FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY rinpo_audit_org ON rinpo_audit_log FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY rinpo_embeddings_org ON rinpo_embeddings FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY rinpo_training_org ON rinpo_training_jobs FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY org_health_member ON organization_health_scores FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY whatsapp_log_org ON whatsapp_log FOR SELECT TO authenticated
  USING (organization_id IS NULL OR private.is_org_member(organization_id));

-- Partners read own profile and earnings
CREATE POLICY service_partners_self ON service_partners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY service_earnings_partner ON service_earnings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_partners sp
      WHERE sp.id = service_earnings.partner_id AND sp.user_id = auth.uid()
    )
  );
