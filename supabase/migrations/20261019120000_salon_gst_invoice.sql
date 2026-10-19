-- R GLOW GST tax invoices from POS sales.
-- Additive: branch GSTIN/state columns + org.manage RPC to write
-- organization_settings.settings.billing. Existing salon_sales.sale_number
-- remains the invoice number. No PDF storage, no WhatsApp send.

ALTER TABLE public.salon_branches
  ADD COLUMN IF NOT EXISTS gstin TEXT,
  ADD COLUMN IF NOT EXISTS state_name TEXT,
  ADD COLUMN IF NOT EXISTS state_code TEXT;

COMMENT ON COLUMN public.salon_branches.gstin IS
  'Optional GSTIN for this branch (additional place of business). Empty falls back to organization_settings.settings.billing.gstin.';
COMMENT ON COLUMN public.salon_branches.state_code IS
  'GST state code (two digits). Used as place of supply on tax invoices.';

CREATE OR REPLACE FUNCTION public.update_salon_billing_settings(
  p_organization_id UUID,
  p_legal_name TEXT,
  p_gstin TEXT,
  p_state_name TEXT,
  p_state_code TEXT,
  p_sac_code TEXT DEFAULT '9997',
  p_address TEXT DEFAULT NULL,
  p_pan TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_settings JSONB;
  v_gstin TEXT;
  v_state_code TEXT;
  v_sac TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_permission(p_organization_id, 'org.manage') THEN
    RAISE EXCEPTION 'not authorized to update billing settings';
  END IF;

  v_gstin := NULLIF(upper(btrim(COALESCE(p_gstin, ''))), '');
  IF v_gstin IS NOT NULL AND v_gstin !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' THEN
    RAISE EXCEPTION 'invalid GSTIN';
  END IF;

  v_state_code := NULLIF(btrim(COALESCE(p_state_code, '')), '');
  IF v_state_code IS NULL AND v_gstin IS NOT NULL THEN
    v_state_code := substr(v_gstin, 1, 2);
  END IF;

  v_sac := COALESCE(NULLIF(btrim(COALESCE(p_sac_code, '')), ''), '9997');

  UPDATE public.organization_settings
  SET
    settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
      'billing',
      jsonb_build_object(
        'legalName', COALESCE(NULLIF(btrim(COALESCE(p_legal_name, '')), ''), ''),
        'gstin', COALESCE(v_gstin, ''),
        'stateName', COALESCE(NULLIF(btrim(COALESCE(p_state_name, '')), ''), ''),
        'stateCode', COALESCE(v_state_code, ''),
        'sacCode', v_sac,
        'address', NULLIF(btrim(COALESCE(p_address, '')), ''),
        'pan', NULLIF(upper(btrim(COALESCE(p_pan, ''))), ''),
        'updatedAt', now()
      )
    ),
    updated_at = now()
  WHERE organization_id = p_organization_id
  RETURNING settings INTO v_settings;

  IF v_settings IS NULL THEN
    RAISE EXCEPTION 'organization settings not found';
  END IF;

  RETURN v_settings->'billing';
END;
$$;

REVOKE ALL ON FUNCTION public.update_salon_billing_settings(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_salon_billing_settings(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.update_salon_branch_gstin(
  p_branch_id UUID,
  p_gstin TEXT,
  p_state_name TEXT,
  p_state_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org UUID;
  v_gstin TEXT;
BEGIN
  SELECT organization_id INTO v_org FROM public.salon_branches WHERE id = p_branch_id;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'branch not found';
  END IF;
  IF auth.uid() IS NULL OR NOT private.has_permission(v_org, 'org.manage') THEN
    RAISE EXCEPTION 'not authorized to update branch GSTIN';
  END IF;

  v_gstin := NULLIF(upper(btrim(COALESCE(p_gstin, ''))), '');
  IF v_gstin IS NOT NULL AND v_gstin !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' THEN
    RAISE EXCEPTION 'invalid GSTIN';
  END IF;

  UPDATE public.salon_branches
  SET
    gstin = v_gstin,
    state_name = NULLIF(btrim(COALESCE(p_state_name, '')), ''),
    state_code = COALESCE(NULLIF(btrim(COALESCE(p_state_code, '')), ''), CASE WHEN v_gstin IS NOT NULL THEN substr(v_gstin, 1, 2) END),
    updated_at = now()
  WHERE id = p_branch_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_salon_branch_gstin(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_salon_branch_gstin(UUID, TEXT, TEXT, TEXT) TO authenticated;
