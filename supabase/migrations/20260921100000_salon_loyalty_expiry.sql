-- R GLOW loyalty expiry batches (Phase E deferred scope).
-- points_expiry_days NULL = expiry disabled. expire ledger rows are append-only.

ALTER TABLE salon_loyalty_programs
  ADD COLUMN IF NOT EXISTS points_expiry_days INTEGER
  CHECK (points_expiry_days IS NULL OR points_expiry_days > 0);

ALTER TABLE salon_loyalty_ledger_entries
  DROP CONSTRAINT IF EXISTS salon_loyalty_ledger_entries_entry_type_check;

ALTER TABLE salon_loyalty_ledger_entries
  ADD CONSTRAINT salon_loyalty_ledger_entries_entry_type_check
  CHECK (entry_type IN ('earn', 'redeem', 'refund_reversal', 'adjustment', 'redemption_reversal', 'expire'));

CREATE TABLE IF NOT EXISTS salon_loyalty_expiry_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  as_of TIMESTAMPTZ NOT NULL,
  accounts_expired INTEGER NOT NULL DEFAULT 0 CHECK (accounts_expired >= 0),
  points_expired INTEGER NOT NULL DEFAULT 0 CHECK (points_expired >= 0),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_salon_loyalty_expiry_batches_org
  ON salon_loyalty_expiry_batches(organization_id, created_at DESC);

ALTER TABLE salon_loyalty_expiry_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS salon_loyalty_expiry_batches_select ON salon_loyalty_expiry_batches;
CREATE POLICY salon_loyalty_expiry_batches_select ON salon_loyalty_expiry_batches
  FOR SELECT TO authenticated
  USING (private.has_permission(organization_id, 'salon.loyalty.view'));

CREATE OR REPLACE FUNCTION salon_loyalty_post_expire(
  p_organization_id UUID,
  p_account_id UUID,
  p_points INTEGER,
  p_batch_id UUID,
  p_idempotency_key TEXT
) RETURNS salon_loyalty_ledger_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row salon_loyalty_ledger_entries;
  v_balance INTEGER;
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'expire points must be a positive whole number';
  END IF;

  SELECT * INTO v_row
  FROM salon_loyalty_ledger_entries
  WHERE organization_id = p_organization_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  PERFORM 1 FROM salon_loyalty_accounts
  WHERE organization_id = p_organization_id AND id = p_account_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'loyalty account not found';
  END IF;

  SELECT COALESCE(sum(points), 0)::integer INTO v_balance
  FROM salon_loyalty_ledger_entries
  WHERE organization_id = p_organization_id AND account_id = p_account_id;
  IF v_balance < p_points THEN
    RAISE EXCEPTION 'expire would overdraw loyalty balance';
  END IF;

  INSERT INTO salon_loyalty_ledger_entries(
    organization_id, account_id, entry_type, points, reason, idempotency_key
  ) VALUES (
    p_organization_id, p_account_id, 'expire', -p_points,
    'Expiry batch ' || p_batch_id::text, p_idempotency_key
  )
  RETURNING * INTO v_row;

  PERFORM private.emit_business_event(
    p_organization_id,
    'salon.loyalty.expired',
    'salon_loyalty_ledger_entry',
    v_row.id::text,
    jsonb_build_object('account_id', p_account_id, 'points', p_points, 'batch_id', p_batch_id)
  );

  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION salon_loyalty_post_expire(UUID, UUID, INTEGER, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION salon_loyalty_post_expire(UUID, UUID, INTEGER, UUID, TEXT) TO service_role;
