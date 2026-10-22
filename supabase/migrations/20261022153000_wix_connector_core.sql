-- RINADS × Wix data-plane foundation.
--
-- Canonical business effects continue to use public.business_events. These
-- tables only own provider connection identity + idempotent inbound delivery.

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null,
  external_instance_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'connected', 'removed', 'error')),
  capabilities text[] not null default '{}',
  metadata jsonb not null default '{}',
  connected_at timestamptz,
  removed_at timestamptz,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_instance_id)
);

create index if not exists integration_connections_org_provider_idx
  on public.integration_connections (organization_id, provider)
  where organization_id is not null;

create table if not exists public.provider_event_inbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  external_instance_id text not null,
  connection_id uuid references public.integration_connections(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  status text not null default 'quarantined'
    check (status in ('quarantined', 'accepted', 'ignored', 'failed')),
  payload jsonb not null default '{}',
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists provider_event_inbox_connection_idx
  on public.provider_event_inbox (connection_id, received_at desc);
create index if not exists provider_event_inbox_org_idx
  on public.provider_event_inbox (organization_id, received_at desc)
  where organization_id is not null;
create index if not exists provider_event_inbox_quarantine_idx
  on public.provider_event_inbox (provider, external_instance_id, received_at desc)
  where status = 'quarantined';

alter table public.integration_connections enable row level security;
alter table public.provider_event_inbox enable row level security;

drop policy if exists integration_connections_select_member on public.integration_connections;
create policy integration_connections_select_member
  on public.integration_connections for select to authenticated
  using (organization_id is not null and private.is_org_member(organization_id));

drop policy if exists integration_connections_manage_org on public.integration_connections;
create policy integration_connections_manage_org
  on public.integration_connections for all to authenticated
  using (
    organization_id is not null
    and private.has_permission(organization_id, 'org.manage')
  )
  with check (
    organization_id is not null
    and private.has_permission(organization_id, 'org.manage')
  );

drop policy if exists provider_event_inbox_select_member on public.provider_event_inbox;
create policy provider_event_inbox_select_member
  on public.provider_event_inbox for select to authenticated
  using (organization_id is not null and private.is_org_member(organization_id));

revoke all on public.integration_connections from anon;
revoke all on public.provider_event_inbox from anon;
grant select, insert, update, delete on public.integration_connections to authenticated;
grant select on public.provider_event_inbox to authenticated;

-- Bind a verified provider instance to a canonical RINADS tenant. Rebinding an
-- instance from one tenant to another is intentionally rejected.
create or replace function public.bind_integration_connection(
  p_provider text,
  p_external_instance_id text,
  p_organization_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_connection public.integration_connections%rowtype;
  v_connection_id uuid;
begin
  if nullif(btrim(p_provider), '') is null then
    raise exception 'provider is required';
  end if;
  if nullif(btrim(p_external_instance_id), '') is null then
    raise exception 'external_instance_id is required';
  end if;
  if not private.has_permission(p_organization_id, 'org.manage') then
    raise exception 'permission denied';
  end if;

  select * into v_connection
  from public.integration_connections
  where provider = lower(btrim(p_provider))
    and external_instance_id = btrim(p_external_instance_id)
  for update;

  if found and v_connection.organization_id is not null
    and v_connection.organization_id <> p_organization_id then
    raise exception 'integration instance is already bound to another organization';
  end if;

  if found and v_connection.status = 'removed' then
    raise exception 'cannot bind a removed integration instance';
  end if;

  insert into public.integration_connections (
    organization_id,
    provider,
    external_instance_id,
    status,
    connected_at,
    updated_at
  ) values (
    p_organization_id,
    lower(btrim(p_provider)),
    btrim(p_external_instance_id),
    'connected',
    now(),
    now()
  )
  on conflict (provider, external_instance_id) do update
    set organization_id = excluded.organization_id,
        status = 'connected',
        connected_at = coalesce(public.integration_connections.connected_at, now()),
        removed_at = null,
        updated_at = now()
  returning id into v_connection_id;

  update public.provider_event_inbox
  set organization_id = p_organization_id,
      connection_id = v_connection_id,
      status = case when status = 'quarantined' then 'accepted' else status end
  where provider = lower(btrim(p_provider))
    and external_instance_id = btrim(p_external_instance_id)
    and organization_id is null;

  insert into public.business_events (
    organization_id,
    event_type,
    entity_type,
    entity_id,
    payload,
    metadata,
    idempotency_key,
    source,
    actor_type,
    actor_id,
    schema_version
  ) values (
    p_organization_id,
    'integration.connected.v1',
    'integration_connection',
    v_connection_id::text,
    jsonb_build_object(
      'provider', lower(btrim(p_provider)),
      'externalInstanceId', btrim(p_external_instance_id)
    ),
    jsonb_build_object('binding', 'manual_or_authenticated'),
    'integration.bind:' || lower(btrim(p_provider)) || ':' || btrim(p_external_instance_id),
    'integration',
    'human',
    auth.uid()::text,
    'v1'
  )
  on conflict (organization_id, idempotency_key) do nothing;

  insert into public.audit_logs (
    organization_id,
    actor_type,
    actor_id,
    action,
    entity,
    entity_id,
    after,
    source
  ) values (
    p_organization_id,
    'user',
    auth.uid()::text,
    'integration.bound',
    'integration_connection',
    v_connection_id::text,
    jsonb_build_object(
      'provider', lower(btrim(p_provider)),
      'externalInstanceId', btrim(p_external_instance_id)
    ),
    'integration'
  );

  return v_connection_id;
end;
$$;

revoke all on function public.bind_integration_connection(text, text, uuid) from public;
revoke all on function public.bind_integration_connection(text, text, uuid) from anon;
grant execute on function public.bind_integration_connection(text, text, uuid) to authenticated;
