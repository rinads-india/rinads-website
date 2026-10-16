-- RINADS Company OS foundation: operator flag + business graph domains.
-- Every row is tenant-scoped via organization_id + private.is_org_member RLS.

-- ---------------------------------------------------------------------------
-- Operator tenant flag
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists is_platform_operator boolean not null default false;

comment on column public.organizations.is_platform_operator is
  'When true, /os renders Company OS shell for this organization (RINADS Technologies operator).';

create index if not exists organizations_platform_operator_idx
  on public.organizations (is_platform_operator)
  where is_platform_operator = true;

-- ---------------------------------------------------------------------------
-- Departments + workers (human / bot / agent / contractor / system)
-- ---------------------------------------------------------------------------
create table if not exists public.cos_departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key text not null,
  name text not null,
  head_user_id uuid references auth.users (id) on delete set null,
  objectives text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

create table if not exists public.cos_workers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('human', 'bot', 'agent', 'contractor', 'system')),
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  department_id uuid references public.cos_departments (id) on delete set null,
  role_title text not null default '',
  skills text[] not null default '{}',
  availability_status text not null default 'available'
    check (availability_status in ('available', 'busy', 'away', 'offline')),
  cost_per_hour numeric(12, 2),
  available_hours_week numeric(8, 2) not null default 40,
  committed_hours_week numeric(8, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cos_workers_org_idx on public.cos_workers (organization_id);
create index if not exists cos_workers_user_idx on public.cos_workers (user_id);

create table if not exists public.cos_capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  worker_id uuid not null references public.cos_workers (id) on delete cascade,
  as_of date not null default current_date,
  available_hours numeric(8, 2) not null default 0,
  committed_hours numeric(8, 2) not null default 0,
  blocked_hours numeric(8, 2) not null default 0,
  utilization numeric(5, 2) not null default 0,
  risk text not null default 'normal' check (risk in ('low', 'normal', 'high', 'critical')),
  created_at timestamptz not null default now(),
  unique (worker_id, as_of)
);

-- ---------------------------------------------------------------------------
-- CRM graph: companies → contacts → leads → opportunities → proposals → contracts → clients
-- ---------------------------------------------------------------------------
create table if not exists public.cos_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  industry text,
  website text,
  lifecycle_stage text not null default 'lead'
    check (lifecycle_stage in (
      'lead', 'qualified', 'opportunity', 'client', 'churned', 'partner'
    )),
  health_score numeric(5, 2),
  health_notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cos_companies_org_idx on public.cos_companies (organization_id);

create table if not exists public.cos_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.cos_companies (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  title text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cos_contacts_org_idx on public.cos_contacts (organization_id);
create index if not exists cos_contacts_company_idx on public.cos_contacts (company_id);

create table if not exists public.cos_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.cos_companies (id) on delete set null,
  contact_id uuid references public.cos_contacts (id) on delete set null,
  title text not null,
  source text not null default 'manual',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'disqualified', 'converted')),
  owner_worker_id uuid references public.cos_workers (id) on delete set null,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'critical')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cos_leads_org_idx on public.cos_leads (organization_id);

create table if not exists public.cos_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.cos_companies (id) on delete set null,
  lead_id uuid references public.cos_leads (id) on delete set null,
  title text not null,
  stage text not null default 'discover'
    check (stage in (
      'discover', 'qualify', 'discovery', 'solution', 'proposal',
      'negotiation', 'contract', 'won', 'lost'
    )),
  amount numeric(14, 2),
  currency text not null default 'INR',
  probability numeric(5, 2) not null default 0,
  owner_worker_id uuid references public.cos_workers (id) on delete set null,
  expected_close_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cos_opportunities_org_idx on public.cos_opportunities (organization_id);

create table if not exists public.cos_proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  opportunity_id uuid references public.cos_opportunities (id) on delete cascade,
  company_id uuid references public.cos_companies (id) on delete set null,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  amount numeric(14, 2),
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cos_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.cos_companies (id) on delete set null,
  opportunity_id uuid references public.cos_opportunities (id) on delete set null,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'signed', 'active', 'completed', 'cancelled')),
  value numeric(14, 2),
  currency text not null default 'INR',
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Work graph: projects → milestones → tasks → deliverables
-- ---------------------------------------------------------------------------
create table if not exists public.cos_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.cos_companies (id) on delete set null,
  name text not null,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'on_hold', 'at_risk', 'completed', 'cancelled')),
  health text not null default 'on_track'
    check (health in ('on_track', 'warning', 'critical')),
  owner_worker_id uuid references public.cos_workers (id) on delete set null,
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cos_projects_org_idx on public.cos_projects (organization_id);

create table if not exists public.cos_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.cos_projects (id) on delete cascade,
  name text not null,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'missed')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cos_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.cos_projects (id) on delete set null,
  milestone_id uuid references public.cos_milestones (id) on delete set null,
  company_id uuid references public.cos_companies (id) on delete set null,
  title text not null,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'waiting', 'review', 'done', 'cancelled')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  assignee_worker_id uuid references public.cos_workers (id) on delete set null,
  estimate_hours numeric(8, 2),
  actual_hours numeric(8, 2),
  due_at timestamptz,
  ai_involved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cos_tasks_org_idx on public.cos_tasks (organization_id);
