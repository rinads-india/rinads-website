-- R GLOW Phase E.2 Slice 2: tenant-scoped review requests and triggered
-- recovery. Delivery remains in notification_outbox; this migration does
-- not introduce a second sender or a production schedule.

INSERT INTO permissions (key, description) VALUES
  ('salon.reviews.manage', 'Manage review requests and triggered recovery automations')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key IN ('admin', 'manager') AND p.key = 'salon.reviews.manage'
ON CONFLICT DO NOTHING;

-- Recovery messages must be cancellable when their source appointment is
-- confirmed/cancelled before the provider worker claims them.
ALTER TABLE notification_outbox DROP CONSTRAINT IF EXISTS notification_outbox_status_check;
ALTER TABLE notification_outbox ADD CONSTRAINT notification_outbox_status_check CHECK (status IN (
  'pending', 'processing', 'sent', 'delivered', 'read', 'failed',
  'not_configured', 'dead_letter', 'cancelled'
));

-- Composite candidate keys make every child FK prove that its referenced
-- customer/appointment belongs to the same organization.
ALTER TABLE salon_customers
  ADD CONSTRAINT salon_customers_id_org_unique UNIQUE (id, organization_id);
ALTER TABLE salon_appointments
  ADD CONSTRAINT salon_appointments_id_org_unique UNIQUE (id, organization_id);

CREATE TABLE salon_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('review_request', 'no_show_recovery', 'unconfirmed_booking_recovery')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  delay_minutes INT NOT NULL CHECK (delay_minutes >= 0 AND delay_minutes <= 43200),
  template_key TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, kind),
  UNIQUE (id, organization_id)
);

CREATE TABLE salon_automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id UUID,
  kind TEXT NOT NULL CHECK (kind IN ('review_request', 'no_show_recovery', 'unconfirmed_booking_recovery')),
  appointment_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'skipped', 'failed', 'converted')),
  notification_outbox_id UUID REFERENCES notification_outbox(id) ON DELETE SET NULL,
  skip_reason TEXT,
  last_error TEXT,
  queued_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  converted_appointment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key),
  UNIQUE (id, organization_id),
  FOREIGN KEY (rule_id, organization_id) REFERENCES salon_automation_rules(id, organization_id) ON DELETE SET NULL (rule_id),
  FOREIGN KEY (appointment_id, organization_id) REFERENCES salon_appointments(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id, organization_id) REFERENCES salon_customers(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (converted_appointment_id, organization_id) REFERENCES salon_appointments(id, organization_id) ON DELETE SET NULL (converted_appointment_id)
);

CREATE TABLE salon_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  automation_run_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  public_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'opened', 'submitted', 'expired', 'skipped')),
  notification_outbox_id UUID REFERENCES notification_outbox(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, appointment_id),
  UNIQUE (id, organization_id),
  FOREIGN KEY (automation_run_id, organization_id) REFERENCES salon_automation_runs(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id, organization_id) REFERENCES salon_appointments(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id, organization_id) REFERENCES salon_customers(id, organization_id) ON DELETE CASCADE
);

CREATE TABLE salon_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_request_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) <= 4000),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'escalated', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (review_request_id),
  UNIQUE (id, organization_id),
  FOREIGN KEY (review_request_id, organization_id) REFERENCES salon_review_requests(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id, organization_id) REFERENCES salon_appointments(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id, organization_id) REFERENCES salon_customers(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX idx_salon_automation_rules_org ON salon_automation_rules(organization_id, kind);
CREATE INDEX idx_salon_automation_runs_due ON salon_automation_runs(organization_id, status, due_at);
CREATE INDEX idx_salon_automation_runs_customer ON salon_automation_runs(organization_id, customer_id, created_at DESC);
CREATE INDEX idx_salon_review_requests_customer ON salon_review_requests(organization_id, customer_id, created_at DESC);
CREATE INDEX idx_salon_review_requests_status ON salon_review_requests(organization_id, status, created_at DESC);
CREATE INDEX idx_salon_feedback_org_rating ON salon_feedback(organization_id, rating, created_at DESC);

CREATE OR REPLACE FUNCTION salon_automation_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_salon_automation_rules_updated_at BEFORE UPDATE ON salon_automation_rules
  FOR EACH ROW EXECUTE FUNCTION salon_automation_set_updated_at();
CREATE TRIGGER trg_salon_automation_runs_updated_at BEFORE UPDATE ON salon_automation_runs
  FOR EACH ROW EXECUTE FUNCTION salon_automation_set_updated_at();
CREATE TRIGGER trg_salon_review_requests_updated_at BEFORE UPDATE ON salon_review_requests
  FOR EACH ROW EXECUTE FUNCTION salon_automation_set_updated_at();
CREATE TRIGGER trg_salon_feedback_updated_at BEFORE UPDATE ON salon_feedback
  FOR EACH ROW EXECUTE FUNCTION salon_automation_set_updated_at();

ALTER TABLE salon_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY salon_automation_rules_select ON salon_automation_rules FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY salon_automation_rules_manage ON salon_automation_rules FOR ALL TO authenticated
  USING (private.has_permission(organization_id, 'salon.reviews.manage'))
  WITH CHECK (private.has_permission(organization_id, 'salon.reviews.manage'));
CREATE POLICY salon_automation_runs_select ON salon_automation_runs FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY salon_automation_runs_manage ON salon_automation_runs FOR ALL TO authenticated
  USING (private.has_permission(organization_id, 'salon.reviews.manage'))
  WITH CHECK (private.has_permission(organization_id, 'salon.reviews.manage'));
CREATE POLICY salon_review_requests_select ON salon_review_requests FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY salon_review_requests_manage ON salon_review_requests FOR ALL TO authenticated
  USING (private.has_permission(organization_id, 'salon.reviews.manage'))
  WITH CHECK (private.has_permission(organization_id, 'salon.reviews.manage'));
CREATE POLICY salon_feedback_select ON salon_feedback FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY salon_feedback_manage ON salon_feedback FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'salon.reviews.manage'))
  WITH CHECK (private.has_permission(organization_id, 'salon.reviews.manage'));

