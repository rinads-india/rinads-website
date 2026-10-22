-- RINADS Logistics OS v1: tenant provider configuration, routing policy and RI decision evidence.
-- Additive only. Carrier secret VALUES never belong in these tables.
-- RINADS Intelligence is the control plane; RINPO Runtime executes only authorized decisions.

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (key, description) values
  ('logistics.read', 'Read logistics configuration, routing decisions and shipment operations'),
  ('logistics.shipment.manage', 'Create and operate approved logistics shipments and lifecycle actions'),
  ('logistics.settings.manage', 'Manage tenant logistics providers and routing/autonomy policy')
on conflict (key) do nothing;

-- Founder / super-admin / tenant admin: full logistics control.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'logistics.read', 'logistics.shipment.manage', 'logistics.settings.manage'
)
where r.key in ('founder', 'super_admin', 'admin')
on conflict do nothing;

-- Managers / staff may operate shipments, but cannot change carrier credentials or autonomy policy.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('logistics.read', 'logistics.shipment.manage')
where r.key in ('manager', 'staff')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Tenant provider registry configuration
-- Secrets stay in Vercel/Coolify/vault/connector infrastructure. `credential_key`
-- stores only an opaque binding identifier, never a token, password or private key.
-- ---------------------------------------------------------------------------
create table if not exists public.logistics_provider_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider_key text not null check (provider_key ~ '^[a-z0-9][a-z0-9_\-]{1,63}$'),
  enabled boolean not null default false,
  priority integer not null default 100 check (priority between 0 and 10000),
  capabilities text[] not null default '{}',
  credential_source text not null default 'none'
    check (credential_source in ('none', 'environment', 'vault', 'connector')),
  credential_key text,
  non_secret_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(non_secret_config) = 'object'),
  verification_state text not null default 'unverified'
    check (verification_state in (
      'unverified', 'sandbox_passed', 'controlled_shipment_passed', 'suspended'
    )),
  sandbox_verified_at timestamptz,
  controlled_shipment_verified_at timestamptz,
  last_verified_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider_key),
  constraint logistics_provider_credential_binding_check check (
    (credential_source = 'none' and credential_key is null)
    or
    (credential_source <> 'none' and credential_key is not null and length(trim(credential_key)) between 1 and 160)
  ),
  constraint logistics_provider_controlled_verification_check check (
    verification_state <> 'controlled_shipment_passed'
    or controlled_shipment_verified_at is not null
  )
);

comment on column public.logistics_provider_configs.credential_key is
  'Opaque server-side secret binding identifier only. Never store carrier token/password/private-key values here.';

create index if not exists logistics_provider_configs_org_enabled_idx
  on public.logistics_provider_configs (organization_id, enabled, priority);

-- ---------------------------------------------------------------------------
-- Tenant routing + autonomy policy
-- One active policy row per organization for v1. Policy history is captured in
-- logistics_decision_events.policy_snapshot before execution.
-- ---------------------------------------------------------------------------
create table if not exists public.logistics_routing_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade unique,
  strategy text not null default 'intelligence'
    check (strategy in ('priority', 'lowest_cost', 'fastest', 'intelligence')),
  max_cost_minor bigint check (max_cost_minor is null or max_cost_minor >= 0),
  max_eta_hours numeric(10, 2) check (max_eta_hours is null or max_eta_hours >= 0),
  intelligence_weights jsonb not null default
    '{"cost":0.20,"eta":0.15,"deliverySuccess":0.25,"rto":0.15,"slaConfidence":0.10,"margin":0.05,"priority":0.10}'::jsonb
    check (jsonb_typeof(intelligence_weights) = 'object'),
  autonomy_mode text not null default 'recommend_only'
    check (autonomy_mode in ('recommend_only', 'approve_then_act', 'auto_low_risk')),
  human_approval_declared_value_minor bigint not null default 500000
    check (human_approval_declared_value_minor >= 0),
  human_approval_cod_minor bigint not null default 500000
    check (human_approval_cod_minor >= 0),
  require_approval_for_high_value boolean not null default true,
  require_approval_for_first_provider_use boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Append-only decision evidence
