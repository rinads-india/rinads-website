-- Business Cloud V2: shared Finance Core.
--
-- This is the accounting truth layer underneath Company OS / future RINPO CFO.
-- It does not claim statutory GST filing completeness. Existing cos_invoices,
-- cos_payments and cos_expenses remain operating records until explicit posting
-- adapters map them into this ledger.

insert into public.permissions (key, description)
values
  ('finance.write', 'Create and edit Finance Core drafts and master data'),
  ('finance.post', 'Post balanced Finance Core journal entries'),
  ('finance.period.manage', 'Open, lock and close Finance Core fiscal periods')
on conflict (key) do nothing;

create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_account_id uuid,
  currency text not null default 'INR',
  is_control boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, code),
  constraint finance_accounts_parent_same_org_fk
    foreign key (organization_id, parent_account_id)
    references public.finance_accounts(organization_id, id)
    deferrable initially immediate
);

create table if not exists public.finance_journals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  journal_type text not null default 'general'
    check (journal_type in ('general', 'sales', 'purchases', 'cash', 'bank', 'adjustment')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, code)
);

create table if not exists public.finance_fiscal_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('open', 'locked', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, name),
  check (ends_on >= starts_on)
);

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  journal_id uuid not null,
  period_id uuid,
  entry_number text not null,
  entry_date date not null default current_date,
  description text not null default '',
  currency text not null default 'INR',
  status text not null default 'draft' check (status in ('draft', 'posted', 'reversed')),
  source_type text,
  source_id text,
  idempotency_key text not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  posted_by uuid references auth.users(id) on delete set null,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, entry_number),
  unique (organization_id, idempotency_key),
  constraint finance_entries_journal_same_org_fk
    foreign key (organization_id, journal_id)
    references public.finance_journals(organization_id, id)
    deferrable initially immediate,
  constraint finance_entries_period_same_org_fk
    foreign key (organization_id, period_id)
    references public.finance_fiscal_periods(organization_id, id)
    deferrable initially immediate
);

create table if not exists public.finance_entry_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_id uuid not null,
  line_no integer not null check (line_no > 0),
  account_id uuid not null,
  description text not null default '',
  debit numeric(18, 2) not null default 0 check (debit >= 0),
  credit numeric(18, 2) not null default 0 check (credit >= 0),
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (entry_id, line_no),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0)),
  constraint finance_entry_lines_entry_same_org_fk
    foreign key (organization_id, entry_id)
    references public.finance_entries(organization_id, id)
    on delete cascade
    deferrable initially immediate,
  constraint finance_entry_lines_account_same_org_fk
    foreign key (organization_id, account_id)
    references public.finance_accounts(organization_id, id)
    deferrable initially immediate
);

create index if not exists finance_accounts_org_type_idx
  on public.finance_accounts(organization_id, account_type, is_active);
create index if not exists finance_entries_org_date_idx
  on public.finance_entries(organization_id, entry_date desc, status);
create index if not exists finance_entries_source_idx
  on public.finance_entries(organization_id, source_type, source_id)
  where source_type is not null and source_id is not null;
create index if not exists finance_entry_lines_org_account_idx
  on public.finance_entry_lines(organization_id, account_id);
create index if not exists finance_periods_org_dates_idx
  on public.finance_fiscal_periods(organization_id, starts_on, ends_on);

alter table public.finance_accounts enable row level security;
alter table public.finance_journals enable row level security;
alter table public.finance_fiscal_periods enable row level security;
alter table public.finance_entries enable row level security;
alter table public.finance_entry_lines enable row level security;

-- Read access is permission-bound because finance data should not be visible to
-- every organization member by default.
do $$
declare
  t text;
begin
  foreach t in array array[
    'finance_accounts', 'finance_journals', 'finance_fiscal_periods',
    'finance_entries', 'finance_entry_lines'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (' ||
      'private.has_permission(organization_id, ''finance.read'') or ' ||
      'private.has_permission(organization_id, ''finance.write'') or ' ||
      'private.has_permission(organization_id, ''finance.post'') or ' ||
      'private.has_permission(organization_id, ''finance.period.manage'') or ' ||
      'private.has_permission(organization_id, ''org.manage''))',
      t || '_select', t
    );
  end loop;
end $$;

create policy finance_accounts_insert on public.finance_accounts
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy finance_accounts_update on public.finance_accounts
  for update to authenticated
  using (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );

create policy finance_journals_insert on public.finance_journals
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy finance_journals_update on public.finance_journals
  for update to authenticated
  using (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );

create policy finance_periods_insert on public.finance_fiscal_periods
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'finance.period.manage')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy finance_periods_update on public.finance_fiscal_periods
  for update to authenticated
  using (
    private.has_permission(organization_id, 'finance.period.manage')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'finance.period.manage')
    or private.has_permission(organization_id, 'org.manage')
  );

create policy finance_entries_insert on public.finance_entries
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy finance_entries_update on public.finance_entries
  for update to authenticated
  using (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );

create policy finance_entry_lines_insert on public.finance_entry_lines
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy finance_entry_lines_update on public.finance_entry_lines
  for update to authenticated
  using (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'finance.write')
    or private.has_permission(organization_id, 'org.manage')
  );

