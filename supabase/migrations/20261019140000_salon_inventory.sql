-- R GLOW salon inventory: products, per-branch stock, append-only movements,
-- and atomic stock transfers. Additive. Does not reuse owner-portal ERP
-- tables or demo adapters. organization_id remains the tenant boundary.

INSERT INTO public.permissions (key, description) VALUES
  ('salon.inventory.manage', 'Create salon products, adjust stock, and transfer stock between branches')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE p.key = 'salon.inventory.manage'
  AND r.key IN ('admin', 'manager')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.salon_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'retail',
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  reorder_at NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reorder_at >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_salon_products_org ON public.salon_products(organization_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.salon_stock_levels (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.salon_products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.salon_branches(id) ON DELETE CASCADE,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_stock_levels_org_branch
  ON public.salon_stock_levels(organization_id, branch_id);

CREATE TABLE IF NOT EXISTS public.salon_stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_branch_id UUID NOT NULL REFERENCES public.salon_branches(id),
  to_branch_id UUID NOT NULL REFERENCES public.salon_branches(id),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  idempotency_key TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (organization_id, idempotency_key),
  CHECK (from_branch_id <> to_branch_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_stock_transfers_org
  ON public.salon_stock_transfers(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.salon_stock_transfer_lines (
  transfer_id UUID NOT NULL REFERENCES public.salon_stock_transfers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.salon_products(id),
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (transfer_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.salon_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.salon_products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.salon_branches(id) ON DELETE CASCADE,
  quantity_delta NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('opening', 'adjustment', 'transfer_out', 'transfer_in')),
  transfer_id UUID REFERENCES public.salon_stock_transfers(id) ON DELETE SET NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_stock_movements_org
  ON public.salon_stock_movements(organization_id, created_at DESC);

ALTER TABLE public.salon_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_stock_transfer_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY salon_products_select_member ON public.salon_products
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_products_manage ON public.salon_products
  FOR ALL TO authenticated
  USING (
    private.has_permission(organization_id, 'org.manage')
    OR private.has_permission(organization_id, 'salon.inventory.manage')
  )
  WITH CHECK (
    private.has_permission(organization_id, 'org.manage')
    OR private.has_permission(organization_id, 'salon.inventory.manage')
  );

CREATE POLICY salon_stock_levels_select_member ON public.salon_stock_levels
  FOR SELECT TO authenticated
  USING (
    private.has_permission(organization_id, 'org.manage')
    OR private.is_salon_staff_for_branch(branch_id)
    OR private.is_org_member(organization_id)
  );

CREATE POLICY salon_stock_transfers_select_member ON public.salon_stock_transfers
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_stock_transfer_lines_select_member ON public.salon_stock_transfer_lines
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_stock_movements_select_member ON public.salon_stock_movements
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

-- Mutations go through SECURITY DEFINER RPCs so debit/credit stay one transaction.

CREATE OR REPLACE FUNCTION public.adjust_salon_stock(
  p_organization_id UUID,
  p_branch_id UUID,
  p_product_id UUID,
  p_delta NUMERIC,
  p_reason TEXT DEFAULT 'adjustment',
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_qty NUMERIC;
  v_level public.salon_stock_levels;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    private.has_permission(p_organization_id, 'org.manage')
    OR private.has_permission(p_organization_id, 'salon.inventory.manage')
  ) THEN
    RAISE EXCEPTION 'not authorized to adjust salon stock';
  END IF;
  IF p_delta IS NULL OR p_delta = 0 THEN
    RAISE EXCEPTION 'stock adjustment cannot be zero';
  END IF;
  IF p_reason IS NULL OR p_reason NOT IN ('opening', 'adjustment') THEN
    RAISE EXCEPTION 'invalid stock adjustment reason';
  END IF;

  PERFORM 1 FROM public.salon_branches
  WHERE id = p_branch_id AND organization_id = p_organization_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'branch not found'; END IF;
  PERFORM 1 FROM public.salon_products
  WHERE id = p_product_id AND organization_id = p_organization_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'product not found'; END IF;

  INSERT INTO public.salon_stock_levels (organization_id, product_id, branch_id, quantity)
  VALUES (p_organization_id, p_product_id, p_branch_id, 0)
  ON CONFLICT (product_id, branch_id) DO NOTHING;

  SELECT * INTO v_level
  FROM public.salon_stock_levels
  WHERE product_id = p_product_id AND branch_id = p_branch_id
  FOR UPDATE;

  v_qty := v_level.quantity + p_delta;
  IF v_qty < 0 THEN
    RAISE EXCEPTION 'insufficient stock';
  END IF;

  UPDATE public.salon_stock_levels
  SET quantity = v_qty, updated_at = now()
  WHERE product_id = p_product_id AND branch_id = p_branch_id;

  INSERT INTO public.salon_stock_movements (
    organization_id, product_id, branch_id, quantity_delta, reason, note, created_by
  ) VALUES (
    p_organization_id, p_product_id, p_branch_id, p_delta, p_reason, NULLIF(btrim(COALESCE(p_note, '')), ''), auth.uid()
  );

  RETURN jsonb_build_object('product_id', p_product_id, 'branch_id', p_branch_id, 'quantity', v_qty);
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_salon_stock(
  p_organization_id UUID,
  p_from_branch_id UUID,
  p_to_branch_id UUID,
  p_lines JSONB,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing public.salon_stock_transfers;
  v_transfer_id UUID;
  v_line JSONB;
  v_product UUID;
  v_qty NUMERIC;
  v_from_qty NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    private.has_permission(p_organization_id, 'org.manage')
    OR private.has_permission(p_organization_id, 'salon.inventory.manage')
  ) THEN
    RAISE EXCEPTION 'not authorized to transfer salon stock';
  END IF;
  IF p_from_branch_id = p_to_branch_id THEN
    RAISE EXCEPTION 'source and destination branches must differ';
  END IF;
  IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'idempotency key is required';
  END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'at least one transfer line is required';
  END IF;

  SELECT * INTO v_existing
  FROM public.salon_stock_transfers
  WHERE organization_id = p_organization_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('id', v_existing.id, 'idempotent_replay', true, 'status', v_existing.status);
  END IF;

  PERFORM 1 FROM public.salon_branches
  WHERE id = p_from_branch_id AND organization_id = p_organization_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'source branch not found'; END IF;
  PERFORM 1 FROM public.salon_branches
  WHERE id = p_to_branch_id AND organization_id = p_organization_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'destination branch not found'; END IF;

  INSERT INTO public.salon_stock_transfers (
    organization_id, from_branch_id, to_branch_id, status, idempotency_key, created_by, completed_at
  ) VALUES (
    p_organization_id, p_from_branch_id, p_to_branch_id, 'completed', btrim(p_idempotency_key), auth.uid(), now()
  )
  RETURNING id INTO v_transfer_id;

  FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines)
  LOOP
    v_product := NULLIF(v_line->>'product_id', '')::UUID;
    v_qty := COALESCE((v_line->>'quantity')::NUMERIC, 0);
    IF v_product IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'invalid transfer line';
    END IF;
    PERFORM 1 FROM public.salon_products
    WHERE id = v_product AND organization_id = p_organization_id AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'product not found'; END IF;

    INSERT INTO public.salon_stock_levels (organization_id, product_id, branch_id, quantity)
    VALUES (p_organization_id, v_product, p_from_branch_id, 0)
    ON CONFLICT (product_id, branch_id) DO NOTHING;
    INSERT INTO public.salon_stock_levels (organization_id, product_id, branch_id, quantity)
    VALUES (p_organization_id, v_product, p_to_branch_id, 0)
    ON CONFLICT (product_id, branch_id) DO NOTHING;

    SELECT quantity INTO v_from_qty
    FROM public.salon_stock_levels
    WHERE product_id = v_product AND branch_id = p_from_branch_id
    FOR UPDATE;
    PERFORM 1 FROM public.salon_stock_levels
    WHERE product_id = v_product AND branch_id = p_to_branch_id
    FOR UPDATE;

    IF v_from_qty < v_qty THEN
      RAISE EXCEPTION 'insufficient stock';
    END IF;

    UPDATE public.salon_stock_levels
    SET quantity = quantity - v_qty, updated_at = now()
    WHERE product_id = v_product AND branch_id = p_from_branch_id;
    UPDATE public.salon_stock_levels
    SET quantity = quantity + v_qty, updated_at = now()
    WHERE product_id = v_product AND branch_id = p_to_branch_id;

    INSERT INTO public.salon_stock_transfer_lines (transfer_id, organization_id, product_id, quantity)
    VALUES (v_transfer_id, p_organization_id, v_product, v_qty);

    INSERT INTO public.salon_stock_movements (
      organization_id, product_id, branch_id, quantity_delta, reason, transfer_id, created_by
    ) VALUES
      (p_organization_id, v_product, p_from_branch_id, -v_qty, 'transfer_out', v_transfer_id, auth.uid()),
      (p_organization_id, v_product, p_to_branch_id, v_qty, 'transfer_in', v_transfer_id, auth.uid());
  END LOOP;

  RETURN jsonb_build_object('id', v_transfer_id, 'idempotent_replay', false, 'status', 'completed');
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_salon_stock(UUID, UUID, UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.adjust_salon_stock(UUID, UUID, UUID, NUMERIC, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.transfer_salon_stock(UUID, UUID, UUID, JSONB, TEXT) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_salon_stock(UUID, UUID, UUID, JSONB, TEXT) TO authenticated;
