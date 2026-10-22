-- RINADS Agent Gateway: tenant-owned commerce order read capability.
-- Default remains OFF. This migration only defines the flag; it grants no
-- organization or user access.

insert into public.feature_flags (key, description, default_enabled)
values (
  'agent.commerce.order.read',
  'Allow an authenticated RINADS Agent Gateway principal to read a tenant-owned order after canonical permission, entitlement, RLS and audit checks.',
  false
)
on conflict (key) do update
set
  description = excluded.description,
  default_enabled = false;