-- Posted journal entries are immutable. Draft -> posted is only permitted from
-- finance_post_entry(), which sets a transaction-local guard after validating
-- balance and fiscal-period state.
create or replace function private.finance_guard_entry_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Posted Finance Core entries are immutable';
    end if;
    return old;
  end if;

  if old.status <> 'draft' then
    raise exception 'Posted Finance Core entries are immutable';
  end if;

  if new.status is distinct from old.status
     and coalesce(current_setting('rinads.finance_posting', true), '') <> 'on' then
    raise exception 'Use finance_post_entry() to change journal posting status';
  end if;

  return new;
end;
$$;

revoke all on function private.finance_guard_entry_mutation() from public;

drop trigger if exists finance_entries_mutation_guard on public.finance_entries;
create trigger finance_entries_mutation_guard
  before update or delete on public.finance_entries
  for each row execute function private.finance_guard_entry_mutation();

create or replace function private.finance_guard_line_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_org uuid;
  v_entry uuid;
  v_status text;
begin
  v_org := case when tg_op = 'DELETE' then old.organization_id else new.organization_id end;
  v_entry := case when tg_op = 'DELETE' then old.entry_id else new.entry_id end;

  select e.status into v_status
  from public.finance_entries e
  where e.organization_id = v_org and e.id = v_entry;

  if v_status is null then
    raise exception 'Finance entry not found for journal line';
  end if;
  if v_status <> 'draft' then
    raise exception 'Lines on posted Finance Core entries are immutable';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.finance_guard_line_mutation() from public;

drop trigger if exists finance_entry_lines_mutation_guard on public.finance_entry_lines;
create trigger finance_entry_lines_mutation_guard
  before insert or update or delete on public.finance_entry_lines
  for each row execute function private.finance_guard_line_mutation();

create or replace function public.finance_post_entry(
  p_organization_id uuid,
  p_entry_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.finance_entries%rowtype;
  v_line_count bigint;
  v_debit numeric(18,2);
  v_credit numeric(18,2);
  v_actor_type text;
  v_actor_id text;
begin
  if auth.role() = 'service_role' then
    v_actor_type := 'system';
    v_actor_id := null;
  else
    if not (
      private.has_permission(p_organization_id, 'finance.post')
      or private.has_permission(p_organization_id, 'org.manage')
    ) then
      raise exception 'Missing finance.post permission';
    end if;
    v_actor_type := 'user';
    v_actor_id := auth.uid()::text;
  end if;

  select * into v_entry
  from public.finance_entries e
  where e.organization_id = p_organization_id and e.id = p_entry_id
  for update;

  if not found then
    raise exception 'Finance entry not found';
  end if;
  if v_entry.status <> 'draft' then
    raise exception 'Only draft Finance Core entries can be posted';
  end if;

  if v_entry.period_id is not null and exists (
    select 1
    from public.finance_fiscal_periods p
    where p.organization_id = p_organization_id
      and p.id = v_entry.period_id
      and p.status <> 'open'
  ) then
    raise exception 'Finance entry belongs to a locked or closed fiscal period';
  end if;

  select count(*), coalesce(sum(l.debit), 0), coalesce(sum(l.credit), 0)
    into v_line_count, v_debit, v_credit
  from public.finance_entry_lines l
  where l.organization_id = p_organization_id and l.entry_id = p_entry_id;

  if v_line_count < 2 then
    raise exception 'A posted journal entry requires at least two lines';
  end if;
  if v_debit <= 0 or v_credit <= 0 or v_debit <> v_credit then
    raise exception 'Journal entry is not balanced';
  end if;

  perform set_config('rinads.finance_posting', 'on', true);

  update public.finance_entries
  set status = 'posted',
      posted_at = now(),
      posted_by = auth.uid(),
      updated_at = now()
  where organization_id = p_organization_id and id = p_entry_id;

  insert into public.audit_logs (
    organization_id, actor_type, actor_id, action, entity, entity_id, after, source
  ) values (
    p_organization_id,
    v_actor_type,
    v_actor_id,
    'finance.entry.posted',
    'finance_entry',
    p_entry_id::text,
    jsonb_build_object(
      'entry_number', v_entry.entry_number,
      'entry_date', v_entry.entry_date,
      'debit', v_debit,
      'credit', v_credit
    ),
    'finance'
  );

  insert into public.business_events (
    organization_id, event_type, entity_type, entity_id, payload,
    idempotency_key, source, actor_type, actor_id, schema_version
  ) values (
    p_organization_id,
    'finance.entry.posted',
    'finance_entry',
    p_entry_id::text,
    jsonb_build_object(
      'entry_number', v_entry.entry_number,
      'entry_date', v_entry.entry_date,
      'debit', v_debit,
      'credit', v_credit
    ),
    'finance.entry.posted:' || p_entry_id::text,
    'finance',
    v_actor_type,
    v_actor_id,
    'v1'
  )
  on conflict (organization_id, idempotency_key) do nothing;

  return p_entry_id;
end;
$$;

revoke all on function public.finance_post_entry(uuid, uuid) from public;
grant execute on function public.finance_post_entry(uuid, uuid) to authenticated, service_role;

comment on table public.finance_accounts is
  'Canonical Finance Core chart of accounts; not a replacement for tenant identity or vertical tables.';
comment on table public.finance_entries is
  'Double-entry journal headers. Posted rows are immutable and emit canonical audit/event evidence.';
comment on table public.finance_entry_lines is
  'Double-entry debit/credit lines. Posting requires equal non-zero debit and credit totals.';
comment on function public.finance_post_entry(uuid, uuid) is
  'Permission-gated atomic posting path for balanced Finance Core journal entries.';