create index if not exists cos_tasks_assignee_idx on public.cos_tasks (assignee_worker_id);
create index if not exists cos_tasks_status_idx on public.cos_tasks (organization_id, status);

create table if not exists public.cos_deliverables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.cos_projects (id) on delete set null,
  task_id uuid references public.cos_tasks (id) on delete set null,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Finance operating layer (not statutory accounting)
-- ---------------------------------------------------------------------------
create table if not exists public.cos_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.cos_companies (id) on delete set null,
  project_id uuid references public.cos_projects (id) on delete set null,
  number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'partial', 'paid', 'overdue', 'void')),
  amount numeric(14, 2) not null default 0,
  amount_paid numeric(14, 2) not null default 0,
  currency text not null default 'INR',
  issued_at date,
  due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);

create table if not exists public.cos_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invoice_id uuid references public.cos_invoices (id) on delete set null,
  company_id uuid references public.cos_companies (id) on delete set null,
  amount numeric(14, 2) not null,
  currency text not null default 'INR',
  paid_at timestamptz not null default now(),
  method text not null default 'other',
  created_at timestamptz not null default now()
);

create table if not exists public.cos_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  department_id uuid references public.cos_departments (id) on delete set null,
  category text not null default 'general',
  amount numeric(14, 2) not null,
  currency text not null default 'INR',
  incurred_at date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Daily closing + founder attention
-- ---------------------------------------------------------------------------
create table if not exists public.cos_daily_closings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  worker_id uuid not null references public.cos_workers (id) on delete cascade,
  closing_date date not null default current_date,
  completed text not null default '',
  pending text not null default '',
  blocked text not null default '',
  client_dependency text not null default '',
  tomorrow_priority text not null default '',
  capacity_notes text not null default '',
  rinpo_draft text not null default '',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (worker_id, closing_date)
);

create table if not exists public.cos_attention_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  severity text not null check (severity in ('P0', 'P1', 'P2', 'P3')),
  title text not null,
  summary text not null default '',
  href text,
  source_event text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cos_attention_org_open_idx
  on public.cos_attention_items (organization_id, severity)
  where resolved_at is null;

-- ---------------------------------------------------------------------------
-- Company-os approval projection (links to runtime / rinpo queues)
-- ---------------------------------------------------------------------------
create table if not exists public.cos_approval_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source text not null check (source in ('runtime', 'rinpo', 'company_os')),
  source_id text not null,
  title text not null,
  reason text not null default '',
  risk text not null default 'medium'
    check (risk in ('read', 'low', 'medium', 'high', 'critical')),
  requester_label text not null default '',
  company_id uuid references public.cos_companies (id) on delete set null,
  project_id uuid references public.cos_projects (id) on delete set null,
  financial_impact numeric(14, 2),
  currency text not null default 'INR',
  rinpo_recommendation text not null default '',
  status text not null default 'awaiting_approval'
    check (status in (
      'proposed', 'awaiting_approval', 'approved', 'rejected',
      'changes_requested', 'completed', 'failed'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source, source_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'cos_departments', 'cos_workers', 'cos_capacity_snapshots',
    'cos_companies', 'cos_contacts', 'cos_leads', 'cos_opportunities',
    'cos_proposals', 'cos_contracts', 'cos_projects', 'cos_milestones',
    'cos_tasks', 'cos_deliverables', 'cos_invoices', 'cos_payments',
    'cos_expenses', 'cos_daily_closings', 'cos_attention_items', 'cos_approval_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_select_member', t
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.is_org_member(organization_id))',
      t || '_select_member', t
    );
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_insert_member', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.is_org_member(organization_id))',
      t || '_insert_member', t
    );
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_update_member', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.is_org_member(organization_id)) with check (private.is_org_member(organization_id))',
      t || '_update_member', t
    );
  end loop;
end $$;

-- Company OS permission seeds (idempotent)
insert into public.permissions (key, description)
values
  ('founder.read', 'View Founder Control Tower'),
  ('founder.decide', 'Act on founder attention / approvals from tower'),
  ('clients.read', 'Read Company OS client accounts'),
  ('clients.write', 'Write Company OS client accounts'),
  ('sales.read', 'Read sales pipeline'),
  ('sales.write', 'Write sales pipeline'),
  ('work.read', 'Read projects and tasks'),
  ('work.write', 'Write projects and tasks'),
  ('finance.read', 'Read finance operating summary'),
  ('people.read', 'Read people and capacity'),
  ('people.write', 'Write people and capacity'),
  ('approvals.decide', 'Approve or reject Company OS / runtime actions'),
  ('ai.agent.execute', 'Execute governed AI agent tools')
on conflict (key) do nothing;
