-- RINADS Marketing OS Phase 0.1 — Meta read-only connection foundation.
--
-- Security boundary:
-- - channel_connections stores only opaque credential_ref handles.
-- - encrypted credential material is isolated in a service-role-only table.
-- - authenticated users receive NO policies on marketing_channel_credentials.
-- - no ad-spend or publishing mutation is introduced by this migration.

ALTER TABLE public.channel_connections
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sync_error TEXT;

CREATE TABLE IF NOT EXISTS public.marketing_channel_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN (
    'meta', 'google', 'linkedin', 'tiktok', 'youtube', 'whatsapp'
  )),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm'
    CHECK (algorithm = 'aes-256-gcm'),
  key_version SMALLINT NOT NULL DEFAULT 1 CHECK (key_version > 0),
  scopes TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (connection_id, organization_id),
  CONSTRAINT marketing_channel_credentials_connection_same_org_fk
    FOREIGN KEY (connection_id, organization_id)
    REFERENCES public.channel_connections(id, organization_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS marketing_channel_credentials_org_provider_idx
  ON public.marketing_channel_credentials(organization_id, provider);

ALTER TABLE public.marketing_channel_credentials ENABLE ROW LEVEL SECURITY;

-- Deliberately no anon/authenticated policies. Service role is the only application path.
REVOKE ALL ON TABLE public.marketing_channel_credentials FROM anon, authenticated;

COMMENT ON TABLE public.marketing_channel_credentials IS
  'Server-only encrypted external-channel credentials. Never return rows to browser clients; credential_ref uses marketing-credential://<uuid>.';
COMMENT ON COLUMN public.marketing_channel_credentials.ciphertext IS
  'AES-256-GCM ciphertext. Encryption key is supplied by the server secret store/environment and is never persisted in Postgres.';
COMMENT ON COLUMN public.channel_connections.credential_ref IS
  'Opaque server-side credential handle. Phase 0.1 uses marketing-credential://<uuid>; never store OAuth tokens here.';