-- Opaque, high-entropy request token is the only public capability. The RPC
-- exposes no customer/org data, accepts one immutable submission, and sends
-- every rating to the same completion flow (there is no sentiment gate).
CREATE OR REPLACE FUNCTION submit_salon_feedback(p_token UUID, p_rating SMALLINT, p_comment TEXT DEFAULT NULL)
RETURNS TABLE (feedback_id UUID, accepted BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_request salon_review_requests%ROWTYPE; v_feedback_id UUID;
BEGIN
  IF p_rating < 1 OR p_rating > 5 OR char_length(COALESCE(p_comment, '')) > 4000 THEN
    RAISE EXCEPTION 'Invalid feedback';
  END IF;
  SELECT * INTO v_request FROM salon_review_requests
   WHERE public_token = p_token AND status IN ('queued', 'sent', 'opened') AND expires_at > now()
   FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT NULL::UUID, false; RETURN; END IF;

  INSERT INTO salon_feedback (organization_id, review_request_id, appointment_id, customer_id, rating, comment,
    status)
  VALUES (v_request.organization_id, v_request.id, v_request.appointment_id, v_request.customer_id,
    p_rating, NULLIF(btrim(p_comment), ''), CASE WHEN p_rating <= 3 THEN 'escalated' ELSE 'received' END)
  ON CONFLICT (review_request_id) DO NOTHING RETURNING id INTO v_feedback_id;
  IF v_feedback_id IS NULL THEN RETURN QUERY SELECT NULL::UUID, false; RETURN; END IF;

  UPDATE salon_review_requests SET status = 'submitted', submitted_at = now() WHERE id = v_request.id;
  IF p_rating <= 3 THEN
    INSERT INTO salon_notes (organization_id, entity_type, entity_id, body, visibility, status, due_at)
    VALUES (v_request.organization_id, 'staff_task', v_request.customer_id,
      'Manager follow-up required for customer feedback rated ' || p_rating || '/5.', 'internal', 'open', now());
  END IF;
  RETURN QUERY SELECT v_feedback_id, true;
END;
$$;
REVOKE ALL ON FUNCTION submit_salon_feedback(UUID, SMALLINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_salon_feedback(UUID, SMALLINT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION salon_reviews_emit_events()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'salon_review_requests' AND TG_OP = 'INSERT' THEN
    PERFORM private.emit_business_event(NEW.organization_id, 'salon.review.requested', 'salon_review_request', NEW.id::text,
      jsonb_build_object('appointment_id', NEW.appointment_id, 'customer_id', NEW.customer_id));
  ELSIF TG_TABLE_NAME = 'salon_feedback' AND TG_OP = 'INSERT' THEN
    PERFORM private.emit_business_event(NEW.organization_id, 'salon.feedback.received', 'salon_feedback', NEW.id::text,
      jsonb_build_object('review_request_id', NEW.review_request_id, 'rating', NEW.rating));
  ELSIF TG_TABLE_NAME = 'salon_automation_runs' AND TG_OP = 'UPDATE'
    AND NEW.status = 'queued' AND OLD.status IS DISTINCT FROM 'queued'
    AND NEW.kind IN ('no_show_recovery', 'unconfirmed_booking_recovery') THEN
    PERFORM private.emit_business_event(NEW.organization_id, 'salon.recovery.queued', 'salon_automation_run', NEW.id::text,
      jsonb_build_object('kind', NEW.kind, 'appointment_id', NEW.appointment_id, 'customer_id', NEW.customer_id));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_salon_review_requests_events AFTER INSERT ON salon_review_requests
  FOR EACH ROW EXECUTE FUNCTION salon_reviews_emit_events();
CREATE TRIGGER trg_salon_feedback_events AFTER INSERT ON salon_feedback
  FOR EACH ROW EXECUTE FUNCTION salon_reviews_emit_events();
CREATE TRIGGER trg_salon_automation_runs_events AFTER UPDATE ON salon_automation_runs
  FOR EACH ROW EXECUTE FUNCTION salon_reviews_emit_events();

CREATE OR REPLACE FUNCTION salon_sync_review_request_from_outbox()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE salon_review_requests SET status = CASE NEW.status
    WHEN 'sent' THEN 'sent'
    WHEN 'delivered' THEN 'sent'
    WHEN 'read' THEN 'opened'
    WHEN 'failed' THEN 'skipped'
    WHEN 'dead_letter' THEN 'skipped'
    WHEN 'not_configured' THEN 'skipped'
    WHEN 'cancelled' THEN 'skipped'
    ELSE status
  END
  WHERE notification_outbox_id = NEW.id AND status <> 'submitted';
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_salon_sync_review_request_from_outbox
  AFTER UPDATE OF status ON notification_outbox
  FOR EACH ROW EXECUTE FUNCTION salon_sync_review_request_from_outbox();

-- A recovery that is no longer applicable must not remain eligible for
-- delivery. This is deliberately status-driven and does not inspect or route
-- based on predicted sentiment.
CREATE OR REPLACE FUNCTION salon_stop_inapplicable_automations()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  WITH stopped AS (
    UPDATE salon_automation_runs
    SET status = 'skipped',
        skip_reason = 'Appointment status changed; recovery is no longer applicable.'
    WHERE organization_id = NEW.organization_id
      AND appointment_id = NEW.id
      AND status IN ('pending', 'queued')
      AND (
        (kind = 'review_request' AND NEW.status <> 'completed')
        OR (kind = 'no_show_recovery' AND NEW.status <> 'no_show')
        OR (kind = 'unconfirmed_booking_recovery' AND NEW.status <> 'pending')
      )
    RETURNING notification_outbox_id
  )
  UPDATE notification_outbox
  SET status = 'cancelled',
      last_error = 'Cancelled because the appointment status changed.',
      next_attempt_at = NULL
  WHERE id IN (SELECT notification_outbox_id FROM stopped WHERE notification_outbox_id IS NOT NULL)
    AND status IN ('pending', 'processing', 'failed', 'not_configured');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_salon_stop_inapplicable_automations
  AFTER UPDATE OF status ON salon_appointments
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION salon_stop_inapplicable_automations();

CREATE OR REPLACE FUNCTION salon_attribute_recovery_conversion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_run_id UUID;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    SELECT id INTO v_run_id FROM salon_automation_runs
    WHERE organization_id = NEW.organization_id
      AND appointment_id = NEW.id
      AND kind = 'unconfirmed_booking_recovery'
      AND status = 'queued'
    ORDER BY queued_at DESC LIMIT 1;
  END IF;
  IF v_run_id IS NULL THEN
  SELECT id INTO v_run_id FROM salon_automation_runs
  WHERE organization_id = NEW.organization_id AND customer_id = NEW.customer_id
    AND kind IN ('no_show_recovery', 'unconfirmed_booking_recovery') AND status = 'queued'
    AND queued_at >= now() - interval '30 days'
  ORDER BY queued_at DESC LIMIT 1;
  END IF;
  IF v_run_id IS NOT NULL THEN
    UPDATE salon_automation_runs SET status = 'converted', converted_at = now(), converted_appointment_id = NEW.id
    WHERE id = v_run_id;
    PERFORM private.emit_business_event(NEW.organization_id, 'salon.recovery.converted', 'salon_automation_run',
      v_run_id::text, jsonb_build_object('appointment_id', NEW.id, 'customer_id', NEW.customer_id));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_salon_attribute_recovery_conversion AFTER INSERT ON salon_appointments
  FOR EACH ROW EXECUTE FUNCTION salon_attribute_recovery_conversion();
CREATE TRIGGER trg_salon_attribute_unconfirmed_conversion
  AFTER UPDATE OF status ON salon_appointments
  FOR EACH ROW WHEN (NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed')
  EXECUTE FUNCTION salon_attribute_recovery_conversion();

