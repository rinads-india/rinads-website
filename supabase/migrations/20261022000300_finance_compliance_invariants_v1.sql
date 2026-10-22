-- Finance + India Compliance hardening.
--
-- Additive only: this migration does not rewrite existing Finance Core or GST
-- evidence rows. It closes three correctness gaps before wider production use:
-- 1) finance entries linked to a fiscal period must fall inside that period;
-- 2) GST evidence corrections form an explicit append-only supersession chain;
-- 3) stored GST-registration lifecycle state is separated from external
--    verification state.

-- ---------------------------------------------------------------------------
-- Finance Core: a period reference is only valid when entry_date is inside it.
-- ---------------------------------------------------------------------------
create or replace function private.finance_validate_period_date()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_starts_on date;
  v_ends_on date;
begin
  if new.period_id is null then
    return new;
  end if;

  select p.starts_on, p.ends_on
    into v_starts_on, v_ends_on
  from public.finance_fiscal_periods p
  where p.organization_id = new.organization_id
    and p.id = new.period_id;

  if not found then
    raise exception 'Finance fiscal period not found for organization';
  end if;

  if new.entry_date < v_starts_on or new.entry_date > v_ends_on then
    raise exception 'Finance entry date % is outside fiscal period % to %',
      new.entry_date, v_starts_on, v_ends_on;
  end if;

  return new;
end;
$$;

revoke all on function private.finance_validate_period_date() from public;

drop trigger if exists finance_entries_period_date_guard on public.finance_entries;
create trigger finance_entries_period_date_guard
  before insert or update of organization_id, period_id, entry_date
  on public.finance_entries
  for each row execute function private.finance_validate_period_date();

comment on function private.finance_validate_period_date() is
  'Rejects Finance Core entries whose entry_date falls outside their selected fiscal period.';

-- ---------------------------------------------------------------------------
-- India Compliance: distinguish stored registration lifecycle from verification.
-- ---------------------------------------------------------------------------
alter table public.india_gst_registrations
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists verified_at timestamptz,
  add column if not exists verification_source text,
  add column if not exists verification_reference text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'india_gst_registration_verification_status_check'
      and conrelid = 'public.india_gst_registrations'::regclass
  ) then
    alter table public.india_gst_registrations
      add constraint india_gst_registration_verification_status_check
      check (verification_status in ('unverified', 'pending', 'verified', 'failed', 'stale'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'india_gst_registration_verified_at_check'
      and conrelid = 'public.india_gst_registrations'::regclass
  ) then
    alter table public.india_gst_registrations
      add constraint india_gst_registration_verified_at_check
      check (verification_status <> 'verified' or verified_at is not null);
  end if;
end $$;

comment on column public.india_gst_registrations.verification_status is
  'External verification state. The existing status column remains the stored registration lifecycle and must not imply GST-portal verification.';

-- ---------------------------------------------------------------------------
-- India Compliance: append-only corrections with a deterministic lineage.
-- ---------------------------------------------------------------------------
alter table public.india_tax_transaction_evidence
  add column if not exists supersedes_evidence_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'india_tax_evidence_supersedes_same_org_fk'
      and conrelid = 'public.india_tax_transaction_evidence'::regclass
  ) then
    alter table public.india_tax_transaction_evidence
      add constraint india_tax_evidence_supersedes_same_org_fk
      foreign key (organization_id, supersedes_evidence_id)
      references public.india_tax_transaction_evidence(organization_id, id)
      deferrable initially immediate;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'india_tax_evidence_not_self_supersession'
      and conrelid = 'public.india_tax_transaction_evidence'::regclass
  ) then
    alter table public.india_tax_transaction_evidence
      add constraint india_tax_evidence_not_self_supersession
      check (supersedes_evidence_id is null or supersedes_evidence_id <> id);
  end if;
end $$;

-- A prior evidence row can have only one direct successor. This keeps the
-- append-only correction history linear instead of allowing ambiguous branches.
create unique index if not exists india_tax_evidence_one_successor_idx
  on public.india_tax_transaction_evidence(organization_id, supersedes_evidence_id)
  where supersedes_evidence_id is not null;

create or replace function private.validate_india_tax_evidence_supersession()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_source_type text;
  v_source_id text;
  v_source_line_key text;
begin
  if new.supersedes_evidence_id is null then
    return new;
  end if;

  select e.source_type, e.source_id, e.source_line_key
    into v_source_type, v_source_id, v_source_line_key
  from public.india_tax_transaction_evidence e
  where e.organization_id = new.organization_id
    and e.id = new.supersedes_evidence_id;

  if not found then
    raise exception 'Superseded India tax evidence was not found in this organization';
  end if;

  if v_source_type is distinct from new.source_type
     or v_source_id is distinct from new.source_id
     or v_source_line_key is distinct from new.source_line_key then
    raise exception 'Corrected India tax evidence must preserve source identity';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_india_tax_evidence_supersession() from public;

drop trigger if exists india_tax_evidence_supersession_guard
  on public.india_tax_transaction_evidence;
create trigger india_tax_evidence_supersession_guard
  before insert on public.india_tax_transaction_evidence
  for each row execute function private.validate_india_tax_evidence_supersession();

comment on column public.india_tax_transaction_evidence.supersedes_evidence_id is
  'Optional prior evidence row corrected by this append-only version. Source identity must remain unchanged.';
