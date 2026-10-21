-- Business Cloud V2: explicit Data API / function privilege hardening.
--
-- Supabase project defaults differ. Do not rely on implicit grants: public
-- tables/functions in these new domains receive only the privileges required by
-- their RLS/function contracts. RLS remains the row-level authorization layer.

-- ---------------------------------------------------------------------------
-- AI Credits
-- ---------------------------------------------------------------------------

revoke all on table public.credit_accounts from anon;
revoke all on table public.credit_lots from anon;
revoke all on table public.credit_ledger from anon;
revoke all on table public.credit_reservations from anon;
revoke all on table public.credit_usage_events from anon;

revoke insert, update, delete, truncate, references, trigger
  on table public.credit_accounts,
           public.credit_lots,
           public.credit_ledger,
           public.credit_reservations
  from authenticated;
grant select
  on table public.credit_accounts,
           public.credit_lots,
           public.credit_ledger,
           public.credit_reservations
  to authenticated;

revoke all on table public.credit_usage_events from authenticated;

grant all
  on table public.credit_accounts,
           public.credit_lots,
           public.credit_ledger,
           public.credit_reservations,
           public.credit_usage_events
  to service_role;

revoke execute on function public.credit_reserve_units(uuid, bigint, text, timestamptz, text)
  from public, anon, authenticated, service_role;
revoke execute on function public.credit_release_reservation(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.credit_capture_reservation(uuid, uuid, bigint, text, text, text, text, numeric, bigint, jsonb)
  from public, anon, authenticated, service_role;

grant execute on function public.credit_reserve_units(uuid, bigint, text, timestamptz, text)
  to service_role;
grant execute on function public.credit_release_reservation(uuid, uuid)
  to service_role;
grant execute on function public.credit_capture_reservation(uuid, uuid, bigint, text, text, text, text, numeric, bigint, jsonb)
  to service_role;

-- ---------------------------------------------------------------------------
-- Finance Core
-- ---------------------------------------------------------------------------

revoke all
  on table public.finance_accounts,
           public.finance_journals,
           public.finance_fiscal_periods,
           public.finance_entries,
           public.finance_entry_lines
  from anon;

revoke delete, truncate, references, trigger
  on table public.finance_accounts,
           public.finance_journals,
           public.finance_fiscal_periods,
           public.finance_entries,
           public.finance_entry_lines
  from authenticated;

grant select, insert, update
  on table public.finance_accounts,
           public.finance_journals,
           public.finance_fiscal_periods,
           public.finance_entries,
           public.finance_entry_lines
  to authenticated;

grant all
  on table public.finance_accounts,
           public.finance_journals,
           public.finance_fiscal_periods,
           public.finance_entries,
           public.finance_entry_lines
  to service_role;

-- SECURITY DEFINER is intentional here because posting atomically mutates the
-- protected journal and writes audit/event evidence after an internal
-- finance.post/org.manage authorization check. Clear every inherited/direct
-- execute grant first, then expose only to signed-in users and service workers.
revoke execute on function public.finance_post_entry(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.finance_post_entry(uuid, uuid)
  to authenticated, service_role;

-- Trigger helpers are not public RPCs.
revoke execute on function private.finance_guard_entry_mutation()
  from public, anon, authenticated;
revoke execute on function private.finance_guard_line_mutation()
  from public, anon, authenticated;
revoke execute on function private.prevent_credit_ledger_mutation()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- India Compliance
-- ---------------------------------------------------------------------------

revoke all
  on table public.india_gst_registrations,
           public.india_tax_classifications,
           public.india_tax_transaction_evidence
  from anon;

revoke delete, truncate, references, trigger
  on table public.india_gst_registrations,
           public.india_tax_classifications,
           public.india_tax_transaction_evidence
  from authenticated;

grant select, insert, update
  on table public.india_gst_registrations,
           public.india_tax_classifications
  to authenticated;

grant select, insert
  on table public.india_tax_transaction_evidence
  to authenticated;
revoke update on table public.india_tax_transaction_evidence from authenticated;

grant all
  on table public.india_gst_registrations,
           public.india_tax_classifications,
           public.india_tax_transaction_evidence
  to service_role;

revoke execute on function private.prevent_india_tax_evidence_mutation()
  from public, anon, authenticated;

comment on function public.finance_post_entry(uuid, uuid) is
  'Intentional SECURITY DEFINER RPC. EXECUTE is restricted to authenticated/service_role; authenticated callers are checked for finance.post or org.manage inside the function.';
