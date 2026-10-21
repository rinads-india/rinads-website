-- Business Cloud V2: India Compliance evidence foundation.
--
-- This migration records the evidence needed for GST-aware accounting and
-- future validated provider integrations. It does NOT implement GST return
-- filing, IRN generation, e-way-bill submission, or statutory advice.

insert into public.permissions (key, description)
values
  ('compliance.india.read', 'Read India compliance registrations, tax classifications and transaction evidence'),
  ('compliance.india.manage', 'Manage India compliance registrations/classifications and record tax evidence')
on conflict (key) do nothing;

create table if not exists public.india_gst_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid,
  gstin text not null,
  legal_name text not null,
  trade_name text,
  state_code text not null,
  registration_type text not null default 'regular'
    check (registration_type in ('regular', 'composition', 'casual', 'non_resident', 'other')),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'cancelled')),
  effective_from date,
  cancelled_on date,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, gstin),
  check (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  check (state_code ~ '^[0-9]{2}$' and state_code <> '00'),
  check (left(gstin, 2) = state_code),
  constraint india_gst_registration_location_same_org_fk
    foreign key (location_id, organization_id)
    references public.locations(id, organization_id)
    on delete set null
    deferrable initially immediate
);

create unique index if not exists india_gst_one_primary_per_org_idx
  on public.india_gst_registrations(organization_id)
  where is_primary = true and status = 'active';

create table if not exists public.india_tax_classifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code_kind text not null check (code_kind in ('hsn', 'sac')),
  code text not null,
  description text not null default '',
  default_rate_bps integer check (default_rate_bps is null or default_rate_bps between 0 and 100000),
  default_treatment text not null default 'taxable'
    check (default_treatment in ('taxable', 'exempt', 'nil_rated', 'zero_rated', 'non_gst')),
  reverse_charge_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, code_kind, code),
  check (
    (code_kind = 'hsn' and code ~ '^[0-9]{4,8}$')
    or (code_kind = 'sac' and code ~ '^[0-9]{4,6}$')
  )
);

