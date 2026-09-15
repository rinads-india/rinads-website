-- Production security hardening (R GLOW Production Hardening + Salon OS Foundation, Part A)
-- Closes P0 blockers identified in the governance audit before any real user/payment.

-- ---------------------------------------------------------------------------
-- 1. private.is_platform_privileged() — org-agnostic founder/super_admin check
--    (mirrors apps/platform-admin's requirePlatformTenancy() logic: a user is
--    platform-privileged if ANY of their active organization memberships use
--    a privileged system role.)
-- ---------------------------------------------------------------------------

create or replace function private.is_platform_privileged()
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
    where m.user_id = auth.uid()
      and m.status = 'active'
      and private.is_privileged_role_key(r.key)
  );
$$;

revoke all on function private.is_platform_privileged() from public;
grant execute on function private.is_platform_privileged() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Fix payment RLS bypass — service_orders_org previously allowed any org
--    member to UPDATE the row, including `status`/`paid_at`/payment ids.
--    Split into member-scoped SELECT/INSERT and service-role-only mutation
--    of payment-relevant fields (status transitions happen via the
--    payment-webhook Edge Function using the service-role key).
-- ---------------------------------------------------------------------------

drop policy if exists service_orders_org on service_orders;

create policy service_orders_select_member on service_orders
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy service_orders_insert_member on service_orders
  for insert to authenticated
  with check (private.is_org_member(organization_id));

-- Members may update their own org's order rows (RLS), but column-level
-- grants restrict *which* columns they can touch: only the non-payment
-- `razorpay_order_id` reference set at checkout-session creation time.
-- `status`, `paid_at`, `razorpay_payment_id`, `amount`, and `currency` stay
-- writable only by the service role (payment-webhook, assign_service_order).
create policy service_orders_update_member_reference on service_orders
  for update to authenticated
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

revoke update on service_orders from authenticated;
grant update (razorpay_order_id) on service_orders to authenticated;

-- No authenticated DELETE policy: orders are never hard-deleted by clients.

-- ---------------------------------------------------------------------------
-- 3. Lock down set_organization_status — previously granted EXECUTE to
--    `authenticated` with no in-function role check, letting any signed-in
--    user suspend/archive ANY organization by id.
-- ---------------------------------------------------------------------------

create or replace function public.set_organization_status(
  p_org_id uuid,
  p_status text
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
begin
  if auth.jwt() ->> 'role' <> 'service_role' and not private.is_platform_privileged() then
    raise exception 'Platform privileges required';
  end if;

  if p_status not in ('active', 'suspended', 'archived') then
    raise exception 'Invalid status';
  end if;

  update public.organizations
  set status = p_status, updated_at = now()
  where id = p_org_id
  returning * into v_org;

  if v_org.id is null then
    raise exception 'Organization not found';
  end if;

  insert into audit_logs (organization_id, actor_type, actor_id, action, entity, entity_id, after)
  values (p_org_id, 'user', auth.uid()::text, 'tenant.status_changed', 'organization', p_org_id::text,
    jsonb_build_object('status', p_status));

  return v_org;
end;
$$;

revoke all on function public.set_organization_status(uuid, text) from public;
grant execute on function public.set_organization_status(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Gate owner-only runtime approval actions — runtime_approvals previously
--    allowed ANY org member to UPDATE (approve/reject high-risk agent
--    actions). Require org.manage permission (founder/super_admin/admin/
--    manager per the CORE seed), matching the intent of an "approver".
-- ---------------------------------------------------------------------------

drop policy if exists runtime_approvals_member_update on runtime_approvals;

create policy runtime_approvals_approver_update on runtime_approvals
  for update to authenticated
  using (private.has_permission(organization_id, 'org.manage'))
  with check (private.has_permission(organization_id, 'org.manage'));

-- ---------------------------------------------------------------------------
-- 5. Fix organization_domains schema drift — DB used `domain` + a narrower
--    status enum; app code (apps/platform-admin/app/actions/domains.ts,
--    packages/domains) uses `hostname`, `verification_token`,
--    `verification_method`, `verified_at`, `vercel_domain_id`,
--    `last_checked_at`, and status values including `active`.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organization_domains' and column_name = 'domain'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organization_domains' and column_name = 'hostname'
  ) then
    alter table organization_domains rename column domain to hostname;
  end if;
end $$;

do $$
declare
  v_constraint text;
begin
  select con.conname into v_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'organization_domains' and con.contype = 'c' and pg_get_constraintdef(con.oid) ilike '%status%';

  if v_constraint is not null then
    execute format('alter table organization_domains drop constraint %I', v_constraint);
  end if;
end $$;

alter table organization_domains
  add constraint organization_domains_status_check
  check (status in ('pending', 'verified', 'active', 'disabled'));

alter table organization_domains add column if not exists verification_token text;
alter table organization_domains add column if not exists verification_method text not null default 'txt';
alter table organization_domains add column if not exists verified_at timestamptz;
alter table organization_domains add column if not exists vercel_domain_id text;
alter table organization_domains add column if not exists last_checked_at timestamptz;
alter table organization_domains add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'organization_domains' and con.conname = 'organization_domains_verification_method_check'
  ) then
    alter table organization_domains
      add constraint organization_domains_verification_method_check
      check (verification_method in ('txt', 'cname'));
  end if;
end $$;
