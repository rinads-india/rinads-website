-- RINADS Intelligence v1: persisted Decision Queue.
-- Recommendations remain evidence-backed RI objects; this migration persists only
-- human-governed decision state and its append-only transition history.

insert into public.permissions (key, description)
values
  ('intelligence.read', 'Read RINADS Intelligence recommendations and decision queue'),
  ('intelligence.decide', 'Review, approve, reject, delegate and schedule RI decisions'),
  ('intelligence.manage', 'Manage RI decision configuration and governed queue state')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('founder', 'super_admin', 'admin')
  and p.key in ('intelligence.read', 'intelligence.decide', 'intelligence.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'manager'
  and p.key in ('intelligence.read', 'intelligence.decide')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('staff', 'viewer')
  and p.key = 'intelligence.read'
on conflict do nothing;

create table if not exists public.ri_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recommendation_id text not null,
  recommendation_key text,
  dedupe_key text not null,
  title text not null,
  rationale text not null default '',
  risk text not null check (risk in ('low', 'medium', 'high', 'critical')),
  priority_score smallint not null default 0 check (priority_score between 0 and 100),
  "authorization" jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  action jsonb,
  status text not null default 'PROPOSED'
    check (status in ('PROPOSED','REVIEWING','APPROVED','REJECTED','DELEGATED','EXPIRED','EXECUTED','FAILED')),
  assigned_to uuid references auth.users(id) on delete set null,
  delegated_to uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  decision_note text,
  scheduled_for timestamptz,
  expires_at timestamptz,
  decided_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ri_decisions_org_status_priority_idx
  on public.ri_decisions (organization_id, status, priority_score desc, created_at desc);

create index if not exists ri_decisions_assigned_idx
  on public.ri_decisions (organization_id, assigned_to, status, created_at desc);

create unique index if not exists ri_decisions_active_dedupe_idx
  on public.ri_decisions (organization_id, dedupe_key)
  where status in ('PROPOSED','REVIEWING','APPROVED','DELEGATED');

create table if not exists public.ri_decision_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  decision_id uuid not null references public.ri_decisions(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_user_id uuid references auth.users(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ri_decision_events_decision_idx
  on public.ri_decision_events (decision_id, created_at asc);
create index if not exists ri_decision_events_org_idx
  on public.ri_decision_events (organization_id, created_at desc);

create or replace function public.validate_ri_decision_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if
    (old.status = 'PROPOSED' and new.status in ('REVIEWING','APPROVED','REJECTED','DELEGATED','EXPIRED')) or
    (old.status = 'REVIEWING' and new.status in ('APPROVED','REJECTED','DELEGATED','EXPIRED')) or
    (old.status = 'APPROVED' and new.status in ('EXECUTED','FAILED','EXPIRED')) or
    (old.status = 'DELEGATED' and new.status in ('REVIEWING','APPROVED','REJECTED','EXPIRED'))
  then
    return new;
  end if;

  raise exception 'Invalid RI decision transition: % -> %', old.status, new.status;
end;
$$;

create or replace function public.audit_ri_decision_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.ri_decision_events (
      organization_id,
      decision_id,
      event_type,
      from_status,
      to_status,
      actor_user_id,
      note
    ) values (
      new.organization_id,
      new.id,
      'status_changed',
      old.status,
      new.status,
      auth.uid(),
      new.decision_note
    );
  end if;
  return new;
end;
$$;

revoke all on function public.validate_ri_decision_transition() from public;
revoke all on function public.audit_ri_decision_transition() from public;

DROP TRIGGER IF EXISTS ri_decisions_validate_transition ON public.ri_decisions;
CREATE TRIGGER ri_decisions_validate_transition
  BEFORE UPDATE OF status ON public.ri_decisions
  FOR EACH ROW EXECUTE FUNCTION public.validate_ri_decision_transition();

DROP TRIGGER IF EXISTS ri_decisions_audit_transition ON public.ri_decisions;
CREATE TRIGGER ri_decisions_audit_transition
  AFTER UPDATE OF status ON public.ri_decisions
  FOR EACH ROW EXECUTE FUNCTION public.audit_ri_decision_transition();

DROP TRIGGER IF EXISTS ri_decisions_updated_at ON public.ri_decisions;
CREATE TRIGGER ri_decisions_updated_at
  BEFORE UPDATE ON public.ri_decisions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

alter table public.ri_decisions enable row level security;
alter table public.ri_decision_events enable row level security;

DROP POLICY IF EXISTS ri_decisions_select ON public.ri_decisions;
CREATE POLICY ri_decisions_select ON public.ri_decisions
  FOR SELECT TO authenticated
  USING (
    private.has_permission(organization_id, 'intelligence.read')
    OR private.has_permission(organization_id, 'org.manage')
  );

DROP POLICY IF EXISTS ri_decisions_insert ON public.ri_decisions;
CREATE POLICY ri_decisions_insert ON public.ri_decisions
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'intelligence.decide')
    OR private.has_permission(organization_id, 'intelligence.manage')
    OR private.has_permission(organization_id, 'org.manage')
  );

DROP POLICY IF EXISTS ri_decisions_update ON public.ri_decisions;
CREATE POLICY ri_decisions_update ON public.ri_decisions
  FOR UPDATE TO authenticated
  USING (
    private.has_permission(organization_id, 'intelligence.decide')
    OR private.has_permission(organization_id, 'intelligence.manage')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    private.has_permission(organization_id, 'intelligence.decide')
    OR private.has_permission(organization_id, 'intelligence.manage')
    OR private.has_permission(organization_id, 'org.manage')
  );

DROP POLICY IF EXISTS ri_decision_events_select ON public.ri_decision_events;
CREATE POLICY ri_decision_events_select ON public.ri_decision_events
  FOR SELECT TO authenticated
  USING (
    private.has_permission(organization_id, 'intelligence.read')
    OR private.has_permission(organization_id, 'org.manage')
  );

DROP POLICY IF EXISTS ri_decision_events_insert ON public.ri_decision_events;
CREATE POLICY ri_decision_events_insert ON public.ri_decision_events
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'intelligence.decide')
    OR private.has_permission(organization_id, 'intelligence.manage')
    OR private.has_permission(organization_id, 'org.manage')
  );

comment on table public.ri_decisions is
  'Tenant-scoped human governance queue for RINADS Intelligence recommendations that require approval or escalation.';
comment on table public.ri_decision_events is
  'Append-only status-transition history for RI decisions; runtime execution audit remains in the platform audit/event layers.';
