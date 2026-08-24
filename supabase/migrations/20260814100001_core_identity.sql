-- Phase 1 CORE: identity, organizations, RBAC, feature flags, audit logs
-- Schema lives in supabase/ — not packages/*.
-- RLS mandatory on all tenant-sensitive tables.

create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables first (functions/policies reference these)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  scope text not null check (scope in ('system', 'organization')),
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_org_id_idx on public.organization_members (organization_id);

create table public.feature_flags (
  key text primary key,
  description text not null default '',
  default_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.feature_flag_overrides (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null references public.feature_flags (key) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  enabled boolean not null,
  created_at timestamptz not null default now(),
  check (organization_id is not null or user_id is not null)
);

create index feature_flag_overrides_org_idx on public.feature_flag_overrides (organization_id);
create index feature_flag_overrides_user_idx on public.feature_flag_overrides (user_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'ai', 'system')),
  actor_id text,
  approved_by uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  before jsonb,
  after jsonb,
  source text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helper functions (private schema)
-- ---------------------------------------------------------------------------

create or replace function private.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function private.has_permission(p_org_id uuid, p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.roles r on r.id = m.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.key = p_permission_key
  );
$$;

create or replace function private.is_privileged_role_key(p_key text)
returns boolean
language sql
immutable
as $$
  select p_key in ('founder', 'super_admin');
$$;

revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.has_permission(uuid, text) from public;
revoke all on function private.is_privileged_role_key(text) from public;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_permission(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.feature_flags enable row level security;
alter table public.feature_flag_overrides enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy roles_select_authenticated
  on public.roles for select to authenticated using (true);

create policy permissions_select_authenticated
  on public.permissions for select to authenticated using (true);

create policy role_permissions_select_authenticated
  on public.role_permissions for select to authenticated using (true);

create policy organizations_select_member
  on public.organizations for select to authenticated
  using (private.is_org_member(id));

create policy organizations_insert_authenticated
  on public.organizations for insert to authenticated
  with check (created_by = auth.uid());

create policy organizations_update_admin
  on public.organizations for update to authenticated
  using (private.has_permission(id, 'org.manage'))
  with check (private.has_permission(id, 'org.manage'));

create policy organization_members_select_member
  on public.organization_members for select to authenticated
  using (private.is_org_member(organization_id) or user_id = auth.uid());

create policy organization_members_insert_self_non_privileged
  on public.organization_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and status in ('active', 'invited')
    and not private.is_privileged_role_key(
      (select r.key from public.roles r where r.id = role_id)
    )
  );

create policy organization_members_update_manage
  on public.organization_members for update to authenticated
  using (private.has_permission(organization_id, 'org.members.manage'))
  with check (
    private.has_permission(organization_id, 'org.members.manage')
    and not private.is_privileged_role_key(
      (select r.key from public.roles r where r.id = role_id)
    )
  );

create policy feature_flags_select_authenticated
  on public.feature_flags for select to authenticated using (true);

create policy feature_flag_overrides_select_scoped
  on public.feature_flag_overrides for select to authenticated
  using (
    (organization_id is not null and private.is_org_member(organization_id))
    or user_id = auth.uid()
  );

create policy audit_logs_select_manage
  on public.audit_logs for select to authenticated
  using (
    organization_id is not null
    and private.has_permission(organization_id, 'audit.read')
  );

create policy audit_logs_insert_member
  on public.audit_logs for insert to authenticated
  with check (
    organization_id is not null
    and private.is_org_member(organization_id)
    and actor_type in ('user', 'system')
  );

-- ---------------------------------------------------------------------------
-- Triggers & RPCs
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prevent_privileged_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_key text;
begin
  select key into role_key from public.roles where id = new.role_id;
  if private.is_privileged_role_key(role_key) then
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
      raise exception 'Privileged role assignment requires service role';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_privileged_role_assignment
  before insert or update of role_id on public.organization_members
  for each row execute function public.prevent_privileged_role_assignment();

create or replace function public.create_organization(p_name text, p_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_admin_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_admin_role_id from public.roles where key = 'admin' limit 1;
  if v_admin_role_id is null then
    raise exception 'Admin role missing — run seed';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (p_name, p_slug, auth.uid())
  returning * into v_org;

  insert into public.organization_members (organization_id, user_id, role_id, status)
  values (v_org.id, auth.uid(), v_admin_role_id, 'active');

  insert into public.audit_logs (
    organization_id, actor_type, actor_id, action, entity, entity_id, source
  ) values (
    v_org.id, 'user', auth.uid()::text, 'organization.create', 'organizations', v_org.id::text, 'rpc'
  );

  return v_org;
end;
$$;

revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

insert into public.roles (key, name, scope) values
  ('founder', 'Founder', 'system'),
  ('super_admin', 'Super Admin', 'system'),
  ('admin', 'Admin', 'organization'),
  ('manager', 'Manager', 'organization'),
  ('staff', 'Staff', 'organization'),
  ('client', 'Client', 'organization'),
  ('viewer', 'Viewer', 'organization')
on conflict (key) do nothing;

insert into public.permissions (key, description) values
  ('org.read', 'View organization'),
  ('org.manage', 'Manage organization settings'),
  ('org.members.manage', 'Manage organization members'),
  ('audit.read', 'Read audit logs'),
  ('flags.read', 'Read feature flags')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin'
  and p.key in ('org.read', 'org.manage', 'org.members.manage', 'audit.read', 'flags.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'manager'
  and p.key in ('org.read', 'org.members.manage', 'flags.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('staff', 'client', 'viewer')
  and p.key in ('org.read', 'flags.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('founder', 'super_admin')
on conflict do nothing;

insert into public.feature_flags (key, description, default_enabled) values
  ('auth_supabase_enabled', 'Use Supabase Auth instead of demo auth on Public Experience', false),
  ('rinpo_enabled', 'Show RINPO public experience shell', true),
  ('ai_insights_enabled', 'Enable AI insights (Phase 2+)', false)
on conflict (key) do nothing;
