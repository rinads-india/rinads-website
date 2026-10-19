-- RINADS Marketing OS Phase 0
-- Business DNA + campaign/content domain + channel gateway persistence.
-- Organization remains the canonical tenant boundary. External credentials are never stored here;
-- channel_connections.credential_ref points to a server-side secret/credential store.

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (key, description) VALUES
  ('marketing.read', 'Read Marketing OS plans, content, publications, and analytics'),
  ('marketing.manage', 'Manage Business DNA, campaigns, content, and creative metadata'),
  ('marketing.publish', 'Schedule and publish approved marketing content'),
  ('marketing.channels.manage', 'Connect or reconfigure external marketing channels')
ON CONFLICT (key) DO NOTHING;

-- Founder / super-admin / admin receive all Marketing OS permissions.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key IN ('founder', 'super_admin', 'admin')
  AND p.key IN (
    'marketing.read', 'marketing.manage', 'marketing.publish', 'marketing.channels.manage'
  )
ON CONFLICT DO NOTHING;

-- Managers may operate campaigns and publish but cannot alter channel credentials.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'manager'
  AND p.key IN ('marketing.read', 'marketing.manage', 'marketing.publish')
ON CONFLICT DO NOTHING;

-- Staff get read access only by default; explicit elevation remains an RBAC decision.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'staff'
  AND p.key = 'marketing.read'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Business DNA (one profile + brand profile per organization)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_profiles (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  trading_name TEXT,
  industry TEXT,
  sub_industry TEXT,
  description TEXT NOT NULL DEFAULT '',
  country_code TEXT,
  timezone TEXT,
  languages TEXT[] NOT NULL DEFAULT '{}',
  website TEXT,
  business_model JSONB NOT NULL DEFAULT '{}',
  customer_segments JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_profiles (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_voice TEXT NOT NULL DEFAULT '',
  visual_style TEXT NOT NULL DEFAULT '',
  primary_color TEXT,
  secondary_colors TEXT[] NOT NULL DEFAULT '{}',
  typography JSONB NOT NULL DEFAULT '{}',
  logo_assets JSONB NOT NULL DEFAULT '[]',
  preferred_terms TEXT[] NOT NULL DEFAULT '{}',
  banned_terms TEXT[] NOT NULL DEFAULT '{}',
  slogans TEXT[] NOT NULL DEFAULT '{}',
  target_segments JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  target_value NUMERIC(18,4),
  target_unit TEXT,
  period_start DATE,
  period_end DATE,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'achieved', 'paused', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS business_goals_org_status_idx
  ON public.business_goals(organization_id, status);

-- Shared physical/virtual sites use the canonical public.locations table introduced by
-- 20261005100000_platform_workspaces_locations.sql. Marketing OS does not create a parallel location model.

-- ---------------------------------------------------------------------------
-- Channel connections and accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'meta', 'google', 'linkedin', 'tiktok', 'youtube', 'whatsapp'
  )),
  external_subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'degraded', 'revoked')),
  credential_ref TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  token_expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS channel_connections_org_provider_subject_uidx
  ON public.channel_connections(organization_id, provider, external_subject)
  WHERE external_subject IS NOT NULL;

CREATE INDEX IF NOT EXISTS channel_connections_org_status_idx
  ON public.channel_connections(organization_id, status);

