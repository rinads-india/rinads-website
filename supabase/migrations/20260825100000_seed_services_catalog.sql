-- Seed RINADS Services platform catalog + public read policies + tracker RPC

-- Anon/authenticated read of platform catalog (organization_id IS NULL)
DROP POLICY IF EXISTS services_public_catalog ON services;
CREATE POLICY services_public_catalog ON services FOR SELECT TO anon, authenticated
  USING (is_active AND organization_id IS NULL);

DROP POLICY IF EXISTS service_pods_public_read ON service_pods;
CREATE POLICY service_pods_public_read ON service_pods FOR SELECT TO anon, authenticated
  USING (is_active);

-- Public order tracker (safe fields only — no PII)
CREATE OR REPLACE FUNCTION get_public_service_order_status(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_progress INT;
BEGIN
  SELECT
    o.id,
    o.order_number,
    o.status,
    o.created_at,
    o.due_date,
    o.updated_at,
    s.name AS service_name,
    s.pillar
  INTO v_row
  FROM service_orders o
  JOIN services s ON s.id = o.service_id
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_progress := CASE v_row.status
    WHEN 'pending' THEN 5
    WHEN 'paid' THEN 15
    WHEN 'assigned' THEN 25
    WHEN 'in_progress' THEN 50
    WHEN 'qa' THEN 70
    WHEN 'revision' THEN 65
    WHEN 'client_review' THEN 85
    WHEN 'delivered' THEN 100
    WHEN 'cancelled' THEN 0
    ELSE 10
  END;

  RETURN jsonb_build_object(
    'order_id', v_row.id,
    'order_number', v_row.order_number,
    'service_name', v_row.service_name,
    'pillar', v_row.pillar,
    'status', v_row.status,
    'progress_pct', v_progress,
    'created_at', v_row.created_at,
    'due_date', v_row.due_date,
    'updated_at', v_row.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION get_public_service_order_status(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_service_order_status(UUID) TO anon, authenticated;

-- Platform services catalog (prices are starting points — admin-configurable)
INSERT INTO services (slug, name, description, pillar, pod_id, pricing_model, base_price, estimated_delivery_days, metadata)
SELECT
  v.slug,
  v.name,
  v.description,
  v.pillar,
  p.id,
  v.pricing_model,
  v.base_price,
  v.estimated_delivery_days,
  v.metadata::jsonb
FROM (VALUES
  ('social-media-management', 'Social Media Management', 'Monthly social posts, stories, and content calendar.', 'grow', 'social', 'retainer', 14999.00, 30, '{"required_skills":["social","content"]}'),
  ('meta-ads-management', 'Meta Ads Management', 'Paid social campaigns with reporting and optimization.', 'grow', 'growth', 'retainer', 19999.00, 30, '{"required_skills":["ads"]}'),
  ('business-website', 'Business Website', 'Responsive business website with CMS-ready structure.', 'build', 'web', 'fixed', 49999.00, 21, '{"required_skills":["web"],"default_payout":9000}'),
  ('whatsapp-automation', 'WhatsApp Automation', 'Automated WhatsApp flows for leads and follow-ups.', 'automate', 'ai_automation', 'quote', NULL, 14, '{"required_skills":["automation","ai"]}'),
  ('brand-identity-kit', 'Brand Identity Kit', 'Logo, color system, and brand guidelines.', 'transform', 'design', 'fixed', 24999.00, 10, '{"required_skills":["design","brand"]}')
) AS v(slug, name, description, pillar, pod_key, pricing_model, base_price, estimated_delivery_days, metadata)
JOIN service_pods p ON p.key = v.pod_key
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.slug = v.slug AND s.organization_id IS NULL);

-- Staging delivery partner for assignment smoke tests
INSERT INTO service_partners (id, name, email, level, skills, pod_id, max_tasks, status)
SELECT
  'a0000001-0000-4000-8000-000000000001'::uuid,
  'Staging Delivery Partner',
  'delivery@rinads.com',
  'grower',
  ARRAY['social', 'content', 'web', 'ads'],
  p.id,
  15,
  'active'
FROM service_pods p
WHERE p.key = 'web'
  AND NOT EXISTS (SELECT 1 FROM service_partners WHERE id = 'a0000001-0000-4000-8000-000000000001'::uuid);

-- Staging demo org + paid order for assign_service_order() verification
INSERT INTO organizations (id, name, slug, status)
VALUES ('b0000001-0000-4000-8000-000000000001'::uuid, 'Staging Demo', 'staging-demo', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_orders (id, organization_id, service_id, order_number, amount, status)
SELECT
  'c0000001-0000-4000-8000-000000000001'::uuid,
  'b0000001-0000-4000-8000-000000000001'::uuid,
  s.id,
  'RINADS-SVC-STAGING-TEST',
  COALESCE(s.base_price, 10000),
  'paid'
FROM services s
WHERE s.slug = 'business-website' AND s.organization_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM service_orders WHERE id = 'c0000001-0000-4000-8000-000000000001'::uuid);
