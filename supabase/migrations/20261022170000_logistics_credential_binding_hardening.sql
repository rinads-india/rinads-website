-- RINADS Logistics OS: credential binding hardening.
-- `credential_key` is an opaque server-owned binding ID, NEVER an env-var name
-- or secret value. Runtime resolution is allowlisted in operations-server.

-- Normalize any early/provisional environment-key style values before locking the format.
update public.logistics_provider_configs
set credential_key = case
  when provider_key = 'dtdc' and credential_key = 'RINADS_DTDC_API_TOKEN' then 'dtdc_primary'
  when provider_key = 'delhivery' and credential_key = 'RINADS_DELHIVERY_API_TOKEN' then 'delhivery_primary'
  when provider_key = 'porter' and credential_key in ('RINADS_PORTER_API_KEY', 'RINADS_PORTER_API_SECRET') then 'porter_primary'
  when provider_key = 'ondc_delivery' and credential_key in ('RINADS_ONDC_SUBSCRIBER_ID', 'RINADS_ONDC_SIGNING_PRIVATE_KEY') then 'ondc_delivery_primary'
  when provider_key = 'shiprocket' and credential_key = 'RINADS_SHIPROCKET_API_TOKEN' then 'shiprocket_primary'
  when provider_key = 'sequel' and credential_key = 'RINADS_SEQUEL_API_TOKEN' then 'sequel_primary'
  when provider_key = 'bvc' and credential_key = 'RINADS_BVC_API_TOKEN' then 'bvc_primary'
  else credential_key
end
where credential_source = 'environment'
  and credential_key is not null;

alter table public.logistics_provider_configs
  drop constraint if exists logistics_provider_credential_key_format_check;

alter table public.logistics_provider_configs
  add constraint logistics_provider_credential_key_format_check check (
    credential_key is null
    or credential_key ~ '^[a-z0-9][a-z0-9_-]{1,159}$'
  );

comment on column public.logistics_provider_configs.credential_key is
  'Opaque server-owned binding ID (example: delhivery_primary). Never an environment-variable name, carrier token, password, private key, or other secret value.';