create table if not exists public.india_tax_transaction_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  registration_id uuid,
  finance_entry_id uuid,
  source_type text not null,
  source_id text not null,
  source_line_key text,
  idempotency_key text not null,
  document_number text,
  document_date date,
  supplier_gstin text,
  recipient_gstin text,
  supplier_state_code text,
  place_of_supply_state_code text,
  supply_type text not null default 'unknown'
    check (supply_type in ('intrastate', 'interstate', 'export', 'sez', 'deemed_export', 'unknown')),
  tax_treatment text not null default 'taxable'
    check (tax_treatment in ('taxable', 'exempt', 'nil_rated', 'zero_rated', 'non_gst')),
  tax_code_kind text check (tax_code_kind is null or tax_code_kind in ('hsn', 'sac')),
  tax_code text,
  rate_bps integer check (rate_bps is null or rate_bps between 0 and 100000),
  currency text not null default 'INR',
  taxable_minor bigint not null default 0 check (taxable_minor >= 0),
  tax_amount_minor bigint not null default 0 check (tax_amount_minor >= 0),
  cgst_minor bigint not null default 0 check (cgst_minor >= 0),
  sgst_minor bigint not null default 0 check (sgst_minor >= 0),
  igst_minor bigint not null default 0 check (igst_minor >= 0),
  cess_minor bigint not null default 0 check (cess_minor >= 0),
  allocation_status text not null default 'pending'
    check (allocation_status in ('pending', 'complete')),
  reverse_charge boolean not null default false,
  evidence_version text not null default 'v1',
  metadata jsonb not null default '{}'::jsonb,
  recorded_by uuid references auth.users(id) on delete set null default auth.uid(),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  constraint india_tax_evidence_registration_same_org_fk
    foreign key (registration_id, organization_id)
    references public.india_gst_registrations(id, organization_id)
    deferrable initially immediate,
  constraint india_tax_evidence_finance_entry_same_org_fk
    foreign key (finance_entry_id, organization_id)
    references public.finance_entries(id, organization_id)
    deferrable initially immediate,
  check (supplier_state_code is null or (supplier_state_code ~ '^[0-9]{2}$' and supplier_state_code <> '00')),
  check (place_of_supply_state_code is null or (place_of_supply_state_code ~ '^[0-9]{2}$' and place_of_supply_state_code <> '00')),
  check (supplier_gstin is null or supplier_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  check (recipient_gstin is null or recipient_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  check (
    tax_code is null
    or (tax_code_kind = 'hsn' and tax_code ~ '^[0-9]{4,8}$')
    or (tax_code_kind = 'sac' and tax_code ~ '^[0-9]{4,6}$')
  ),
  check (
    allocation_status = 'pending'
    or tax_amount_minor = cgst_minor + sgst_minor + igst_minor + cess_minor
  ),
  check (
    supply_type <> 'intrastate'
    or allocation_status = 'pending'
    or igst_minor = 0
  ),
  check (
    supply_type <> 'interstate'
    or allocation_status = 'pending'
    or (cgst_minor = 0 and sgst_minor = 0)
  )
);

create index if not exists india_gst_registrations_org_status_idx
  on public.india_gst_registrations(organization_id, status);
create index if not exists india_tax_classifications_org_active_idx
  on public.india_tax_classifications(organization_id, is_active, code_kind);
create index if not exists india_tax_evidence_org_document_idx
  on public.india_tax_transaction_evidence(organization_id, document_date desc, document_number);
create index if not exists india_tax_evidence_org_source_idx
  on public.india_tax_transaction_evidence(organization_id, source_type, source_id);
create index if not exists india_tax_evidence_finance_entry_idx
  on public.india_tax_transaction_evidence(organization_id, finance_entry_id)
  where finance_entry_id is not null;

alter table public.india_gst_registrations enable row level security;
alter table public.india_tax_classifications enable row level security;
alter table public.india_tax_transaction_evidence enable row level security;

-- Finance readers may inspect tax evidence because it is part of transaction
-- provenance; compliance permissions provide a narrower dedicated surface.
do $$
declare
  t text;
begin
  foreach t in array array[
    'india_gst_registrations',
    'india_tax_classifications',
    'india_tax_transaction_evidence'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (' ||
      'private.has_permission(organization_id, ''compliance.india.read'') or ' ||
      'private.has_permission(organization_id, ''compliance.india.manage'') or ' ||
      'private.has_permission(organization_id, ''finance.read'') or ' ||
      'private.has_permission(organization_id, ''finance.write'') or ' ||
      'private.has_permission(organization_id, ''finance.post'') or ' ||
      'private.has_permission(organization_id, ''org.manage''))',
      t || '_select', t
    );
  end loop;
end $$;

create policy india_gst_registrations_insert on public.india_gst_registrations
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'compliance.india.manage')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy india_gst_registrations_update on public.india_gst_registrations
  for update to authenticated
  using (
    private.has_permission(organization_id, 'compliance.india.manage')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'compliance.india.manage')
    or private.has_permission(organization_id, 'org.manage')
  );

create policy india_tax_classifications_insert on public.india_tax_classifications
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'compliance.india.manage')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy india_tax_classifications_update on public.india_tax_classifications
  for update to authenticated
  using (
    private.has_permission(organization_id, 'compliance.india.manage')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'compliance.india.manage')
    or private.has_permission(organization_id, 'org.manage')
  );

-- Evidence is insert-only for authenticated users. Corrections use a new
-- evidence row/version so the original basis remains auditable.
create policy india_tax_evidence_insert on public.india_tax_transaction_evidence
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'compliance.india.manage')
    or private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );

create or replace function private.prevent_india_tax_evidence_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'India tax transaction evidence is append-only; record corrected evidence instead';
end;
$$;

revoke all on function private.prevent_india_tax_evidence_mutation() from public;

drop trigger if exists india_tax_evidence_immutable on public.india_tax_transaction_evidence;
create trigger india_tax_evidence_immutable
  before update or delete on public.india_tax_transaction_evidence
  for each row execute function private.prevent_india_tax_evidence_mutation();

comment on table public.india_gst_registrations is
  'Organization GST registration evidence; storage is not external GST portal verification.';
comment on table public.india_tax_classifications is
  'Tenant tax classification configuration. Rates/treatments require validated policy; code shape alone is not legal classification.';
comment on table public.india_tax_transaction_evidence is
  'Append-only GST-relevant transaction evidence for accounting, reconciliation and future validated filing adapters.';
