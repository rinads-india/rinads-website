-- R GLOW Salon OS — production foundation (R GLOW Production Hardening + Salon OS
-- Foundation, Part C). Operational core needed to onboard one real salon and
-- take real bookings. All tables are organization_id-scoped with RLS,
-- mirroring the CORE identity patterns in 20260814100001_core_identity.sql.
--
-- Scope: branches, services, staff, customers, appointments. Explicitly
-- deferred (see plan): POS/checkout, reminders, loyalty, reporting,
-- inventory linkage, telephony/courier connectors.

CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ---------------------------------------------------------------------------
-- Branches
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  -- { "mon": {"open": "10:00", "close": "20:00"}, ... "sun": null }
  working_hours JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_branches_org ON salon_branches(organization_id) WHERE is_active;

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  duration_min INT NOT NULL CHECK (duration_min > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_services_org ON salon_services(organization_id) WHERE is_active;

-- ---------------------------------------------------------------------------
-- Staff — links to organization_members (auth identity + org role), plus
-- salon-specific branch assignment, specialties, and working hours.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES salon_branches(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  working_hours JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_staff_org ON salon_staff(organization_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_salon_staff_branch ON salon_staff(branch_id) WHERE is_active;

-- Which staff are eligible to perform which services (many-to-many).
CREATE TABLE IF NOT EXISTS salon_service_staff (
  service_id UUID NOT NULL REFERENCES salon_services(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES salon_staff(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_service_staff_org ON salon_service_staff(organization_id);

-- ---------------------------------------------------------------------------
-- Customers — phone-first identity, no auth account required.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  notes TEXT,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_salon_customers_org ON salon_customers(organization_id);

-- ---------------------------------------------------------------------------
-- Appointments — booking + status lifecycle. Conflict-safe slot reservation
-- via an EXCLUDE constraint on (staff_id, time range) so the same staff
-- member can never be double-booked for overlapping, non-cancelled slots.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salon_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES salon_branches(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES salon_staff(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES salon_customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show'
  )),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled', 'no_show'))
);

CREATE INDEX IF NOT EXISTS idx_salon_appointments_org ON salon_appointments(organization_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_salon_appointments_branch ON salon_appointments(branch_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_salon_appointments_staff ON salon_appointments(staff_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_salon_appointments_customer ON salon_appointments(customer_id);

CREATE OR REPLACE FUNCTION salon_appointments_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_appointments_updated_at ON salon_appointments;
CREATE TRIGGER trg_salon_appointments_updated_at
  BEFORE UPDATE ON salon_appointments
  FOR EACH ROW EXECUTE FUNCTION salon_appointments_set_updated_at();

-- Services booked within an appointment (one appointment may bundle several).
-- organization_id is denormalized here (as with product_media/service_orders
-- patterns elsewhere in this schema) to keep RLS simple and fast.
CREATE TABLE IF NOT EXISTS salon_appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES salon_appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES salon_services(id),
  price_at_booking NUMERIC(12,2) NOT NULL,
  duration_min_at_booking INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_appointment_services_appt ON salon_appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_salon_appointment_services_org ON salon_appointment_services(organization_id);

-- ---------------------------------------------------------------------------
-- Helper: is the caller salon staff assigned to this branch?
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.is_salon_staff_for_branch(p_branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM salon_staff st
    JOIN organization_members m ON m.id = st.member_id
    WHERE st.branch_id = p_branch_id
      AND st.is_active
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION private.is_salon_staff_for_branch(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_salon_staff_for_branch(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE salon_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_appointment_services ENABLE ROW LEVEL SECURITY;

-- Branches: any org member can read; only org.manage can write.
CREATE POLICY salon_branches_select_member ON salon_branches
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_branches_manage ON salon_branches
  FOR ALL TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

-- Services: any org member can read (booking flow, staff app); only
-- org.manage can write.
CREATE POLICY salon_services_select_member ON salon_services
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_services_manage ON salon_services
  FOR ALL TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

CREATE POLICY salon_service_staff_select_member ON salon_service_staff
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_service_staff_manage ON salon_service_staff
  FOR ALL TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

-- Staff directory: any org member can read; only org.manage can write.
CREATE POLICY salon_staff_select_member ON salon_staff
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_staff_manage ON salon_staff
  FOR ALL TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

-- Customers: org members can read/create (front-desk booking); only
-- org.manage can update/delete customer records.
CREATE POLICY salon_customers_select_member ON salon_customers
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY salon_customers_insert_member ON salon_customers
  FOR INSERT TO authenticated
  WITH CHECK (private.is_org_member(organization_id));

CREATE POLICY salon_customers_manage ON salon_customers
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

-- Appointments: org.manage sees/manages everything in the org; staff see and
-- manage only their assigned branch's appointments (per acceptance
-- criteria — "staff can log in and see only their branch's calendar").
CREATE POLICY salon_appointments_select_scoped ON salon_appointments
  FOR SELECT TO authenticated
  USING (
    private.has_permission(organization_id, 'org.manage')
    OR private.is_salon_staff_for_branch(branch_id)
  );

CREATE POLICY salon_appointments_insert_scoped ON salon_appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_org_member(organization_id)
    AND (
      private.has_permission(organization_id, 'org.manage')
      OR private.is_salon_staff_for_branch(branch_id)
    )
  );

CREATE POLICY salon_appointments_update_scoped ON salon_appointments
  FOR UPDATE TO authenticated
  USING (
    private.has_permission(organization_id, 'org.manage')
    OR private.is_salon_staff_for_branch(branch_id)
  )
  WITH CHECK (
    private.has_permission(organization_id, 'org.manage')
    OR private.is_salon_staff_for_branch(branch_id)
  );

-- No authenticated DELETE policy — appointments are cancelled via status,
-- never hard-deleted, to preserve the booking history/audit trail.

CREATE POLICY salon_appointment_services_select_scoped ON salon_appointment_services
  FOR SELECT TO authenticated
  USING (
    private.has_permission(organization_id, 'org.manage')
    OR EXISTS (
      SELECT 1 FROM salon_appointments a
      WHERE a.id = salon_appointment_services.appointment_id
        AND private.is_salon_staff_for_branch(a.branch_id)
    )
  );

CREATE POLICY salon_appointment_services_insert_scoped ON salon_appointment_services
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_org_member(organization_id)
    AND (
      private.has_permission(organization_id, 'org.manage')
      OR EXISTS (
        SELECT 1 FROM salon_appointments a
        WHERE a.id = salon_appointment_services.appointment_id
          AND private.is_salon_staff_for_branch(a.branch_id)
      )
    )
  );

CREATE POLICY salon_appointment_services_manage ON salon_appointment_services
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

CREATE POLICY salon_appointment_services_delete ON salon_appointment_services
  FOR DELETE TO authenticated
  USING (
    private.has_permission(organization_id, 'org.manage')
    OR EXISTS (
      SELECT 1 FROM salon_appointments a
      WHERE a.id = salon_appointment_services.appointment_id
        AND private.is_salon_staff_for_branch(a.branch_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Public booking RPC — anonymous visitors never get direct table access.
-- Runs as SECURITY DEFINER so it can insert a customer + appointment behind
-- RLS, while still enforcing the same double-booking guard via the
-- appointment table's EXCLUDE constraint (a conflicting insert raises and
-- the function surfaces a clean error instead of a raw constraint message).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_public_salon_booking(
  p_organization_id UUID,
  p_branch_id UUID,
  p_staff_id UUID,
  p_service_ids UUID[],
  p_starts_at TIMESTAMPTZ,
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
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
BEGIN
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

  SELECT coalesce(sum(duration_min), 0) INTO v_total_duration
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
      organization_id, branch_id, staff_id, customer_id, status, starts_at, ends_at, notes
    ) VALUES (
      p_organization_id, p_branch_id, p_staff_id, v_customer_id, 'pending', p_starts_at, v_ends_at, p_notes
    )
    RETURNING id INTO v_appointment_id;
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

  RETURN jsonb_build_object(
    'appointment_id', v_appointment_id,
    'customer_id', v_customer_id,
    'starts_at', p_starts_at,
    'ends_at', v_ends_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_salon_booking(
  UUID, UUID, UUID, UUID[], TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_salon_booking(
  UUID, UUID, UUID, UUID[], TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public read RPC — available slots for a given staff member/day, without
-- exposing customer PII or granting direct table SELECT to anonymous users.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_public_salon_busy_slots(
  p_organization_id UUID,
  p_staff_id UUID,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.starts_at, a.ends_at
  FROM salon_appointments a
  WHERE a.organization_id = p_organization_id
    AND a.staff_id = p_staff_id
    AND a.status NOT IN ('cancelled', 'no_show')
    AND a.starts_at < p_to
    AND a.ends_at > p_from;
$$;

REVOKE ALL ON FUNCTION public.get_public_salon_busy_slots(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_salon_busy_slots(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
