-- P0 security hardening: webhook payloads can contain payment/customer data.
-- The payment webhook is server-side and uses service-role access, so browser
-- roles must have no direct table privileges and no permissive RLS policies.

alter table public.payment_webhook_events enable row level security;

revoke all privileges on table public.payment_webhook_events from anon;
revoke all privileges on table public.payment_webhook_events from authenticated;
revoke all privileges on table public.payment_webhook_events from public;

-- Intentionally create no anon/authenticated policies. The service_role keeps
-- its BYPASSRLS capability for the trusted webhook processor.
--
-- Rollback (emergency only; restores the previous insecure posture):
--   alter table public.payment_webhook_events disable row level security;
--   grant select, insert, update, delete on table public.payment_webhook_events
--     to anon, authenticated;
