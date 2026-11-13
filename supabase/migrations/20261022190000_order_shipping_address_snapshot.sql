-- Preserve immutable shipping-address evidence on the order.
-- Logistics must never reconstruct an historical delivery destination from a
-- customer address row that may have been edited after checkout.

alter table public.orders
  add column if not exists shipping_address_snapshot jsonb;

alter table public.orders
  drop constraint if exists orders_shipping_address_snapshot_object_check;

alter table public.orders
  add constraint orders_shipping_address_snapshot_object_check check (
    shipping_address_snapshot is null
    or jsonb_typeof(shipping_address_snapshot) = 'object'
  );

comment on column public.orders.shipping_address_snapshot is
  'Immutable delivery-address evidence captured at checkout. Logistics/carrier execution must prefer this snapshot over mutable customer address rows.';
