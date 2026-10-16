-- RINADS Jewellery OS production MVP
-- Additive vertical extension on top of shared Business OS + Commerce OS.
-- Organization remains the tenant/security boundary. No parallel auth, customer,
-- order, payment, fulfilment, inventory or audit stacks are introduced here.

-- ---------------------------------------------------------------------------
-- Jewellery item attributes (one profile per commerce variant / SKU)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jewellery_item_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  tag_number TEXT NOT NULL,
  design_number TEXT,
  metal_type TEXT NOT NULL DEFAULT 'gold' CHECK (metal_type IN ('gold', 'silver', 'platinum', 'palladium', 'other')),
  purity TEXT NOT NULL DEFAULT '22K',
  gross_weight_grams NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (gross_weight_grams >= 0),
  net_metal_weight_grams NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (net_metal_weight_grams >= 0),
  stone_weight_carat NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (stone_weight_carat >= 0),
  stone_value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (stone_value >= 0),
  making_charge_type TEXT NOT NULL DEFAULT 'fixed' CHECK (making_charge_type IN ('fixed', 'per_gram', 'percentage')),
  making_charge_value NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (making_charge_value >= 0),
  wastage_percent NUMERIC(7,3) NOT NULL DEFAULT 0 CHECK (wastage_percent >= 0 AND wastage_percent <= 100),
  huid TEXT,
  hallmark_number TEXT,
  certification_number TEXT,
  attributes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, variant_id),
  UNIQUE (organization_id, tag_number),
  CHECK (gross_weight_grams >= net_metal_weight_grams)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jewellery_item_profiles_huid_unique
  ON public.jewellery_item_profiles(organization_id, huid)
  WHERE huid IS NOT NULL AND btrim(huid) <> '';

CREATE INDEX IF NOT EXISTS idx_jewellery_item_profiles_org_product
  ON public.jewellery_item_profiles(organization_id, product_id);

-- ---------------------------------------------------------------------------
-- Daily / intraday metal rate book
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jewellery_metal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  metal_type TEXT NOT NULL CHECK (metal_type IN ('gold', 'silver', 'platinum', 'palladium', 'other')),
  purity TEXT NOT NULL,
  buy_rate_per_gram NUMERIC(14,2) NOT NULL CHECK (buy_rate_per_gram >= 0),
  sell_rate_per_gram NUMERIC(14,2) NOT NULL CHECK (sell_rate_per_gram >= 0),
  source TEXT,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jewellery_metal_rates_current
  ON public.jewellery_metal_rates(organization_id, metal_type, purity, effective_at DESC)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Jewellery appointments / assisted selling
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jewellery_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  purpose TEXT NOT NULL DEFAULT 'showroom_visit',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (customer_id IS NOT NULL OR guest_name IS NOT NULL OR guest_phone IS NOT NULL OR guest_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_jewellery_appointments_org_schedule
  ON public.jewellery_appointments(organization_id, scheduled_at, status);

-- ---------------------------------------------------------------------------
-- Old-gold exchange assessment (links to shared order when applied)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jewellery_old_gold_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reference_number TEXT NOT NULL,
  gross_weight_grams NUMERIC(14,3) NOT NULL CHECK (gross_weight_grams > 0),
  net_weight_grams NUMERIC(14,3) NOT NULL CHECK (net_weight_grams >= 0),
  assessed_purity TEXT NOT NULL,
  rate_per_gram NUMERIC(14,2) NOT NULL CHECK (rate_per_gram >= 0),
  gross_value NUMERIC(14,2) NOT NULL CHECK (gross_value >= 0),
  deduction_value NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (deduction_value >= 0),
  net_credit_value NUMERIC(14,2) NOT NULL CHECK (net_credit_value >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'applied', 'cancelled')),
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, reference_number),
  CHECK (gross_weight_grams >= net_weight_grams),
  CHECK (net_credit_value <= gross_value)
);

CREATE INDEX IF NOT EXISTS idx_jewellery_old_gold_org_status
  ON public.jewellery_old_gold_exchanges(organization_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Goldsmith / karigar job work
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.jewellery_job_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  job_number TEXT NOT NULL,
  description TEXT,
  metal_type TEXT NOT NULL DEFAULT 'gold',
  purity TEXT NOT NULL DEFAULT '22K',
  issued_weight_grams NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (issued_weight_grams >= 0),
  received_weight_grams NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (received_weight_grams >= 0),
  wastage_weight_grams NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (wastage_weight_grams >= 0),
  labour_charge NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (labour_charge >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'in_progress', 'received', 'closed', 'cancelled')),
  due_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, job_number)
);

