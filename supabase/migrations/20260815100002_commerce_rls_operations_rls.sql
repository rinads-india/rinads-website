-- Phase 10: Commerce + Operations RLS and permission seeds
-- Requires core_identity helpers: private.is_org_member, private.has_permission

-- Commerce permissions
INSERT INTO permissions (key, description) VALUES
  ('commerce.catalog.read', 'Read product catalog'),
  ('commerce.catalog.write', 'Manage product catalog'),
  ('commerce.order.read', 'Read orders'),
  ('commerce.order.manage', 'Manage orders'),
  ('commerce.support.read', 'Read support tickets'),
  ('commerce.support.manage', 'Manage support tickets'),
  ('commerce.checkout.place', 'Place checkout orders'),
  ('inventory.read', 'Read inventory and stock'),
  ('inventory.adjust', 'Adjust inventory stock'),
  ('procurement.read', 'Read suppliers and purchase orders'),
  ('procurement.approve', 'Approve purchase orders'),
  ('fulfilment.manage', 'Manage fulfilment workflows'),
  ('returns.manage', 'Manage returns'),
  ('refund.approve', 'Approve refunds'),
  ('tasks.manage', 'Manage operational tasks')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on commerce tables missing it
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on operations tables
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfilments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_list_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;

-- Org-scoped read policy template (staff with org membership)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'products', 'product_variants', 'product_media', 'orders',
    'customer_profiles', 'inventory_locations', 'stock_movements', 'suppliers', 'purchase_orders',
    'fulfilments', 'shipments', 'return_requests', 'operational_tasks', 'operational_alerts'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      t || '_org_member_select',
      t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (private.is_org_member(organization_id))',
      t || '_org_member_select',
      t
    );
  END LOOP;
END $$;

-- Child order tables inherit org scope via orders
DROP POLICY IF EXISTS order_lines_org_member_select ON order_lines;
CREATE POLICY order_lines_org_member_select ON order_lines FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_lines.order_id
      AND private.is_org_member(o.organization_id)
  )
);

DROP POLICY IF EXISTS order_events_org_member_select ON order_events;
CREATE POLICY order_events_org_member_select ON order_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_events.order_id
      AND private.is_org_member(o.organization_id)
  )
);
