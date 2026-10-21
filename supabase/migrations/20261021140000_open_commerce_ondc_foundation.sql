-- Business Cloud V2: Open Commerce / ONDC channel foundation.
--
-- ONDC is an integration channel over canonical RINADS Commerce. Network
-- messages and transaction ids are projections; local orders remain authority.
-- Signing/private keys are never stored in these tables.

insert into public.permissions (key, description)
values
  ('commerce.channel.read', 'Read external/open-commerce channel configuration and protocol evidence'),
  ('commerce.channel.manage', 'Manage external/open-commerce channel configuration')
on conflict (key) do nothing;

-- Composite tenant FK support for canonical order linkage.
create unique index if not exists orders_org_id_unique
  on public.orders(organization_id, id);

create table if not exists public.open_commerce_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network text not null default 'ondc' check (network in ('ondc')),
  participant_role text not null check (participant_role in ('buyer_app', 'seller_app')),
  domain text not null,
  protocol_version text not null,
  environment text not null default 'staging'
    check (environment in ('staging', 'preprod', 'production')),
  subscriber_id text not null,
  subscriber_url text not null,
  key_reference text,
  status text not null default 'disabled'
    check (status in ('disabled', 'staging', 'live')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, network, participant_role, domain, subscriber_id),
  check (length(btrim(protocol_version)) > 0),
  check (length(btrim(subscriber_id)) > 0),
  check (subscriber_url ~ '^https?://'),
  check (environment <> 'production' or subscriber_url ~ '^https://')
);

create table if not exists public.open_commerce_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid not null,
  network_transaction_id text not null,
  canonical_order_id uuid,
  network_state text,
  last_action text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, channel_id, network_transaction_id),
  constraint open_commerce_transactions_channel_same_org_fk
    foreign key (organization_id, channel_id)
    references public.open_commerce_channels(organization_id, id)
    on delete cascade
    deferrable initially immediate,
  constraint open_commerce_transactions_order_same_org_fk
    foreign key (organization_id, canonical_order_id)
    references public.orders(organization_id, id)
    deferrable initially immediate,
  check (length(btrim(network_transaction_id)) > 0)
);

create table if not exists public.open_commerce_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid not null,
  transaction_record_id uuid,
  network_transaction_id text not null,
  network_message_id text not null,
  action text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  signature_verified boolean not null default false,
  payload jsonb not null,
  payload_hash text,
  processing_status text not null default 'processed'
    check (processing_status in ('processed', 'rejected', 'failed')),
  error_code text,
  error_detail text,
  idempotency_key text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  constraint open_commerce_messages_channel_same_org_fk
    foreign key (organization_id, channel_id)
    references public.open_commerce_channels(organization_id, id)
    on delete cascade
    deferrable initially immediate,
  constraint open_commerce_messages_transaction_same_org_fk
    foreign key (organization_id, transaction_record_id)
    references public.open_commerce_transactions(organization_id, id)
    deferrable initially immediate,
  check (length(btrim(network_transaction_id)) > 0),
  check (length(btrim(network_message_id)) > 0),
  check (action ~ '^(on_)?(search|select|init|confirm|status|track|cancel|update|rating|support)$')
);

create index if not exists open_commerce_channels_org_status_idx
  on public.open_commerce_channels(organization_id, status, network);
create index if not exists open_commerce_transactions_org_order_idx
  on public.open_commerce_transactions(organization_id, canonical_order_id)
  where canonical_order_id is not null;
create index if not exists open_commerce_messages_org_tx_time_idx
  on public.open_commerce_messages(organization_id, network_transaction_id, occurred_at desc);
create index if not exists open_commerce_messages_org_action_idx
  on public.open_commerce_messages(organization_id, action, direction, occurred_at desc);

alter table public.open_commerce_channels enable row level security;
alter table public.open_commerce_transactions enable row level security;
alter table public.open_commerce_messages enable row level security;

-- Protocol payloads may contain customer/order details, so access is narrower
-- than generic organization membership.
do $$
declare
  t text;
begin
  foreach t in array array[
    'open_commerce_channels',
    'open_commerce_transactions',
    'open_commerce_messages'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (' ||
      'private.has_permission(organization_id, ''commerce.channel.read'') or ' ||
      'private.has_permission(organization_id, ''commerce.channel.manage'') or ' ||
      'private.has_permission(organization_id, ''org.manage''))',
      t || '_select', t
    );
  end loop;
end $$;

create policy open_commerce_channels_insert on public.open_commerce_channels
  for insert to authenticated
  with check (
    private.has_permission(organization_id, 'commerce.channel.manage')
    or private.has_permission(organization_id, 'org.manage')
  );
create policy open_commerce_channels_update on public.open_commerce_channels
  for update to authenticated
  using (
    private.has_permission(organization_id, 'commerce.channel.manage')
    or private.has_permission(organization_id, 'org.manage')
  )
  with check (
    private.has_permission(organization_id, 'commerce.channel.manage')
    or private.has_permission(organization_id, 'org.manage')
  );

-- Transactions and wire-message evidence are service-side only. No authenticated
-- INSERT/UPDATE/DELETE policy is granted for either table.
create or replace function private.prevent_open_commerce_message_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Open-commerce protocol messages are append-only';
end;
$$;

revoke all on function private.prevent_open_commerce_message_mutation() from public;

drop trigger if exists open_commerce_messages_immutable on public.open_commerce_messages;
create trigger open_commerce_messages_immutable
  before update or delete on public.open_commerce_messages
  for each row execute function private.prevent_open_commerce_message_mutation();

comment on table public.open_commerce_channels is
  'Provider-neutral Open Commerce channel configuration. key_reference may identify external secret material; private/signing keys must not be stored here.';
comment on table public.open_commerce_transactions is
  'Network transaction projection mapped to optional canonical RINADS Commerce order.';
comment on table public.open_commerce_messages is
  'Append-only inbound/outbound ONDC protocol evidence. Raw/versioned payload is not canonical Commerce truth.';
