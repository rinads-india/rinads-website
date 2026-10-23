-- External-agent delegation ledger for ChatGPT/Codex/Claude/Gemini/Grok access.
-- Source-control only in this PR. Applying to production remains a separate gate.
-- Raw bearer/delegation tokens are never persisted; only non-secret token IDs
-- and authorization metadata are stored for revocation/audit evidence.

create table if not exists public.external_agent_delegations (
  id uuid primary key default gen_random_uuid(),
  token_id text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client text not null check (
    client in ('chatgpt', 'codex', 'claude', 'claude_code', 'gemini', 'grok', 'internal')
  ),
  scopes text[] not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (expires_at > issued_at),
  check (cardinality(scopes) > 0),
  check (
    scopes <@ array[
      'intelligence.business_summary.read',
      'commerce.catalog.read',
      'commerce.order.read'
    ]::text[]
  )
);

create index if not exists external_agent_delegations_user_idx
  on public.external_agent_delegations (user_id, created_at desc);
create index if not exists external_agent_delegations_org_idx
  on public.external_agent_delegations (organization_id, created_at desc);
create index if not exists external_agent_delegations_active_idx
  on public.external_agent_delegations (token_id, expires_at)
  where revoked_at is null;

alter table public.external_agent_delegations enable row level security;

revoke all privileges on table public.external_agent_delegations from public;
revoke all privileges on table public.external_agent_delegations from anon;
revoke all privileges on table public.external_agent_delegations from authenticated;

grant select, insert on table public.external_agent_delegations to authenticated;

create policy external_agent_delegations_select_own
  on public.external_agent_delegations
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and private.is_org_member(organization_id)
  );

create policy external_agent_delegations_insert_own
  on public.external_agent_delegations
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and private.is_org_member(organization_id)
    and revoked_at is null
    and issued_at <= now() + interval '60 seconds'
    and expires_at <= issued_at + interval '1 hour'
    and expires_at > now()
    and cardinality(scopes) > 0
    and scopes <@ array[
      'intelligence.business_summary.read',
      'commerce.catalog.read',
      'commerce.order.read'
    ]::text[]
  );

-- Revocation is performed through a narrow SECURITY DEFINER RPC. Authenticated
-- clients do not receive UPDATE/DELETE table privileges, preventing arbitrary
-- mutation of scopes, organization, expiry or token ownership.
create or replace function public.revoke_external_agent_delegation(p_token_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.external_agent_delegations d
  set revoked_at = coalesce(d.revoked_at, now())
  where d.token_id = p_token_id
    and d.user_id = auth.uid()
    and private.is_org_member(d.organization_id);

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.revoke_external_agent_delegation(text) from public;
grant execute on function public.revoke_external_agent_delegation(text) to authenticated;

-- No DELETE policy. Rows are security/audit evidence and should be retained by
-- platform retention policy rather than end-user deletion.