CREATE INDEX IF NOT EXISTS idx_jewellery_job_orders_org_status
  ON public.jewellery_job_orders(organization_id, status, due_at);

-- ---------------------------------------------------------------------------
-- Row-level security. Reads require active org membership. Mutations use the
-- existing platform permission model; Jewellery OS does not invent a second RBAC.
-- ---------------------------------------------------------------------------

ALTER TABLE public.jewellery_item_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewellery_metal_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewellery_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewellery_old_gold_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewellery_job_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jewellery_item_profiles_select_member ON public.jewellery_item_profiles;
CREATE POLICY jewellery_item_profiles_select_member ON public.jewellery_item_profiles
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

DROP POLICY IF EXISTS jewellery_item_profiles_manage ON public.jewellery_item_profiles;
CREATE POLICY jewellery_item_profiles_manage ON public.jewellery_item_profiles
  FOR ALL TO authenticated
  USING (
    private.has_permission(organization_id, 'commerce.catalog.write')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    (private.has_permission(organization_id, 'commerce.catalog.write')
      OR private.has_permission(organization_id, 'org.manage'))
    AND EXISTS (
      SELECT 1
      FROM public.product_variants v
      WHERE v.id = variant_id
        AND v.product_id = product_id
        AND v.organization_id = jewellery_item_profiles.organization_id
    )
  );

DROP POLICY IF EXISTS jewellery_metal_rates_select_member ON public.jewellery_metal_rates;
CREATE POLICY jewellery_metal_rates_select_member ON public.jewellery_metal_rates
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

DROP POLICY IF EXISTS jewellery_metal_rates_manage ON public.jewellery_metal_rates;
CREATE POLICY jewellery_metal_rates_manage ON public.jewellery_metal_rates
  FOR ALL TO authenticated
  USING (
    private.has_permission(organization_id, 'commerce.catalog.write')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    (private.has_permission(organization_id, 'commerce.catalog.write')
      OR private.has_permission(organization_id, 'org.manage'))
    AND (
      location_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.locations l
        WHERE l.id = location_id
          AND l.organization_id = jewellery_metal_rates.organization_id
      )
    )
  );

DROP POLICY IF EXISTS jewellery_appointments_select_member ON public.jewellery_appointments;
CREATE POLICY jewellery_appointments_select_member ON public.jewellery_appointments
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

DROP POLICY IF EXISTS jewellery_appointments_manage ON public.jewellery_appointments;
CREATE POLICY jewellery_appointments_manage ON public.jewellery_appointments
  FOR ALL TO authenticated
  USING (
    private.has_permission(organization_id, 'commerce.order.manage')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    (private.has_permission(organization_id, 'commerce.order.manage')
      OR private.has_permission(organization_id, 'org.manage'))
    AND (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id AND w.organization_id = jewellery_appointments.organization_id
    ))
    AND (location_id IS NULL OR EXISTS (
      SELECT 1 FROM public.locations l
      WHERE l.id = location_id AND l.organization_id = jewellery_appointments.organization_id
    ))
  );

DROP POLICY IF EXISTS jewellery_old_gold_select_member ON public.jewellery_old_gold_exchanges;
CREATE POLICY jewellery_old_gold_select_member ON public.jewellery_old_gold_exchanges
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

DROP POLICY IF EXISTS jewellery_old_gold_manage ON public.jewellery_old_gold_exchanges;
CREATE POLICY jewellery_old_gold_manage ON public.jewellery_old_gold_exchanges
  FOR ALL TO authenticated
  USING (
    private.has_permission(organization_id, 'commerce.order.manage')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    private.has_permission(organization_id, 'commerce.order.manage')
    OR private.has_permission(organization_id, 'org.manage')
  );

DROP POLICY IF EXISTS jewellery_job_orders_select_member ON public.jewellery_job_orders;
CREATE POLICY jewellery_job_orders_select_member ON public.jewellery_job_orders
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

DROP POLICY IF EXISTS jewellery_job_orders_manage ON public.jewellery_job_orders;
CREATE POLICY jewellery_job_orders_manage ON public.jewellery_job_orders
  FOR ALL TO authenticated
  USING (
    private.has_permission(organization_id, 'procurement.approve')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    private.has_permission(organization_id, 'procurement.approve')
    OR private.has_permission(organization_id, 'org.manage')
  );

-- Intentionally no anonymous policies. Customer-facing appointment creation can
-- be added through a validated server endpoint without opening direct table writes.