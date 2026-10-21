create table if not exists public.ri_event_log (
  id              bigserial primary key,
  event_name      text not null,
  properties      jsonb default '{}',
  organization_id uuid references public.organizations(id) on delete set null,
  created_at      timestamptz default now()
);

create index if not exists ri_event_log_name_idx on public.ri_event_log(event_name);
create index if not exists ri_event_log_org_idx  on public.ri_event_log(organization_id);
create index if not exists ri_event_log_ts_idx   on public.ri_event_log(created_at desc);

-- Service role only; no RLS read for end users
alter table public.ri_event_log enable row level security;
-- No select policy intentionally — only service-role writes
create policy "ri_event_log: service role insert"
  on public.ri_event_log for insert
  to service_role
  with check (true);
