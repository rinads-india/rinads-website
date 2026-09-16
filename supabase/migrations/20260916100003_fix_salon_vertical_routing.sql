-- Repair salon organizations created while onboarding coerced salon-os to another template.
-- The UPDATE predicate and audit insert are coupled, making this migration idempotent.
WITH candidates AS MATERIALIZED (
  SELECT organization_id, vertical_key
  FROM public.organization_settings
  WHERE business_type = 'salon'
    AND vertical_key IS DISTINCT FROM 'salon-os'
),
repaired AS (
  UPDATE public.organization_settings AS settings
  SET vertical_key = 'salon-os',
      updated_at = now()
  FROM candidates
  WHERE settings.organization_id = candidates.organization_id
  RETURNING settings.organization_id
)
INSERT INTO public.audit_logs (
  organization_id,
  actor_type,
  actor_id,
  action,
  entity,
  entity_id,
  before,
  after,
  source
)
SELECT
  repaired.organization_id,
  'system',
  '20260916100003_fix_salon_vertical_routing',
  'organization.vertical_repaired',
  'organization_settings',
  repaired.organization_id::text,
  jsonb_build_object('vertical_key', candidates.vertical_key),
  jsonb_build_object('vertical_key', 'salon-os', 'business_type', 'salon'),
  'database-migration'
FROM repaired
JOIN candidates USING (organization_id);
