-- R GLOW Phase D — event emission + RINPO approval reuse.
--
-- Reuses the canonical business_events store (no new event table) and the
-- existing rinpo_actions table (from 20260824100000_rinads_services_foundation.sql)
-- for RINPO-originated sensitive-action approvals, instead of introducing a
-- parallel approval system. rinpo_actions already models exactly
-- pending -> approved/rejected -> executed/failed with an input/output
-- JSONB payload; it only needed two additive columns to carry an approver.

-- ---------------------------------------------------------------------------
-- private.emit_business_event — single insert point so every salon trigger
-- (and, later, TS server actions for non-DB-triggered events like
-- notification delivery) writes the same shape into business_events.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.emit_business_event(
  p_organization_id UUID,
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_payload JSONB DEFAULT '{}',
  p_actor_type TEXT DEFAULT 'system',
  p_actor_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO business_events (
    organization_id, event_type, entity_type, entity_id, payload, source, actor_type, actor_id
  ) VALUES (
    p_organization_id, p_event_type, p_entity_type, p_entity_id, p_payload, 'salon', p_actor_type, p_actor_id
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION private.emit_business_event(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.emit_business_event(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Appointment lifecycle events: salon.booking.created / .confirmed /
-- .rescheduled / .cancelled, salon.appointment.checked_in / .completed /
-- .no_show
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION salon_appointments_emit_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM private.emit_business_event(
      NEW.organization_id, 'salon.booking.created', 'salon_appointment', NEW.id::text,
      jsonb_build_object('branch_id', NEW.branch_id, 'staff_id', NEW.staff_id, 'starts_at', NEW.starts_at, 'booking_number', NEW.booking_number)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_event_type := CASE NEW.status
      WHEN 'confirmed' THEN 'salon.booking.confirmed'
      WHEN 'checked_in' THEN 'salon.appointment.checked_in'
      WHEN 'completed' THEN 'salon.appointment.completed'
      WHEN 'cancelled' THEN 'salon.booking.cancelled'
      WHEN 'no_show' THEN 'salon.appointment.no_show'
      ELSE NULL
    END;
    IF v_event_type IS NOT NULL THEN
      PERFORM private.emit_business_event(
        NEW.organization_id, v_event_type, 'salon_appointment', NEW.id::text,
        jsonb_build_object('previous_status', OLD.status, 'staff_id', NEW.staff_id, 'cancel_reason', NEW.cancel_reason)
      );
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
    AND (NEW.starts_at IS DISTINCT FROM OLD.starts_at OR NEW.ends_at IS DISTINCT FROM OLD.ends_at)
    AND NEW.status = OLD.status
  THEN
    PERFORM private.emit_business_event(
      NEW.organization_id, 'salon.booking.rescheduled', 'salon_appointment', NEW.id::text,
      jsonb_build_object('previous_starts_at', OLD.starts_at, 'starts_at', NEW.starts_at)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_appointments_emit_events ON salon_appointments;
CREATE TRIGGER trg_salon_appointments_emit_events
  AFTER INSERT OR UPDATE ON salon_appointments
  FOR EACH ROW EXECUTE FUNCTION salon_appointments_emit_events();

-- ---------------------------------------------------------------------------
-- salon.customer.created — only fires on a genuinely new customer row (the
-- ON CONFLICT DO UPDATE path in create_public_salon_booking does not insert
-- a new row, so this never double-fires for a repeat customer).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION salon_customers_emit_created_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM private.emit_business_event(NEW.organization_id, 'salon.customer.created', 'salon_customer', NEW.id::text, '{}'::jsonb);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_customers_emit_created ON salon_customers;
CREATE TRIGGER trg_salon_customers_emit_created
  AFTER INSERT ON salon_customers
  FOR EACH ROW EXECUTE FUNCTION salon_customers_emit_created_event();

-- ---------------------------------------------------------------------------
-- Sale/payment/refund events: salon.invoice.created (first transition into
-- 'paid'), salon.payment.created / .succeeded / .failed, salon.refund.created
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION salon_sales_emit_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    PERFORM private.emit_business_event(
      NEW.organization_id, 'salon.invoice.created', 'salon_sale', NEW.id::text,
      jsonb_build_object('sale_number', NEW.sale_number, 'total', NEW.total, 'currency', NEW.currency)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_sales_emit_events ON salon_sales;
CREATE TRIGGER trg_salon_sales_emit_events
  AFTER UPDATE ON salon_sales
  FOR EACH ROW EXECUTE FUNCTION salon_sales_emit_events();

CREATE OR REPLACE FUNCTION salon_payments_emit_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM private.emit_business_event(
      NEW.organization_id, 'salon.payment.created', 'salon_payment', NEW.id::text,
      jsonb_build_object('sale_id', NEW.sale_id, 'method', NEW.method, 'amount', NEW.amount, 'status', NEW.status)
    );
    IF NEW.status = 'succeeded' THEN
      PERFORM private.emit_business_event(
        NEW.organization_id, 'salon.payment.succeeded', 'salon_payment', NEW.id::text,
        jsonb_build_object('sale_id', NEW.sale_id, 'amount', NEW.amount)
      );
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'succeeded' THEN
      PERFORM private.emit_business_event(NEW.organization_id, 'salon.payment.succeeded', 'salon_payment', NEW.id::text, jsonb_build_object('sale_id', NEW.sale_id, 'amount', NEW.amount));
    ELSIF NEW.status = 'failed' THEN
      PERFORM private.emit_business_event(NEW.organization_id, 'salon.payment.failed', 'salon_payment', NEW.id::text, jsonb_build_object('sale_id', NEW.sale_id, 'amount', NEW.amount));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_payments_emit_events ON salon_payments;
CREATE TRIGGER trg_salon_payments_emit_events
  AFTER INSERT OR UPDATE ON salon_payments
  FOR EACH ROW EXECUTE FUNCTION salon_payments_emit_events();

CREATE OR REPLACE FUNCTION salon_refunds_emit_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM private.emit_business_event(
      NEW.organization_id, 'salon.refund.created', 'salon_refund', NEW.id::text,
      jsonb_build_object('sale_id', NEW.sale_id, 'amount', NEW.amount, 'reason', NEW.reason)
    );
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM private.emit_business_event(
      NEW.organization_id, 'salon.refund.' || NEW.status, 'salon_refund', NEW.id::text,
      jsonb_build_object('sale_id', NEW.sale_id, 'amount', NEW.amount)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_refunds_emit_events ON salon_refunds;
CREATE TRIGGER trg_salon_refunds_emit_events
  AFTER INSERT OR UPDATE ON salon_refunds
  FOR EACH ROW EXECUTE FUNCTION salon_refunds_emit_events();

-- ---------------------------------------------------------------------------
-- rinpo_actions — additive columns to record who approved a RINPO-proposed
-- sensitive action, and RLS to let a member propose (insert pending, own
-- row) and an org.manage approver resolve it (update). Previously this
-- table only had a SELECT policy (service-role/edge-function write only);
-- RINPO's approval-required tools (initiate_refund, modify_pricing,
-- modify_discount) now write through the authenticated user's own session.
-- ---------------------------------------------------------------------------

ALTER TABLE rinpo_actions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE rinpo_actions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE rinpo_actions ADD COLUMN IF NOT EXISTS reason TEXT;

CREATE POLICY rinpo_actions_insert_member ON rinpo_actions FOR INSERT TO authenticated
  WITH CHECK (private.is_org_member(organization_id) AND user_id = auth.uid());

CREATE POLICY rinpo_actions_update_approver ON rinpo_actions FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

-- ---------------------------------------------------------------------------
-- notification_outbox previously only had a SELECT policy (service-role /
-- edge-function write only). The salon notification service (Part D)
-- enqueues from the authenticated org-member session, so it needs an
-- INSERT policy — enqueueing an outbound message record carries no
-- financial or destructive risk, so org-membership alone is sufficient.
-- ---------------------------------------------------------------------------

CREATE POLICY notification_outbox_member_insert ON notification_outbox FOR INSERT TO authenticated
  WITH CHECK (private.is_org_member(organization_id));
