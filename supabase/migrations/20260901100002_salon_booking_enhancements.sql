-- R GLOW Phase D — booking lifecycle + comms columns (Part A/C/public
-- booking enhancements). Additive columns only; existing rows get safe
-- defaults and existing callers of create_public_salon_booking keep working
-- because the new parameter is appended with a DEFAULT.

ALTER TABLE salon_appointments ADD COLUMN IF NOT EXISTS booking_number TEXT;
ALTER TABLE salon_appointments ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE salon_appointments ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_appointments_org_booking_number
  ON salon_appointments(organization_id, booking_number) WHERE booking_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_appointments_org_idempotency
  ON salon_appointments(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS salon_booking_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_salon_booking_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := 'RGLOW-BK-' || lpad(nextval('salon_booking_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_appointments_booking_number ON salon_appointments;
CREATE TRIGGER trg_salon_appointments_booking_number
  BEFORE INSERT ON salon_appointments
  FOR EACH ROW EXECUTE FUNCTION generate_salon_booking_number();

ALTER TABLE salon_services ADD COLUMN IF NOT EXISTS buffer_min INT NOT NULL DEFAULT 0;

ALTER TABLE salon_customers ADD COLUMN IF NOT EXISTS preferred_channel TEXT NOT NULL DEFAULT 'whatsapp'
  CHECK (preferred_channel IN ('whatsapp', 'sms', 'email', 'none'));
ALTER TABLE salon_customers ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- create_public_salon_booking — add idempotency support. A duplicate
-- double-submit with the same p_idempotency_key returns the existing
-- booking instead of erroring or double-booking. The new parameter is
-- appended with a DEFAULT so existing callers (without the param) still
-- compile/run unchanged.
-- ---------------------------------------------------------------------------

-- The previous 9-parameter signature is dropped first — CREATE OR REPLACE
-- cannot widen a parameter list in place; leaving the old overload around
-- would create two functions with duplicate behavior for old callers.
DROP FUNCTION IF EXISTS public.create_public_salon_booking(
  UUID, UUID, UUID, UUID[], TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.create_public_salon_booking(
  p_organization_id UUID,
  p_branch_id UUID,
  p_staff_id UUID,
  p_service_ids UUID[],
  p_starts_at TIMESTAMPTZ,
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_appointment_id UUID;
  v_total_duration INT := 0;
  v_service RECORD;
  v_ends_at TIMESTAMPTZ;
  v_existing RECORD;
  v_booking_number TEXT;
  v_customer_channel TEXT;
  v_customer_opted_out TIMESTAMPTZ;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, customer_id, starts_at, ends_at, booking_number INTO v_existing
    FROM salon_appointments
    WHERE organization_id = p_organization_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'appointment_id', v_existing.id,
        'customer_id', v_existing.customer_id,
        'starts_at', v_existing.starts_at,
        'ends_at', v_existing.ends_at,
        'booking_number', v_existing.booking_number,
        'idempotent_replay', true
      );
    END IF;
  END IF;

  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one service is required';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'Customer phone is required';
  END IF;

  PERFORM 1 FROM salon_branches WHERE id = p_branch_id AND organization_id = p_organization_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Branch not found';
  END IF;

  PERFORM 1 FROM salon_staff WHERE id = p_staff_id AND organization_id = p_organization_id AND branch_id = p_branch_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff member not found for this branch';
  END IF;

  SELECT coalesce(sum(duration_min + buffer_min), 0) INTO v_total_duration
  FROM salon_services
  WHERE id = ANY(p_service_ids) AND organization_id = p_organization_id AND is_active;

  IF v_total_duration <= 0 THEN
    RAISE EXCEPTION 'Selected services are invalid or inactive';
  END IF;

  v_ends_at := p_starts_at + (v_total_duration || ' minutes')::interval;

  INSERT INTO salon_customers (organization_id, phone, name, email)
  VALUES (p_organization_id, trim(p_customer_phone), p_customer_name, p_customer_email)
  ON CONFLICT (organization_id, phone) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, salon_customers.name),
    email = COALESCE(EXCLUDED.email, salon_customers.email),
    updated_at = now()
  RETURNING id INTO v_customer_id;

  BEGIN
    INSERT INTO salon_appointments (
      organization_id, branch_id, staff_id, customer_id, status, starts_at, ends_at, notes, idempotency_key
    ) VALUES (
      p_organization_id, p_branch_id, p_staff_id, v_customer_id, 'pending', p_starts_at, v_ends_at, p_notes, p_idempotency_key
    )
    RETURNING id, booking_number INTO v_appointment_id, v_booking_number;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'This slot was just booked by someone else. Please choose another time.';
  END;

  FOR v_service IN
    SELECT id, price, duration_min FROM salon_services
    WHERE id = ANY(p_service_ids) AND organization_id = p_organization_id AND is_active
  LOOP
    INSERT INTO salon_appointment_services (
      organization_id, appointment_id, service_id, price_at_booking, duration_min_at_booking
    ) VALUES (
      p_organization_id, v_appointment_id, v_service.id, v_service.price, v_service.duration_min
    );
  END LOOP;

  -- Queue a booking-confirmation message the same way
  -- `SalonNotificationService.enqueue()` (@rinads/salon-server) does for
  -- every other salon notification — this is the one path that runs as an
  -- anonymous public caller, so it writes to notification_outbox directly
  -- rather than through that TS service. Actual delivery still goes through
  -- the same notify-whatsapp edge function; see that service's docstring.
  SELECT preferred_channel, opted_out_at INTO v_customer_channel, v_customer_opted_out
  FROM salon_customers WHERE id = v_customer_id;

  IF v_customer_opted_out IS NULL AND coalesce(v_customer_channel, 'whatsapp') <> 'none' THEN
    INSERT INTO notification_outbox (
      organization_id, channel, template_key, recipient, payload, idempotency_key, status
    ) VALUES (
      p_organization_id,
      CASE v_customer_channel WHEN 'email' THEN 'email' WHEN 'sms' THEN 'sms' ELSE 'whatsapp' END,
      'salon.booking.created',
      p_customer_phone,
      jsonb_build_object('appointmentId', v_appointment_id, 'startsAt', p_starts_at, 'bookingNumber', v_booking_number),
      'salon.booking.created:' || v_appointment_id::text,
      'pending'
    )
    ON CONFLICT (organization_id, idempotency_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'appointment_id', v_appointment_id,
    'customer_id', v_customer_id,
    'starts_at', p_starts_at,
    'ends_at', v_ends_at,
    'booking_number', v_booking_number,
    'idempotent_replay', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_salon_booking(
  UUID, UUID, UUID, UUID[], TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_salon_booking(
  UUID, UUID, UUID, UUID[], TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;
