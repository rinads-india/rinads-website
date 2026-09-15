-- R GLOW Salon OS — public booking read RPCs (Production Hardening + Salon OS
-- Foundation, Part C). The base salon_branches/salon_services/salon_staff
-- tables are member-only (private.is_org_member), so the public booking
-- widget (apps/website/app/solutions/salon/book) needs SECURITY DEFINER
-- functions that expose exactly the columns needed to build a booking flow —
-- nothing more (no contact info, no working-hours internals beyond what's
-- needed to render a calendar, no cross-branch staff assignments).

-- ---------------------------------------------------------------------------
-- Resolve an organization by public slug, scoped to published salon-os
-- tenants only. Mirrors packages/domains' storefront-by-slug resolution but
-- exposes only id/name/slug of an active organization — the same disclosure
-- level as visiting a public storefront by slug.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_public_salon_organization(p_slug TEXT)
RETURNS TABLE (organization_id UUID, name TEXT, slug TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.slug
  FROM organizations o
  JOIN organization_settings s ON s.organization_id = o.id
  WHERE o.slug = lower(trim(p_slug))
    AND o.status = 'active'
    AND s.vertical_key = 'salon-os';
$$;

REVOKE ALL ON FUNCTION public.get_public_salon_organization(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_salon_organization(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_salon_branches(p_organization_id UUID)
RETURNS TABLE (id UUID, name TEXT, city TEXT, timezone TEXT, working_hours JSONB)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, city, timezone, working_hours
  FROM salon_branches
  WHERE organization_id = p_organization_id AND is_active
  ORDER BY name;
$$;

REVOKE ALL ON FUNCTION public.get_public_salon_branches(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_salon_branches(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_salon_services(p_organization_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  description TEXT,
  duration_min INT,
  price NUMERIC,
  currency TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, category, description, duration_min, price, currency
  FROM salon_services
  WHERE organization_id = p_organization_id AND is_active
  ORDER BY category, name;
$$;

REVOKE ALL ON FUNCTION public.get_public_salon_services(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_salon_services(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_salon_staff(p_organization_id UUID, p_branch_id UUID DEFAULT NULL)
RETURNS TABLE (id UUID, display_name TEXT, branch_id UUID, specialties TEXT[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, display_name, branch_id, specialties
  FROM salon_staff
  WHERE organization_id = p_organization_id
    AND is_active
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
  ORDER BY display_name;
$$;

REVOKE ALL ON FUNCTION public.get_public_salon_staff(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_salon_staff(UUID, UUID) TO anon, authenticated;

-- Which staff can perform a given service — needed so the booking widget
-- only offers staff eligible for the selected service(s).
CREATE OR REPLACE FUNCTION public.get_public_salon_staff_for_service(p_service_id UUID)
RETURNS TABLE (staff_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ss.staff_id
  FROM salon_service_staff ss
  JOIN salon_staff st ON st.id = ss.staff_id
  WHERE ss.service_id = p_service_id AND st.is_active;
$$;

REVOKE ALL ON FUNCTION public.get_public_salon_staff_for_service(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_salon_staff_for_service(UUID) TO anon, authenticated;