CREATE TABLE IF NOT EXISTS public.channel_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN (
    'meta', 'google', 'linkedin', 'tiktok', 'youtube', 'whatsapp'
  )),
  account_type TEXT NOT NULL,
  external_account_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  username TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'disconnected')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, provider, external_account_id),
  CONSTRAINT channel_accounts_connection_same_org_fk
    FOREIGN KEY (connection_id, organization_id)
    REFERENCES public.channel_connections(id, organization_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS channel_accounts_org_provider_idx
  ON public.channel_accounts(organization_id, provider, status);

-- ---------------------------------------------------------------------------
-- Campaign + content domain
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'planned', 'active', 'paused', 'completed', 'cancelled', 'archived')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  budget_minor BIGINT CHECK (budget_minor IS NULL OR budget_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  business_goal_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  CONSTRAINT marketing_campaigns_goal_same_org_fk
    FOREIGN KEY (business_goal_id, organization_id)
    REFERENCES public.business_goals(id, organization_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS marketing_campaigns_org_status_idx
  ON public.marketing_campaigns(organization_id, status, start_at);

CREATE TABLE IF NOT EXISTS public.marketing_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID,
  title TEXT NOT NULL,
  brief TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'post',
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN (
      'DRAFT', 'GENERATING', 'REVIEW', 'APPROVED', 'SCHEDULED',
      'PROCESSING', 'PUBLISHED', 'PARTIAL_FAILURE', 'FAILED', 'ARCHIVED'
    )),
  canonical_copy TEXT NOT NULL DEFAULT '',
  approval_level SMALLINT NOT NULL DEFAULT 1 CHECK (approval_level BETWEEN 0 AND 4),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  CONSTRAINT marketing_content_campaign_same_org_fk
    FOREIGN KEY (campaign_id, organization_id)
    REFERENCES public.marketing_campaigns(id, organization_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS marketing_content_items_org_status_idx
  ON public.marketing_content_items(organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketing_content_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL,
  channel_account_id UUID,
  format TEXT NOT NULL DEFAULT 'post',
  copy TEXT NOT NULL DEFAULT '',
  media_spec JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  CONSTRAINT marketing_variants_content_same_org_fk
    FOREIGN KEY (content_item_id, organization_id)
    REFERENCES public.marketing_content_items(id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT marketing_variants_account_same_org_fk
    FOREIGN KEY (channel_account_id, organization_id)
    REFERENCES public.channel_accounts(id, organization_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS marketing_content_variants_item_idx
  ON public.marketing_content_variants(content_item_id);

CREATE TABLE IF NOT EXISTS public.marketing_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_item_id UUID,
  asset_kind TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  checksum TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  CONSTRAINT marketing_assets_content_same_org_fk
    FOREIGN KEY (content_item_id, organization_id)
    REFERENCES public.marketing_content_items(id, organization_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS marketing_media_assets_org_idx
  ON public.marketing_media_assets(organization_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Publication lifecycle + attempts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL,
  variant_id UUID,
  channel_account_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN (
      'DRAFT', 'GENERATING', 'REVIEW', 'APPROVED', 'SCHEDULED',
      'PROCESSING', 'PUBLISHED', 'PARTIAL_FAILURE', 'FAILED', 'ARCHIVED'
    )),
  approval_level SMALLINT NOT NULL DEFAULT 2 CHECK (approval_level BETWEEN 0 AND 4),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_post_id TEXT,
  external_url TEXT,
  idempotency_key TEXT NOT NULL,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, idempotency_key),
  CONSTRAINT marketing_publications_content_same_org_fk
    FOREIGN KEY (content_item_id, organization_id)
    REFERENCES public.marketing_content_items(id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT marketing_publications_variant_same_org_fk
    FOREIGN KEY (variant_id, organization_id)
    REFERENCES public.marketing_content_variants(id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT marketing_publications_account_same_org_fk
    FOREIGN KEY (channel_account_id, organization_id)
    REFERENCES public.channel_accounts(id, organization_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS marketing_publications_schedule_idx
  ON public.marketing_publications(status, scheduled_at)
  WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS marketing_publications_org_status_idx
  ON public.marketing_publications(organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketing_publication_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL,
  attempt_no INTEGER NOT NULL CHECK (attempt_no > 0),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'succeeded', 'failed')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  provider_response JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (publication_id, attempt_no),
  CONSTRAINT marketing_attempts_publication_same_org_fk
    FOREIGN KEY (publication_id, organization_id)
    REFERENCES public.marketing_publications(id, organization_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS marketing_publication_attempts_org_idx
  ON public.marketing_publication_attempts(organization_id, publication_id, attempt_no DESC);

-- ---------------------------------------------------------------------------
-- Normalized analytics facts. Service-side ingestion owns writes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel_account_id UUID,
  campaign_id UUID,
  publication_id UUID,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(24,6) NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'channel_api',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT marketing_metrics_account_same_org_fk
    FOREIGN KEY (channel_account_id, organization_id)
    REFERENCES public.channel_accounts(id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT marketing_metrics_campaign_same_org_fk
    FOREIGN KEY (campaign_id, organization_id)
    REFERENCES public.marketing_campaigns(id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT marketing_metrics_publication_same_org_fk
    FOREIGN KEY (publication_id, organization_id)
    REFERENCES public.marketing_publications(id, organization_id)
    ON DELETE CASCADE,
  CHECK (channel_account_id IS NOT NULL OR campaign_id IS NOT NULL OR publication_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS marketing_metric_snapshots_org_observed_idx
  ON public.marketing_metric_snapshots(organization_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS marketing_metric_snapshots_publication_idx
  ON public.marketing_metric_snapshots(publication_id, metric_name, observed_at DESC);

-- ---------------------------------------------------------------------------
-- RLS helpers: read is permission-gated; writes are explicitly separated by risk.
-- No authenticated DELETE policies: archive/disconnect instead of hard deletion.
-- Attempts + metric ingestion have no authenticated write policy and remain server/service-role only.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'business_profiles', 'brand_profiles', 'business_goals',
    'channel_connections', 'channel_accounts',
    'marketing_campaigns', 'marketing_content_items', 'marketing_content_variants',
    'marketing_media_assets', 'marketing_publications',
    'marketing_publication_attempts', 'marketing_metric_snapshots'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_marketing', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.has_permission(organization_id, ''marketing.read'') OR private.has_permission(organization_id, ''org.manage''))',
      t || '_select_marketing', t
    );
  END LOOP;
END $$;

-- Business DNA + campaign/content authoring.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'business_profiles', 'brand_profiles', 'business_goals',
    'marketing_campaigns', 'marketing_content_items', 'marketing_content_variants',
    'marketing_media_assets'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert_manage', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_permission(organization_id, ''marketing.manage'') OR private.has_permission(organization_id, ''org.manage''))',
      t || '_insert_manage', t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update_manage', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.has_permission(organization_id, ''marketing.manage'') OR private.has_permission(organization_id, ''org.manage'')) WITH CHECK (private.has_permission(organization_id, ''marketing.manage'') OR private.has_permission(organization_id, ''org.manage''))',
      t || '_update_manage', t
    );
  END LOOP;
END $$;

-- OAuth/channel configuration is higher-risk than ordinary content authoring.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['channel_connections', 'channel_accounts']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert_channels_manage', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_permission(organization_id, ''marketing.channels.manage'') OR private.has_permission(organization_id, ''org.manage''))',
      t || '_insert_channels_manage', t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update_channels_manage', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.has_permission(organization_id, ''marketing.channels.manage'') OR private.has_permission(organization_id, ''org.manage'')) WITH CHECK (private.has_permission(organization_id, ''marketing.channels.manage'') OR private.has_permission(organization_id, ''org.manage''))',
      t || '_update_channels_manage', t
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS marketing_publications_insert_publish ON public.marketing_publications;
CREATE POLICY marketing_publications_insert_publish
  ON public.marketing_publications FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'marketing.publish')
    OR private.has_permission(organization_id, 'org.manage')
  );

DROP POLICY IF EXISTS marketing_publications_update_publish ON public.marketing_publications;
CREATE POLICY marketing_publications_update_publish
  ON public.marketing_publications FOR UPDATE TO authenticated
  USING (
    private.has_permission(organization_id, 'marketing.publish')
    OR private.has_permission(organization_id, 'org.manage')
  )
  WITH CHECK (
    private.has_permission(organization_id, 'marketing.publish')
    OR private.has_permission(organization_id, 'org.manage')
  );

COMMENT ON TABLE public.channel_connections IS
  'Marketing OS provider connections. credential_ref is a secret-store handle; never persist OAuth access/refresh tokens in this table.';
COMMENT ON TABLE public.marketing_publications IS
  'Per-channel execution records with explicit lifecycle state and organization-scoped idempotency.';
COMMENT ON TABLE public.marketing_metric_snapshots IS
  'Normalized immutable-ish marketing metric observations ingested by server-side workers.';
