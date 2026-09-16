-- R GLOW Phase E.2 Slice 1 — tenant-scoped, append-only loyalty ledger.

INSERT INTO permissions (key, description) VALUES
  ('salon.loyalty.view', 'View loyalty programs, balances, accounts, and ledger history'),
  ('salon.loyalty.redeem', 'Redeem customer loyalty points at checkout'),
  ('salon.loyalty.manage', 'Configure the salon loyalty program'),
  ('salon.loyalty.adjust', 'Post controlled manual loyalty adjustments')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE (p.key = 'salon.loyalty.view' AND r.key IN ('admin', 'manager', 'staff'))
   OR (p.key = 'salon.loyalty.redeem' AND r.key IN ('admin', 'manager', 'staff'))
   OR (p.key = 'salon.loyalty.manage' AND r.key IN ('admin', 'manager'))
   OR (p.key = 'salon.loyalty.adjust' AND r.key = 'admin')
ON CONFLICT DO NOTHING;

CREATE TABLE salon_loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'R GLOW Rewards',
  is_active BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'INR',
  earn_currency_units INTEGER NOT NULL DEFAULT 100 CHECK (earn_currency_units > 0),
  earn_points INTEGER NOT NULL DEFAULT 1 CHECK (earn_points > 0),
  points_per_currency_unit INTEGER NOT NULL DEFAULT 10 CHECK (points_per_currency_unit > 0),
  tiers JSONB NOT NULL DEFAULT '[{"name":"Member","minimumPoints":0}]'::jsonb CHECK (jsonb_typeof(tiers) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id),
  UNIQUE (organization_id, id)
);

INSERT INTO salon_loyalty_programs (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

CREATE OR REPLACE FUNCTION salon_loyalty_create_default_program() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO salon_loyalty_programs(organization_id) VALUES(NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_salon_loyalty_default_program AFTER INSERT ON organizations
FOR EACH ROW EXECUTE FUNCTION salon_loyalty_create_default_program();
REVOKE ALL ON FUNCTION salon_loyalty_create_default_program() FROM PUBLIC;

CREATE TABLE salon_loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES salon_customers(id) ON DELETE CASCADE,
  lifetime_earned_points INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_earned_points >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, customer_id),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, program_id) REFERENCES salon_loyalty_programs(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE salon_loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL,
  sale_id UUID REFERENCES salon_sales(id) ON DELETE SET NULL,
  points INTEGER NOT NULL CHECK (points > 0),
  currency_value NUMERIC(12,2) NOT NULL CHECK (currency_value > 0),
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'reversed')),
  idempotency_key TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, account_id) REFERENCES salon_loyalty_accounts(organization_id, id) ON DELETE RESTRICT
);

CREATE TABLE salon_loyalty_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('earn', 'redeem', 'refund_reversal', 'adjustment', 'redemption_reversal')),
  points INTEGER NOT NULL CHECK (points <> 0),
  sale_id UUID REFERENCES salon_sales(id) ON DELETE SET NULL,
  refund_id UUID REFERENCES salon_refunds(id) ON DELETE SET NULL,
  redemption_id UUID,
  reason TEXT,
  idempotency_key TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key),
  FOREIGN KEY (organization_id, account_id) REFERENCES salon_loyalty_accounts(organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, redemption_id) REFERENCES salon_loyalty_redemptions(organization_id, id) ON DELETE RESTRICT
);

CREATE INDEX idx_salon_loyalty_accounts_org ON salon_loyalty_accounts(organization_id, created_at DESC);
CREATE INDEX idx_salon_loyalty_accounts_customer ON salon_loyalty_accounts(organization_id, customer_id);
CREATE INDEX idx_salon_loyalty_ledger_account ON salon_loyalty_ledger_entries(organization_id, account_id, created_at DESC);
CREATE INDEX idx_salon_loyalty_ledger_sale ON salon_loyalty_ledger_entries(organization_id, sale_id);
CREATE INDEX idx_salon_loyalty_redemptions_sale ON salon_loyalty_redemptions(organization_id, sale_id);

ALTER TABLE salon_loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_loyalty_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_loyalty_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY salon_loyalty_programs_select ON salon_loyalty_programs FOR SELECT TO authenticated
  USING (private.has_permission(organization_id, 'salon.loyalty.view'));
