-- R GLOW production-MVP safety:
--   * record affirmative marketing-consent provenance separately from
--     transactional booking communications;
--   * validate public phone/service input in Postgres as well as TypeScript;
--   * rate-limit anonymous booking attempts without storing client IP data.

ALTER TABLE salon_customers
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_consent_source TEXT;

CREATE TABLE IF NOT EXISTS salon_public_booking_rate_limits (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  identifier_hash TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, identifier_hash)
);

ALTER TABLE salon_public_booking_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE salon_public_booking_rate_limits FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.create_public_salon_booking(
  UUID, UUID, UUID, UUID[], TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT
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
  p_idempotency_key TEXT DEFAULT NULL,
  p_marketing_consent BOOLEAN DEFAULT false,
  p_rate_limit_key TEXT DEFAULT NULL
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
  v_active_service_count INT := 0;
  v_service RECORD;
  v_ends_at TIMESTAMPTZ;
  v_existing RECORD;
  v_booking_number TEXT;
  v_customer_channel TEXT;
  v_customer_opted_out TIMESTAMPTZ;
  v_normalized_phone TEXT;
  v_request_count INT;
  v_recent_phone_bookings INT;
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

  v_normalized_phone := trim(p_customer_phone);
  IF v_normalized_phone !~ '^\+?[0-9]{8,15}$' THEN
    RAISE EXCEPTION 'Enter a valid phone number with 8 to 15 digits';
  END IF;

  PERFORM 1
  FROM salon_branches
  WHERE id = p_branch_id AND organization_id = p_organization_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Branch not found';
  END IF;

  PERFORM 1
  FROM salon_staff
  WHERE id = p_staff_id
    AND organization_id = p_organization_id
    AND branch_id = p_branch_id
    AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff member not found for this branch';
  END IF;

  IF p_rate_limit_key IS NOT NULL AND length(p_rate_limit_key) >= 32 THEN
    INSERT INTO salon_public_booking_rate_limits (
      organization_id, identifier_hash, window_started_at, request_count, updated_at
    )
    VALUES (p_organization_id, p_rate_limit_key, now(), 1, now())
    ON CONFLICT (organization_id, identifier_hash) DO UPDATE SET
      window_started_at = CASE
        WHEN salon_public_booking_rate_limits.window_started_at < now() - interval '1 hour' THEN now()
        ELSE salon_public_booking_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN salon_public_booking_rate_limits.window_started_at < now() - interval '1 hour' THEN 1
        ELSE salon_public_booking_rate_limits.request_count + 1
      END,
      updated_at = now()
    RETURNING request_count INTO v_request_count;

    IF v_request_count > 20 THEN
      RAISE EXCEPTION 'Too many booking attempts. Please try again later.';
    END IF;
  END IF;

  SELECT count(*) INTO v_recent_phone_bookings
  FROM salon_appointments appointment
  JOIN salon_customers customer ON customer.id = appointment.customer_id
  WHERE appointment.organization_id = p_organization_id
    AND customer.phone = v_normalized_phone
    AND appointment.created_at >= now() - interval '1 hour';

  IF v_recent_phone_bookings >= 5 THEN
    RAISE EXCEPTION 'Too many recent bookings for this phone number. Please contact the salon.';
  END IF;

  SELECT count(*), coalesce(sum(duration_min + buffer_min), 0)
  INTO v_active_service_count, v_total_duration
  FROM salon_services
  WHERE id = ANY(p_service_ids)
    AND organization_id = p_organization_id
    AND is_active;

  IF v_active_service_count <> cardinality(p_service_ids) OR v_total_duration <= 0 THEN
    RAISE EXCEPTION 'Selected services are invalid, duplicated, or inactive';
  END IF;

  v_ends_at := p_starts_at + (v_total_duration || ' minutes')::interval;

  INSERT INTO salon_customers (
    organization_id,
    phone,
    name,
    email,
    marketing_consent,
    marketing_consent_at,
    marketing_consent_source
  )
  VALUES (
    p_organization_id,
    v_normalized_phone,
    p_customer_name,
    p_customer_email,
    coalesce(p_marketing_consent, false),
    CASE WHEN p_marketing_consent THEN now() ELSE NULL END,
    CASE WHEN p_marketing_consent THEN 'public_booking' ELSE NULL END
  )
  ON CONFLICT (organization_id, phone) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, salon_customers.name),
    email = COALESCE(EXCLUDED.email, salon_customers.email),
    marketing_consent = salon_customers.marketing_consent OR EXCLUDED.marketing_consent,
    marketing_consent_at = CASE
      WHEN NOT salon_customers.marketing_consent AND EXCLUDED.marketing_consent THEN EXCLUDED.marketing_consent_at
      ELSE salon_customers.marketing_consent_at
    END,
    marketing_consent_source = CASE
      WHEN NOT salon_customers.marketing_consent AND EXCLUDED.marketing_consent THEN EXCLUDED.marketing_consent_source
      ELSE salon_customers.marketing_consent_source
    END,
    updated_at = now()
  RETURNING id INTO v_customer_id;

  BEGIN
    INSERT INTO salon_appointments (
      organization_id, branch_id, staff_id, customer_id, status, starts_at, ends_at, notes, idempotency_key
    ) VALUES (
      p_organization_id,
      p_branch_id,
      p_staff_id,
      v_customer_id,
      'pending',
      p_starts_at,
      v_ends_at,
      p_notes,
      p_idempotency_key
    )
    RETURNING id, booking_number INTO v_appointment_id, v_booking_number;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'This slot was just booked by someone else. Please choose another time.';
  END;

  FOR v_service IN
    SELECT id, price, duration_min
    FROM salon_services
    WHERE id = ANY(p_service_ids)
      AND organization_id = p_organization_id
      AND is_active
  LOOP
    INSERT INTO salon_appointment_services (
      organization_id, appointment_id, service_id, price_at_booking, duration_min_at_booking
    ) VALUES (
      p_organization_id, v_appointment_id, v_service.id, v_service.price, v_service.duration_min
    );
  END LOOP;

  -- Booking confirmations are transactional. They honor explicit opt-out,
  -- but do not require marketing consent.
  SELECT preferred_channel, opted_out_at
  INTO v_customer_channel, v_customer_opted_out
  FROM salon_customers
  WHERE id = v_customer_id;

  IF v_customer_opted_out IS NULL AND coalesce(v_customer_channel, 'whatsapp') <> 'none' THEN
    INSERT INTO notification_outbox (
      organization_id, channel, template_key, recipient, payload, idempotency_key, status
    ) VALUES (
      p_organization_id,
      CASE v_customer_channel WHEN 'email' THEN 'email' WHEN 'sms' THEN 'sms' ELSE 'whatsapp' END,
      'salon.booking.created',
      v_normalized_phone,
      jsonb_build_object(
        'appointmentId', v_appointment_id,
        'startsAt', p_starts_at,
        'bookingNumber', v_booking_number
      ),
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
  UUID, UUID, UUID, UUID[], TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_salon_booking(
  UUID, UUID, UUID, UUID[], TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT
) TO anon, authenticated;
