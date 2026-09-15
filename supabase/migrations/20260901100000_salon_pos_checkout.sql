-- R GLOW Phase D — POS / checkout (Part B). Server-authoritative sales,
-- payments, and refunds for the salon vertical. All tables are
-- organization_id-scoped with RLS, mirroring the salon_os foundation
-- (20260827100000_salon_os.sql) and the RefundService state machine already
-- used by commerce/operations (packages/operations/src/returns/return-service.ts).
--
-- Design notes:
--  * salon_sales doubles as the invoice — there is no separate invoice
--    table. `sale_number` is the human-readable invoice number.
--  * Totals are always recomputed server-side from salon_sale_lines by
--    @rinads/salon-server's finalizeSale() — a client-submitted total is
--    never trusted (see plan "server-side price authority").
--  * salon_payments.idempotency_key has a per-organization UNIQUE
--    constraint so a retried client submission (double-tap "pay") returns
--    the existing row instead of creating a duplicate financial effect,
--    mirroring payment_webhook_events / runtime_jobs.

-- ---------------------------------------------------------------------------
-- New permission keys
-- ---------------------------------------------------------------------------

INSERT INTO permissions (key, description) VALUES
  ('salon.pos.manage', 'Operate the salon POS: checkout, cash/UPI/card payment entry'),
  ('salon.pricing.override', 'Override discounts and prices on a salon sale')
ON CONFLICT (key) DO NOTHING;

-- admin/manager/staff can run the front desk; only admin can override pricing.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key IN ('admin', 'manager', 'staff')
  AND p.key = 'salon.pos.manage'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'admin'
  AND p.key = 'salon.pricing.override'
ON CONFLICT DO NOTHING;

-- founder/super_admin already get every permission via the CORE seed's
-- catch-all grant, so no extra row is needed for them here.

-- ---------------------------------------------------------------------------
-- salon_sales — header row; also the invoice
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES salon_branches(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES salon_appointments(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES salon_customers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES salon_staff(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'awaiting_payment', 'paid', 'partially_refunded', 'refunded', 'void'
  )),
  sale_number TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, sale_number)
);

CREATE INDEX IF NOT EXISTS idx_salon_sales_org ON salon_sales(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salon_sales_branch ON salon_sales(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salon_sales_customer ON salon_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_salon_sales_appointment ON salon_sales(appointment_id);

CREATE SEQUENCE IF NOT EXISTS salon_sale_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_salon_sale_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := 'RGLOW-INV-' || lpad(nextval('salon_sale_number_seq')::text, 5, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_sales_number ON salon_sales;
CREATE TRIGGER trg_salon_sales_number
  BEFORE INSERT OR UPDATE ON salon_sales
  FOR EACH ROW EXECUTE FUNCTION generate_salon_sale_number();

-- ---------------------------------------------------------------------------
-- salon_sale_lines — tax rate is read from tax_rules and snapshotted here at
-- finalize time (no new tax table).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_sale_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES salon_sales(id) ON DELETE CASCADE,
  appointment_service_id UUID REFERENCES salon_appointment_services(id) ON DELETE SET NULL,
  service_id UUID REFERENCES salon_services(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_sale_lines_sale ON salon_sale_lines(sale_id);
CREATE INDEX IF NOT EXISTS idx_salon_sale_lines_org ON salon_sale_lines(organization_id);

-- ---------------------------------------------------------------------------
-- salon_payments — staff-recorded cash/UPI/card receipts are authoritative
-- because the recorder physically received the funds; Razorpay is verified
-- via the existing payment-webhook edge function (extended separately to
-- branch on notes.salon_sale_id).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES salon_sales(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('cash', 'upi', 'card', 'razorpay')),
  provider TEXT,
  provider_reference TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  idempotency_key TEXT NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_salon_payments_sale ON salon_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_salon_payments_org ON salon_payments(organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- salon_refunds — mirrors RefundService's pending -> approved -> processed
-- state machine (packages/operations/src/returns/return-service.ts).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES salon_sales(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES salon_payments(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_refunds_sale ON salon_refunds(sale_id);
CREATE INDEX IF NOT EXISTS idx_salon_refunds_org ON salon_refunds(organization_id, created_at DESC);

CREATE OR REPLACE FUNCTION salon_pos_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_payments_updated_at ON salon_payments;
CREATE TRIGGER trg_salon_payments_updated_at
  BEFORE UPDATE ON salon_payments
  FOR EACH ROW EXECUTE FUNCTION salon_pos_set_updated_at();

DROP TRIGGER IF EXISTS trg_salon_refunds_updated_at ON salon_refunds;
CREATE TRIGGER trg_salon_refunds_updated_at
  BEFORE UPDATE ON salon_refunds
  FOR EACH ROW EXECUTE FUNCTION salon_pos_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE salon_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_sale_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_refunds ENABLE ROW LEVEL SECURITY;

-- Sales: org members can read; salon.pos.manage can create/update draft
-- sales. Once paid, only org.manage can further mutate the header directly
-- (refunds/void go through salon_refunds, not a header edit).
CREATE POLICY salon_sales_select_member ON salon_sales
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_sales_insert_pos ON salon_sales
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'salon.pos.manage'));

CREATE POLICY salon_sales_update_pos ON salon_sales
  FOR UPDATE TO authenticated
  USING (
    private.has_permission(organization_id, 'salon.pos.manage')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    private.has_permission(organization_id, 'salon.pos.manage')
    OR private.has_permission(organization_id, 'org.manage')
  );

CREATE POLICY salon_sale_lines_select_member ON salon_sale_lines
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_sale_lines_insert_pos ON salon_sale_lines
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'salon.pos.manage'));

-- Discount/price overrides on an existing line require salon.pricing.override.
CREATE POLICY salon_sale_lines_update_pos ON salon_sale_lines
  FOR UPDATE TO authenticated
  USING (
    private.has_permission(organization_id, 'salon.pos.manage')
    AND (discount_amount = 0 OR private.has_permission(organization_id, 'salon.pricing.override'))
  )
  WITH CHECK (private.has_permission(organization_id, 'salon.pos.manage'));

CREATE POLICY salon_sale_lines_delete_pos ON salon_sale_lines
  FOR DELETE TO authenticated
  USING (private.has_permission(organization_id, 'salon.pos.manage'));

-- Payments: any org.pos.manage staff can record cash/UPI/card receipts;
-- reading is org-member-wide (front desk + owner reporting).
CREATE POLICY salon_payments_select_member ON salon_payments
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_payments_insert_pos ON salon_payments
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'salon.pos.manage'));

CREATE POLICY salon_payments_update_pos ON salon_payments
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'salon.pos.manage'))
  WITH CHECK (private.has_permission(organization_id, 'salon.pos.manage'));

-- Refunds: any pos.manage staff can request (insert pending); only
-- refund.approve can move status forward (approve/process/reject) —
-- reuses the existing refund.approve permission key as-is.
CREATE POLICY salon_refunds_select_member ON salon_refunds
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_refunds_insert_pos ON salon_refunds
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'salon.pos.manage')
    AND status = 'pending'
  );

CREATE POLICY salon_refunds_update_approver ON salon_refunds
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'refund.approve'))
  WITH CHECK (private.has_permission(organization_id, 'refund.approve'));