CREATE POLICY salon_loyalty_programs_insert ON salon_loyalty_programs FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'salon.loyalty.manage'));
CREATE POLICY salon_loyalty_programs_update ON salon_loyalty_programs FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'salon.loyalty.manage'))
  WITH CHECK (private.has_permission(organization_id, 'salon.loyalty.manage'));
CREATE POLICY salon_loyalty_accounts_select ON salon_loyalty_accounts FOR SELECT TO authenticated
  USING (private.has_permission(organization_id, 'salon.loyalty.view'));
CREATE POLICY salon_loyalty_ledger_select ON salon_loyalty_ledger_entries FOR SELECT TO authenticated
  USING (private.has_permission(organization_id, 'salon.loyalty.view'));
CREATE POLICY salon_loyalty_redemptions_select ON salon_loyalty_redemptions FOR SELECT TO authenticated
  USING (private.has_permission(organization_id, 'salon.loyalty.view'));
-- No UPDATE/DELETE policy exists on ledger_entries: the financial history is append-only.

CREATE OR REPLACE FUNCTION salon_loyalty_balance(p_organization_id UUID, p_customer_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE v_balance INTEGER;
BEGIN
  IF NOT private.has_permission(p_organization_id, 'salon.loyalty.view') THEN RAISE EXCEPTION 'insufficient loyalty permission'; END IF;
  SELECT COALESCE(sum(le.points), 0)::integer INTO v_balance
  FROM salon_loyalty_accounts a LEFT JOIN salon_loyalty_ledger_entries le
    ON le.organization_id = a.organization_id AND le.account_id = a.id
  WHERE a.organization_id = p_organization_id AND a.customer_id = p_customer_id;
  RETURN v_balance;
END $$;

CREATE OR REPLACE FUNCTION private.salon_loyalty_account(p_organization_id UUID, p_customer_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_program UUID; v_account UUID;
BEGIN
  PERFORM 1 FROM salon_customers WHERE id=p_customer_id AND organization_id=p_organization_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'tenant customer not found'; END IF;
  SELECT id INTO v_program FROM salon_loyalty_programs WHERE organization_id=p_organization_id AND is_active;
  IF v_program IS NULL THEN RETURN NULL; END IF;
  INSERT INTO salon_loyalty_accounts(organization_id, program_id, customer_id)
  VALUES (p_organization_id, v_program, p_customer_id)
  ON CONFLICT (organization_id, customer_id) DO UPDATE SET updated_at=now()
  RETURNING id INTO v_account;
  RETURN v_account;
END $$;

CREATE OR REPLACE FUNCTION salon_loyalty_redeem(
  p_organization_id UUID, p_customer_id UUID, p_points INTEGER, p_sale_id UUID, p_idempotency_key TEXT
) RETURNS salon_loyalty_redemptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE v_account UUID; v_balance INTEGER; v_rate INTEGER; v_value NUMERIC(12,2); v_row salon_loyalty_redemptions;
BEGIN
  IF NOT private.has_permission(p_organization_id, 'salon.loyalty.redeem') THEN RAISE EXCEPTION 'insufficient loyalty permission'; END IF;
  IF p_points <= 0 OR trim(p_idempotency_key) = '' THEN RAISE EXCEPTION 'positive points and idempotency key required'; END IF;
  SELECT * INTO v_row FROM salon_loyalty_redemptions WHERE organization_id=p_organization_id AND idempotency_key=p_idempotency_key;
  IF FOUND THEN RETURN v_row; END IF;
  v_account := private.salon_loyalty_account(p_organization_id, p_customer_id);
  IF v_account IS NULL THEN RAISE EXCEPTION 'active loyalty program not found'; END IF;
  PERFORM 1 FROM salon_loyalty_accounts WHERE organization_id=p_organization_id AND id=v_account FOR UPDATE;
  SELECT COALESCE(sum(points),0)::integer INTO v_balance FROM salon_loyalty_ledger_entries
    WHERE organization_id=p_organization_id AND account_id=v_account;
  IF v_balance < p_points THEN RAISE EXCEPTION 'insufficient loyalty points'; END IF;
  SELECT points_per_currency_unit INTO v_rate FROM salon_loyalty_programs WHERE organization_id=p_organization_id AND is_active;
  v_value := trunc(p_points::numeric / v_rate, 2);
  IF v_value <= 0 THEN RAISE EXCEPTION 'points are below minimum redemption value'; END IF;
  IF p_sale_id IS NOT NULL THEN
    PERFORM 1 FROM salon_sales WHERE id=p_sale_id AND organization_id=p_organization_id AND customer_id=p_customer_id AND status IN ('draft','awaiting_payment') FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'eligible tenant/customer sale not found'; END IF;
    IF v_value > (SELECT total FROM salon_sales WHERE id=p_sale_id) THEN RAISE EXCEPTION 'redemption value exceeds sale total'; END IF;
    UPDATE salon_sales SET discount_total=discount_total+v_value, total=total-v_value WHERE id=p_sale_id;
  END IF;
  INSERT INTO salon_loyalty_redemptions(organization_id, account_id, sale_id, points, currency_value, idempotency_key, created_by)
  VALUES(p_organization_id,v_account,p_sale_id,p_points,v_value,p_idempotency_key,auth.uid()) RETURNING * INTO v_row;
  INSERT INTO salon_loyalty_ledger_entries(organization_id,account_id,entry_type,points,sale_id,redemption_id,reason,idempotency_key,created_by)
  VALUES(p_organization_id,v_account,'redeem',-p_points,p_sale_id,v_row.id,'Checkout redemption','redeem:'||p_idempotency_key,auth.uid());
  PERFORM private.emit_business_event(p_organization_id,'salon.loyalty.redeemed','salon_loyalty_redemption',v_row.id::text,jsonb_build_object('customer_id',p_customer_id,'points',p_points,'currency_value',v_value));
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION salon_loyalty_adjust(
  p_organization_id UUID, p_customer_id UUID, p_points INTEGER, p_reason TEXT, p_idempotency_key TEXT
) RETURNS salon_loyalty_ledger_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE v_account UUID; v_balance INTEGER; v_row salon_loyalty_ledger_entries;
BEGIN
  IF NOT private.has_permission(p_organization_id, 'salon.loyalty.adjust') THEN RAISE EXCEPTION 'insufficient loyalty permission'; END IF;
  IF p_points=0 OR trim(p_reason)='' OR trim(p_idempotency_key)='' THEN RAISE EXCEPTION 'non-zero points, reason, and idempotency key required'; END IF;
  SELECT * INTO v_row FROM salon_loyalty_ledger_entries WHERE organization_id=p_organization_id AND idempotency_key=p_idempotency_key;
  IF FOUND THEN RETURN v_row; END IF;
  v_account := private.salon_loyalty_account(p_organization_id,p_customer_id);
  IF v_account IS NULL THEN RAISE EXCEPTION 'active loyalty program not found'; END IF;
  PERFORM 1 FROM salon_loyalty_accounts WHERE organization_id=p_organization_id AND id=v_account FOR UPDATE;
  SELECT COALESCE(sum(points),0)::integer INTO v_balance FROM salon_loyalty_ledger_entries WHERE organization_id=p_organization_id AND account_id=v_account;
  IF v_balance+p_points < 0 THEN RAISE EXCEPTION 'adjustment would overdraw loyalty balance'; END IF;
  INSERT INTO salon_loyalty_ledger_entries(organization_id,account_id,entry_type,points,reason,idempotency_key,created_by)
  VALUES(p_organization_id,v_account,'adjustment',p_points,p_reason,p_idempotency_key,auth.uid()) RETURNING * INTO v_row;
  PERFORM private.emit_business_event(p_organization_id,'salon.loyalty.adjusted','salon_loyalty_ledger_entry',v_row.id::text,jsonb_build_object('customer_id',p_customer_id,'points',p_points,'reason',p_reason));
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION salon_loyalty_earn_paid_sale() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_program salon_loyalty_programs; v_account UUID; v_points INTEGER; v_inserted INTEGER;
BEGIN
  IF NEW.status='paid' AND OLD.status IS DISTINCT FROM 'paid' AND NEW.customer_id IS NOT NULL THEN
    SELECT * INTO v_program FROM salon_loyalty_programs WHERE organization_id=NEW.organization_id AND is_active;
    IF FOUND THEN
      v_points := floor(NEW.total / v_program.earn_currency_units)::integer * v_program.earn_points;
      IF v_points > 0 THEN
        v_account := private.salon_loyalty_account(NEW.organization_id,NEW.customer_id);
        INSERT INTO salon_loyalty_ledger_entries(organization_id,account_id,entry_type,points,sale_id,reason,idempotency_key)
        VALUES(NEW.organization_id,v_account,'earn',v_points,NEW.id,'Paid sale','sale-earn:'||NEW.id)
        ON CONFLICT (organization_id,idempotency_key) DO NOTHING;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        IF v_inserted = 1 THEN
          UPDATE salon_loyalty_accounts SET lifetime_earned_points=lifetime_earned_points+v_points,updated_at=now()
          WHERE organization_id=NEW.organization_id AND id=v_account;
          PERFORM private.emit_business_event(NEW.organization_id,'salon.loyalty.earned','salon_sale',NEW.id::text,jsonb_build_object('customer_id',NEW.customer_id,'points',v_points));
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_salon_loyalty_earn_paid_sale AFTER UPDATE ON salon_sales
FOR EACH ROW EXECUTE FUNCTION salon_loyalty_earn_paid_sale();

CREATE OR REPLACE FUNCTION salon_loyalty_reverse_processed_refund() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sale salon_sales; v_account UUID; v_earned INTEGER; v_balance INTEGER; v_reverse INTEGER; v_inserted INTEGER;
BEGIN
  IF NEW.status='processed' AND OLD.status IS DISTINCT FROM 'processed' THEN
    SELECT * INTO v_sale FROM salon_sales WHERE id=NEW.sale_id AND organization_id=NEW.organization_id;
    IF v_sale.customer_id IS NOT NULL AND v_sale.total > 0 THEN
      SELECT a.id, COALESCE(sum(le.points) FILTER (WHERE le.entry_type='earn' AND le.sale_id=NEW.sale_id),0)
      INTO v_account,v_earned FROM salon_loyalty_accounts a LEFT JOIN salon_loyalty_ledger_entries le ON le.account_id=a.id AND le.organization_id=a.organization_id
      WHERE a.organization_id=NEW.organization_id AND a.customer_id=v_sale.customer_id GROUP BY a.id;
      IF v_account IS NOT NULL THEN
        PERFORM 1 FROM salon_loyalty_accounts WHERE organization_id=NEW.organization_id AND id=v_account FOR UPDATE;
        SELECT COALESCE(sum(points),0)::integer INTO v_balance FROM salon_loyalty_ledger_entries
          WHERE organization_id=NEW.organization_id AND account_id=v_account;
      END IF;
      v_reverse := least(v_earned, greatest(0,v_balance), floor(v_earned * NEW.amount / v_sale.total)::integer);
      IF v_account IS NOT NULL AND v_reverse > 0 THEN
        INSERT INTO salon_loyalty_ledger_entries(organization_id,account_id,entry_type,points,sale_id,refund_id,reason,idempotency_key)
        VALUES(NEW.organization_id,v_account,'refund_reversal',-v_reverse,NEW.sale_id,NEW.id,'Processed refund','refund-reversal:'||NEW.id)
        ON CONFLICT (organization_id,idempotency_key) DO NOTHING;
        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        IF v_inserted = 1 THEN
          PERFORM private.emit_business_event(NEW.organization_id,'salon.loyalty.refund_reversed','salon_refund',NEW.id::text,jsonb_build_object('customer_id',v_sale.customer_id,'points',v_reverse));
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_salon_loyalty_reverse_refund AFTER UPDATE ON salon_refunds
FOR EACH ROW EXECUTE FUNCTION salon_loyalty_reverse_processed_refund();

CREATE OR REPLACE FUNCTION salon_loyalty_earn(
  p_organization_id UUID, p_customer_id UUID, p_points INTEGER, p_reason TEXT, p_idempotency_key TEXT
) RETURNS salon_loyalty_ledger_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE v_account UUID; v_row salon_loyalty_ledger_entries;
BEGIN
  IF NOT private.has_permission(p_organization_id,'salon.loyalty.manage') THEN RAISE EXCEPTION 'insufficient loyalty permission'; END IF;
  IF p_points <= 0 OR trim(p_reason)='' OR trim(p_idempotency_key)='' THEN RAISE EXCEPTION 'positive points, reason, and idempotency key required'; END IF;
  SELECT * INTO v_row FROM salon_loyalty_ledger_entries WHERE organization_id=p_organization_id AND idempotency_key=p_idempotency_key;
  IF FOUND THEN RETURN v_row; END IF;
  v_account := private.salon_loyalty_account(p_organization_id,p_customer_id);
  IF v_account IS NULL THEN RAISE EXCEPTION 'active loyalty program not found'; END IF;
  INSERT INTO salon_loyalty_ledger_entries(organization_id,account_id,entry_type,points,reason,idempotency_key,created_by)
  VALUES(p_organization_id,v_account,'earn',p_points,p_reason,p_idempotency_key,auth.uid()) RETURNING * INTO v_row;
  UPDATE salon_loyalty_accounts SET lifetime_earned_points=lifetime_earned_points+p_points,updated_at=now()
    WHERE organization_id=p_organization_id AND id=v_account;
  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION salon_loyalty_reverse_redemption(
  p_organization_id UUID, p_redemption_id UUID, p_reason TEXT, p_idempotency_key TEXT
) RETURNS salon_loyalty_ledger_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE v_redemption salon_loyalty_redemptions; v_row salon_loyalty_ledger_entries;
BEGIN
  IF NOT private.has_permission(p_organization_id,'salon.loyalty.adjust') THEN RAISE EXCEPTION 'insufficient loyalty permission'; END IF;
  IF trim(p_reason)='' OR trim(p_idempotency_key)='' THEN RAISE EXCEPTION 'reason and idempotency key required'; END IF;
  SELECT * INTO v_row FROM salon_loyalty_ledger_entries WHERE organization_id=p_organization_id AND idempotency_key=p_idempotency_key;
  IF FOUND THEN RETURN v_row; END IF;
  SELECT * INTO v_redemption FROM salon_loyalty_redemptions WHERE organization_id=p_organization_id AND id=p_redemption_id FOR UPDATE;
  IF NOT FOUND OR v_redemption.status <> 'processed' THEN RAISE EXCEPTION 'processed redemption not found'; END IF;
  INSERT INTO salon_loyalty_ledger_entries(organization_id,account_id,entry_type,points,sale_id,redemption_id,reason,idempotency_key,created_by)
  VALUES(p_organization_id,v_redemption.account_id,'redemption_reversal',v_redemption.points,v_redemption.sale_id,v_redemption.id,p_reason,p_idempotency_key,auth.uid())
  RETURNING * INTO v_row;
  UPDATE salon_loyalty_redemptions SET status='reversed' WHERE organization_id=p_organization_id AND id=p_redemption_id;
  IF v_redemption.sale_id IS NOT NULL THEN
    UPDATE salon_sales SET discount_total=greatest(0,discount_total-v_redemption.currency_value),total=total+v_redemption.currency_value
      WHERE organization_id=p_organization_id AND id=v_redemption.sale_id AND status IN ('draft','awaiting_payment');
  END IF;
  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION salon_loyalty_balance(UUID,UUID), salon_loyalty_redeem(UUID,UUID,INTEGER,UUID,TEXT), salon_loyalty_adjust(UUID,UUID,INTEGER,TEXT,TEXT), salon_loyalty_earn(UUID,UUID,INTEGER,TEXT,TEXT), salon_loyalty_reverse_redemption(UUID,UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION salon_loyalty_balance(UUID,UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION salon_loyalty_redeem(UUID,UUID,INTEGER,UUID,TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION salon_loyalty_adjust(UUID,UUID,INTEGER,TEXT,TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION salon_loyalty_earn(UUID,UUID,INTEGER,TEXT,TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION salon_loyalty_reverse_redemption(UUID,UUID,TEXT,TEXT) TO authenticated, service_role;
REVOKE ALL ON FUNCTION private.salon_loyalty_account(UUID,UUID) FROM PUBLIC;
