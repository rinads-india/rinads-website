-- Business Cloud V2: tenant-scoped AI credit accounting.
-- Credits extend @rinads/billing. They are not a financial wallet and do not
-- represent cash, deposits, stored value, or statutory accounting balances.

create table if not exists public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_key text not null default 'rinads_credit',
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, unit_key)
);

create table if not exists public.credit_lots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.credit_accounts(id) on delete cascade,
  source text not null check (source in ('subscription', 'purchase', 'promotion', 'manual_adjustment', 'refund')),
  original_units bigint not null check (original_units > 0),
  remaining_units bigint not null check (remaining_units >= 0 and remaining_units <= original_units),
  external_reference text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint credit_lots_org_account_fk
    foreign key (organization_id, account_id)
    references public.credit_accounts(organization_id, id)
    deferrable initially immediate
);

create table if not exists public.credit_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  model text,
  operation text not null,
  quantity numeric,
  provider_cost_micros bigint check (provider_cost_micros is null or provider_cost_micros >= 0),
  billable_credits bigint not null check (billable_credits >= 0),
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.credit_accounts(id) on delete cascade,
  event_type text not null check (event_type in ('grant', 'purchase', 'consume', 'refund', 'expire', 'adjustment')),
  units bigint not null check (units <> 0),
  idempotency_key text not null,
  lot_id uuid references public.credit_lots(id) on delete set null,
  usage_event_id uuid references public.credit_usage_events(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  constraint credit_ledger_org_account_fk
    foreign key (organization_id, account_id)
    references public.credit_accounts(organization_id, id)
    deferrable initially immediate
);

create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.credit_accounts(id) on delete cascade,
  units bigint not null check (units > 0),
  status text not null default 'active' check (status in ('active', 'captured', 'released', 'expired')),
  idempotency_key text not null,
  purpose text,
  expires_at timestamptz not null,
  captured_ledger_id uuid references public.credit_ledger(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  constraint credit_reservations_org_account_fk
    foreign key (organization_id, account_id)
    references public.credit_accounts(organization_id, id)
    deferrable initially immediate
);

create index if not exists credit_ledger_org_account_time_idx
  on public.credit_ledger(organization_id, account_id, occurred_at desc);
create index if not exists credit_reservations_org_account_status_idx
  on public.credit_reservations(organization_id, account_id, status, expires_at);
create index if not exists credit_usage_events_org_time_idx
  on public.credit_usage_events(organization_id, occurred_at desc);
create index if not exists credit_lots_org_account_expiry_idx
  on public.credit_lots(organization_id, account_id, expires_at);

alter table public.credit_accounts enable row level security;
alter table public.credit_lots enable row level security;
alter table public.credit_usage_events enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.credit_reservations enable row level security;

-- Members may inspect customer-visible balance inputs. Mutations are
-- intentionally service-side only in this foundation slice so browser clients
-- cannot mint, consume, refund, or adjust credits directly.
create policy credit_accounts_member_select on public.credit_accounts
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy credit_lots_member_select on public.credit_lots
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy credit_ledger_member_select on public.credit_ledger
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy credit_reservations_member_select on public.credit_reservations
  for select to authenticated
  using (private.is_org_member(organization_id));

-- No authenticated SELECT policy is created for credit_usage_events because it
-- contains raw provider-cost evidence used for internal margin analytics.

-- Ledger rows are append-only. Corrections are compensating entries.
create or replace function private.prevent_credit_ledger_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'credit_ledger is append-only; write a compensating entry instead';
end;
$$;

revoke all on function private.prevent_credit_ledger_mutation() from public;

drop trigger if exists credit_ledger_immutable on public.credit_ledger;
create trigger credit_ledger_immutable
  before update or delete on public.credit_ledger
  for each row execute function private.prevent_credit_ledger_mutation();

comment on table public.credit_accounts is
  'Tenant AI/automation credit account. Credits are usage units, not money or stored value.';
comment on table public.credit_ledger is
  'Append-only signed credit ledger. Positive units grant value; negative units consume/expire/adjust.';
comment on table public.credit_reservations is
  'Temporary holds used to fail closed before expensive AI/media operations.';
comment on table public.credit_usage_events is
  'Internal provider/model operation usage and provider-cost evidence for billing and margin analytics.';