-- Every Observe/Understand/Recommend/Authorize/Act/Audit transition may append
-- one evidence event. Authenticated users have no UPDATE/DELETE policy.
-- ---------------------------------------------------------------------------
create table if not exists public.logistics_decision_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  correlation_id uuid not null,
  order_id uuid references public.orders (id) on delete set null,
  package_id uuid references public.packages (id) on delete set null,
  shipment_id uuid references public.shipments (id) on delete set null,
  stage text not null
    check (stage in ('observe', 'understand', 'recommend', 'authorize', 'act', 'audit', 'reject')),
  provider_key text,
  routing_strategy text
    check (routing_strategy is null or routing_strategy in ('priority', 'lowest_cost', 'fastest', 'intelligence')),
  decision_score numeric(8, 2),
  approval_required boolean not null default false,
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  policy_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(policy_snapshot) = 'object'),
  actor_type text not null default 'system'
    check (actor_type in ('user', 'system', 'rinads_intelligence', 'rinpo_runtime', 'provider')),
  actor_id text,
  occurred_at timestamptz not null default now()
);

create index if not exists logistics_decision_events_org_time_idx
  on public.logistics_decision_events (organization_id, occurred_at desc);
create index if not exists logistics_decision_events_correlation_idx
  on public.logistics_decision_events (organization_id, correlation_id, occurred_at);
create index if not exists logistics_decision_events_shipment_idx
  on public.logistics_decision_events (shipment_id, occurred_at)
  where shipment_id is not null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.logistics_provider_configs enable row level security;
alter table public.logistics_routing_policies enable row level security;
alter table public.logistics_decision_events enable row level security;

drop policy if exists logistics_provider_configs_read on public.logistics_provider_configs;
create policy logistics_provider_configs_read
  on public.logistics_provider_configs for select to authenticated
  using (private.has_permission(organization_id, 'logistics.read'));

drop policy if exists logistics_provider_configs_manage on public.logistics_provider_configs;
create policy logistics_provider_configs_manage
  on public.logistics_provider_configs for all to authenticated
  using (private.has_permission(organization_id, 'logistics.settings.manage'))
  with check (private.has_permission(organization_id, 'logistics.settings.manage'));

drop policy if exists logistics_routing_policies_read on public.logistics_routing_policies;
create policy logistics_routing_policies_read
  on public.logistics_routing_policies for select to authenticated
  using (private.has_permission(organization_id, 'logistics.read'));

drop policy if exists logistics_routing_policies_manage on public.logistics_routing_policies;
create policy logistics_routing_policies_manage
  on public.logistics_routing_policies for all to authenticated
  using (private.has_permission(organization_id, 'logistics.settings.manage'))
  with check (private.has_permission(organization_id, 'logistics.settings.manage'));

drop policy if exists logistics_decision_events_read on public.logistics_decision_events;
create policy logistics_decision_events_read
  on public.logistics_decision_events for select to authenticated
  using (private.has_permission(organization_id, 'logistics.read'));

drop policy if exists logistics_decision_events_insert on public.logistics_decision_events;
create policy logistics_decision_events_insert
  on public.logistics_decision_events for insert to authenticated
  with check (
    private.has_permission(organization_id, 'logistics.shipment.manage')
    and actor_type in ('user', 'rinads_intelligence', 'rinpo_runtime')
  );

-- Explicitly keep authenticated users append-only for decision evidence.
revoke update, delete on public.logistics_decision_events from authenticated;

grant select on public.logistics_provider_configs to authenticated;
grant insert, update, delete on public.logistics_provider_configs to authenticated;
grant select on public.logistics_routing_policies to authenticated;
grant insert, update, delete on public.logistics_routing_policies to authenticated;
grant select, insert on public.logistics_decision_events to authenticated;
