-- RINADS Agent Gateway: first externally callable capability flag.
-- Default remains OFF. This migration defines the flag only; it does not grant
-- any organization or user access.

insert into public.feature_flags (key, description, default_enabled)
values (
  'agent.commerce.catalog.read',
  'Allow an authenticated RINADS Agent Gateway principal to read the tenant-scoped published commerce catalog after canonical permission and RLS checks.',
  false
)
on conflict (key) do update
set
  description = excluded.description,
  default_enabled = false;
