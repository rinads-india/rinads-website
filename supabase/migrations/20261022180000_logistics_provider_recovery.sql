-- Durable carrier execution identity and recovery metadata.
-- Extends the existing Operations ERP shipments table; does not create a new
-- public API surface. Existing shipment RLS/policies continue to apply.

alter table public.shipments
  add column if not exists provider_order_id text,
  add column if not exists provider_shipment_id text,
  add column if not exists provider_reference text,
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- A deterministic provider reference is the RINADS idempotency boundary for one
-- organization + carrier. It prevents a retry from representing the same package
-- as a second provider order.
create unique index if not exists shipments_org_carrier_provider_reference_uq
  on public.shipments (organization_id, carrier, provider_reference)
  where provider_reference is not null;

-- Provider shipment IDs and AWBs must identify at most one canonical shipment
-- for a given carrier. Partial unique indexes preserve legacy rows with nulls.
create unique index if not exists shipments_carrier_provider_shipment_uq
  on public.shipments (carrier, provider_shipment_id)
  where provider_shipment_id is not null;

create unique index if not exists shipments_carrier_awb_uq
  on public.shipments (carrier, awb)
  where awb is not null;

comment on column public.shipments.provider_order_id is
  'Carrier/aggregator order identifier returned after execution; never a credential.';
comment on column public.shipments.provider_shipment_id is
  'Carrier/aggregator shipment identifier used for durable recovery and label/pickup operations.';
comment on column public.shipments.provider_reference is
  'Deterministic RINADS merchant-side provider reference/idempotency key.';
comment on column public.shipments.provider_metadata is
  'Sanitized provider execution metadata only; do not persist credentials or customer payloads.';
