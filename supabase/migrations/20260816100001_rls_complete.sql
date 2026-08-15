-- Phase 11: Complete RLS policies and role permission grants for commerce + operations

-- Grant commerce/operations permissions to roles
INSERT INTO permissions (key, description) VALUES
  ('commerce.catalog.read', 'Read product catalog'),
  ('commerce.catalog.write', 'Manage product catalog'),
  ('commerce.order.read', 'Read orders'),
  ('commerce.order.manage', 'Manage orders'),
  ('commerce.support.read', 'Read support tickets'),
  ('commerce.support.manage', 'Manage support tickets'),
  ('commerce.checkout.place', 'Place checkout orders'),
  ('inventory.read', 'Read inventory'),
  ('inventory.adjust', 'Adjust inventory'),
  ('procurement.read', 'Read procurement'),
  ('procurement.approve', 'Approve purchase orders'),
  ('fulfilment.manage', 'Manage fulfilment'),
  ('returns.manage', 'Manage returns'),
  ('refund.approve', 'Approve refunds'),
  ('tasks.manage', 'Manage tasks'),
  ('platform.tenants.read', 'Read platform tenants'),
  ('platform.tenants.manage', 'Manage platform tenants')
ON CONFLICT (key) DO NOTHING;

-- Admin gets full commerce + ops
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key = 'admin' AND p.key LIKE ANY(ARRAY['commerce.%', 'inventory.%', 'procurement.%', 'fulfilment.%', 'returns.%', 'refund.%', 'tasks.%', 'org.%', 'audit.%', 'flags.%'])
ON CONFLICT DO NOTHING;

-- Manager: read + manage orders, inventory read, procurement read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'commerce.catalog.read', 'commerce.order.read', 'commerce.order.manage',
  'inventory.read', 'procurement.read', 'fulfilment.manage', 'returns.manage', 'tasks.manage', 'org.read', 'audit.read'
) WHERE r.key = 'manager'
ON CONFLICT DO NOTHING;

-- Staff: operational read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'commerce.catalog.read', 'commerce.order.read', 'inventory.read', 'procurement.read', 'fulfilment.manage', 'tasks.manage', 'org.read'
) WHERE r.key = 'staff'
ON CONFLICT DO NOTHING;

-- Client: checkout + own data
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'commerce.catalog.read', 'commerce.checkout.place', 'commerce.order.read', 'org.read'
) WHERE r.key = 'client'
ON CONFLICT DO NOTHING;

-- Founder/super_admin: platform
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key LIKE 'platform.%'
WHERE r.key IN ('founder', 'super_admin')
ON CONFLICT DO NOTHING;

-- Commerce write policies (admin/manager with permission)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['products', 'product_variants', 'orders', 'customer_profiles'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_org_manage', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, %L)) WITH CHECK (private.is_org_member(organization_id) AND private.has_permission(organization_id, %L))',
      t || '_org_manage', t,
      CASE t WHEN 'products' THEN 'commerce.catalog.write' WHEN 'product_variants' THEN 'commerce.catalog.write' WHEN 'orders' THEN 'commerce.order.manage' ELSE 'org.manage' END,
      CASE t WHEN 'products' THEN 'commerce.catalog.write' WHEN 'product_variants' THEN 'commerce.catalog.write' WHEN 'orders' THEN 'commerce.order.manage' ELSE 'org.manage' END
    );
  END LOOP;
END $$;

-- Customer-scoped order read
DROP POLICY IF EXISTS orders_customer_select ON orders;
CREATE POLICY orders_customer_select ON orders FOR SELECT TO authenticated
USING (
  private.is_org_member(organization_id) AND (
    private.has_permission(organization_id, 'commerce.order.manage') OR
    EXISTS (SELECT 1 FROM customer_profiles cp WHERE cp.id = orders.customer_id AND cp.user_id = auth.uid())
  )
);

-- Inventory operations policies
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['inventory_locations', 'stock_movements', 'suppliers', 'purchase_orders', 'fulfilments', 'operational_tasks'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_ops_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (private.is_org_member(organization_id))',
      t || '_ops_select', t
    );
  END LOOP;
END $$;
