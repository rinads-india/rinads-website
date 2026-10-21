-- Business Cloud V2: atomic AI credit execution controls.
--
-- Serializes reservation/capture/release per credit account so concurrent AI
-- and media requests cannot overspend the same organization balance.
-- Functions are service-role only; browser clients cannot mutate credits.

create or replace function public.credit_reserve_units(
  p_organization_id uuid,
  p_units bigint,
  p_idempotency_key text,
  p_expires_at timestamptz,
  p_purpose text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_id uuid;
  v_existing public.credit_reservations%rowtype;
  v_total bigint;
  v_reserved bigint;
  v_available bigint;
  v_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'credit_reserve_units is service-role only';
  end if;
  if p_units <= 0 then
    raise exception 'Credit reservation units must be greater than zero';
  end if;
  if nullif(btrim(p_idempotency_key), '') is null then
    raise exception 'Credit reservation idempotency key is required';
  end if;
  if p_expires_at <= now() then
    raise exception 'Credit reservation expiry must be in the future';
  end if;

  select a.id into v_account_id
  from public.credit_accounts a
  where a.organization_id = p_organization_id
    and a.unit_key = 'rinads_credit'
    and a.status = 'active'
  for update;

  if v_account_id is null then
    raise exception 'Active RINADS credit account not found';
  end if;

  select * into v_existing
  from public.credit_reservations r
  where r.organization_id = p_organization_id
    and r.idempotency_key = p_idempotency_key;

  if found then
    if v_existing.account_id <> v_account_id or v_existing.units <> p_units then
      raise exception 'Credit reservation idempotency key was reused with different parameters';
    end if;
    return v_existing.id;
  end if;

  select coalesce(sum(l.units), 0)::bigint into v_total
  from public.credit_ledger l
  where l.organization_id = p_organization_id
    and l.account_id = v_account_id;

  select coalesce(sum(r.units), 0)::bigint into v_reserved
  from public.credit_reservations r
  where r.organization_id = p_organization_id
    and r.account_id = v_account_id
    and r.status = 'active'
    and r.expires_at > now();

  v_available := greatest(0, v_total - v_reserved);
  if v_available < p_units then
    raise exception 'Insufficient RINADS credits: available %, requested %', v_available, p_units;
  end if;

  insert into public.credit_reservations (
    organization_id,
    account_id,
    units,
    status,
    idempotency_key,
    purpose,
    expires_at
  ) values (
    p_organization_id,
    v_account_id,
    p_units,
    'active',
    p_idempotency_key,
    p_purpose,
    p_expires_at
  ) returning id into v_id;

  insert into public.audit_logs (
    organization_id, actor_type, action, entity, entity_id, after, source
  ) values (
    p_organization_id,
    'system',
    'credits.reserved',
    'credit_reservation',
    v_id::text,
    jsonb_build_object('units', p_units, 'purpose', p_purpose, 'expires_at', p_expires_at),
    'billing'
  );

  return v_id;
end;
$$;

revoke all on function public.credit_reserve_units(uuid, bigint, text, timestamptz, text) from public, authenticated;
grant execute on function public.credit_reserve_units(uuid, bigint, text, timestamptz, text) to service_role;

create or replace function public.credit_release_reservation(
  p_organization_id uuid,
  p_reservation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_id uuid;
  v_reservation public.credit_reservations%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'credit_release_reservation is service-role only';
  end if;

  select a.id into v_account_id
  from public.credit_accounts a
  where a.organization_id = p_organization_id
    and a.unit_key = 'rinads_credit'
  for update;

  if v_account_id is null then
    raise exception 'RINADS credit account not found';
  end if;

  select * into v_reservation
  from public.credit_reservations r
  where r.organization_id = p_organization_id
    and r.account_id = v_account_id
    and r.id = p_reservation_id
  for update;

  if not found then
    raise exception 'Credit reservation not found';
  end if;

  if v_reservation.status = 'released' then
    return p_reservation_id;
  end if;
  if v_reservation.status = 'captured' then
    raise exception 'Captured credit reservation cannot be released';
  end if;

  update public.credit_reservations
  set status = case when expires_at <= now() then 'expired' else 'released' end,
      updated_at = now()
  where organization_id = p_organization_id and id = p_reservation_id;

  insert into public.audit_logs (
    organization_id, actor_type, action, entity, entity_id, after, source
  ) values (
    p_organization_id,
    'system',
    'credits.reservation_released',
    'credit_reservation',
    p_reservation_id::text,
    jsonb_build_object('units', v_reservation.units),
    'billing'
  );

  return p_reservation_id;
end;
$$;

revoke all on function public.credit_release_reservation(uuid, uuid) from public, authenticated;
grant execute on function public.credit_release_reservation(uuid, uuid) to service_role;

create or replace function public.credit_capture_reservation(
  p_organization_id uuid,
  p_reservation_id uuid,
  p_billable_credits bigint,
  p_usage_idempotency_key text,
  p_provider text,
  p_operation text,
  p_model text default null,
  p_quantity numeric default null,
  p_provider_cost_micros bigint default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_id uuid;
  v_reservation public.credit_reservations%rowtype;
  v_usage public.credit_usage_events%rowtype;
  v_existing_ledger public.credit_ledger%rowtype;
  v_ledger_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'credit_capture_reservation is service-role only';
  end if;
  if p_billable_credits <= 0 then
    raise exception 'Billable credits must be greater than zero';
  end if;
  if nullif(btrim(p_usage_idempotency_key), '') is null then
    raise exception 'Usage idempotency key is required';
  end if;
  if nullif(btrim(p_provider), '') is null or nullif(btrim(p_operation), '') is null then
    raise exception 'Provider and operation are required';
  end if;
  if p_provider_cost_micros is not null and p_provider_cost_micros < 0 then
    raise exception 'Provider cost cannot be negative';
  end if;

  select a.id into v_account_id
  from public.credit_accounts a
  where a.organization_id = p_organization_id
    and a.unit_key = 'rinads_credit'
    and a.status = 'active'
  for update;

  if v_account_id is null then
    raise exception 'Active RINADS credit account not found';
  end if;

  select * into v_reservation
  from public.credit_reservations r
  where r.organization_id = p_organization_id
    and r.account_id = v_account_id
    and r.id = p_reservation_id
  for update;

  if not found then
    raise exception 'Credit reservation not found';
  end if;

  if v_reservation.status = 'captured' then
    select * into v_existing_ledger
    from public.credit_ledger l
    where l.organization_id = p_organization_id
      and l.id = v_reservation.captured_ledger_id;

    if not found then
      raise exception 'Captured reservation is missing its ledger entry';
    end if;
    if abs(v_existing_ledger.units) <> p_billable_credits then
      raise exception 'Capture was retried with a different billable credit amount';
    end if;
    return v_existing_ledger.id;
  end if;

  if v_reservation.status <> 'active' then
    raise exception 'Only active credit reservations can be captured';
  end if;
  if v_reservation.expires_at <= now() then
    raise exception 'Credit reservation has expired';
  end if;
  if p_billable_credits > v_reservation.units then
    raise exception 'Billable credits exceed reserved credits';
  end if;

  insert into public.credit_usage_events (
    organization_id,
    provider,
    model,
    operation,
    quantity,
    provider_cost_micros,
    billable_credits,
    idempotency_key,
    metadata,
    occurred_at
  ) values (
    p_organization_id,
    p_provider,
    p_model,
    p_operation,
    p_quantity,
    p_provider_cost_micros,
    p_billable_credits,
    p_usage_idempotency_key,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (organization_id, idempotency_key) do nothing;

  select * into v_usage
  from public.credit_usage_events u
  where u.organization_id = p_organization_id
    and u.idempotency_key = p_usage_idempotency_key;

  if not found then
    raise exception 'Unable to persist credit usage event';
  end if;
  if v_usage.billable_credits <> p_billable_credits
     or v_usage.provider <> p_provider
     or v_usage.operation <> p_operation then
    raise exception 'Usage idempotency key was reused with different billing parameters';
  end if;

  insert into public.credit_ledger (
    organization_id,
    account_id,
    event_type,
    units,
    idempotency_key,
    usage_event_id,
    note,
    metadata,
    occurred_at
  ) values (
    p_organization_id,
    v_account_id,
    'consume',
    -p_billable_credits,
    'capture:' || p_reservation_id::text,
    v_usage.id,
    'Captured reserved AI/media usage',
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'reserved_units', v_reservation.units,
      'billable_credits', p_billable_credits
    ),
    now()
  )
  returning id into v_ledger_id;

  update public.credit_reservations
  set status = 'captured',
      captured_ledger_id = v_ledger_id,
      updated_at = now()
  where organization_id = p_organization_id and id = p_reservation_id;

  insert into public.audit_logs (
    organization_id, actor_type, action, entity, entity_id, after, source
  ) values (
    p_organization_id,
    'system',
    'credits.captured',
    'credit_reservation',
    p_reservation_id::text,
    jsonb_build_object(
      'reserved_units', v_reservation.units,
      'billable_credits', p_billable_credits,
      'provider', p_provider,
      'operation', p_operation,
      'usage_event_id', v_usage.id,
      'ledger_id', v_ledger_id
    ),
    'billing'
  );

  insert into public.business_events (
    organization_id,
    event_type,
    entity_type,
    entity_id,
    payload,
    idempotency_key,
    source,
    actor_type,
    schema_version
  ) values (
    p_organization_id,
    'credits.usage.captured',
    'credit_reservation',
    p_reservation_id::text,
    jsonb_build_object(
      'billable_credits', p_billable_credits,
      'provider', p_provider,
      'operation', p_operation,
      'usage_event_id', v_usage.id,
      'ledger_id', v_ledger_id
    ),
    'credits.usage.captured:' || p_reservation_id::text,
    'billing',
    'system',
    'v1'
  )
  on conflict (organization_id, idempotency_key) do nothing;

  return v_ledger_id;
end;
$$;

revoke all on function public.credit_capture_reservation(uuid, uuid, bigint, text, text, text, text, numeric, bigint, jsonb)
  from public, authenticated;
grant execute on function public.credit_capture_reservation(uuid, uuid, bigint, text, text, text, text, numeric, bigint, jsonb)
  to service_role;

comment on function public.credit_reserve_units(uuid, bigint, text, timestamptz, text) is
  'Service-only atomic credit hold. Locks the tenant credit account and fails closed on insufficient available balance.';
comment on function public.credit_capture_reservation(uuid, uuid, bigint, text, text, text, text, numeric, bigint, jsonb) is
  'Service-only capture path linking provider-cost evidence to an append-only negative credit ledger entry.';
comment on function public.credit_release_reservation(uuid, uuid) is
  'Service-only idempotent release/expiry transition for uncaptured credit holds.';
