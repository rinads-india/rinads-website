-- Company OS (issue #127) — 6/7: Studio production pipeline, creative-asset provenance,
-- Growth campaigns / multi-channel content, and Ads performance. Additive only.
--   studio / assets:  SELECT studio.read · WRITE studio.manage
--   growth / ads:     SELECT growth.read · WRITE growth.manage
-- High-risk transitions are evidenced by an approved ledger row:
--   publishing (content.publish) and ad budget changes (ads.budget_change).

-- ---------------------------------------------------------------------------
-- Studio
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.growth_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id uuid,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  objective text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  channels text[] NOT NULL DEFAULT '{}',
  budget numeric(14, 2) CHECK (budget IS NULL OR budget >= 0),
  currency text NOT NULL DEFAULT 'INR',
  start_date date,
  end_date date,
  owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.cos_companies (organization_id, id)
);
CREATE INDEX IF NOT EXISTS growth_campaigns_org_status_idx ON public.growth_campaigns (organization_id, status);

CREATE TABLE IF NOT EXISTS public.studio_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id uuid,
  campaign_id uuid,
  project_id uuid,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  stage text NOT NULL DEFAULT 'request' CHECK (stage IN (
    'request', 'brief', 'strategy', 'creative_direction', 'copy_script', 'storyboard', 'design', 'image',
    'video', 'animation', 'vfx', 'audio_voice', 'edit', 'qa', 'approval', 'master', 'variants', 'publish', 'performance'
  )),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  brief jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(brief) = 'object'),
  brief_complete boolean NOT NULL DEFAULT false,
  completed_stages text[] NOT NULL DEFAULT '{}',
  qa_passed boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  client_facing boolean NOT NULL DEFAULT true,
  owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  due_date date,
  stage_entered_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.cos_companies (organization_id, id),
  FOREIGN KEY (organization_id, campaign_id) REFERENCES public.growth_campaigns (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES public.cos_projects (organization_id, id)
);
CREATE INDEX IF NOT EXISTS studio_jobs_org_status_stage_idx ON public.studio_jobs (organization_id, status, stage);

CREATE TABLE IF NOT EXISTS public.creative_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  studio_job_id uuid,
  company_id uuid,
  campaign_id uuid,
  project_id uuid,
  parent_asset_id uuid,
  kind text NOT NULL CHECK (kind IN ('image', 'video', 'audio', 'voice', 'animation', 'vfx', 'design', 'copy', 'script', 'storyboard', 'document')),
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  role text NOT NULL DEFAULT 'working' CHECK (role IN ('working', 'master', 'variant')),
  creator_kind text NOT NULL CHECK (creator_kind IN ('human', 'ai', 'hybrid')),
  creator_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ai_provider text,
  ai_model text,
  -- Reference to the stored prompt/version; never the secret prompt text itself.
  prompt_ref text,
  source_kind text NOT NULL DEFAULT 'original' CHECK (source_kind IN ('original', 'client_supplied', 'stock', 'ai_generated', 'third_party')),
  license_terms text,
  license_ref text,
  approval_status text NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  approved_at timestamptz,
  channel text,
  storage_path text,
  checksum text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, studio_job_id) REFERENCES public.studio_jobs (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.cos_companies (organization_id, id),
  FOREIGN KEY (organization_id, campaign_id) REFERENCES public.growth_campaigns (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES public.cos_projects (organization_id, id),
  FOREIGN KEY (organization_id, parent_asset_id) REFERENCES public.creative_assets (organization_id, id),
  CHECK (parent_asset_id IS NULL OR parent_asset_id <> id),
  -- Provenance is a database invariant, not a UI hint:
  CHECK (creator_kind = 'human' OR (ai_provider IS NOT NULL AND ai_model IS NOT NULL)),
  CHECK (source_kind = 'original' OR license_terms IS NOT NULL OR license_ref IS NOT NULL),
  CHECK (role <> 'variant' OR (parent_asset_id IS NOT NULL AND channel IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS creative_assets_org_job_idx ON public.creative_assets (organization_id, studio_job_id);
CREATE INDEX IF NOT EXISTS creative_assets_org_parent_idx ON public.creative_assets (organization_id, parent_asset_id);

-- ---------------------------------------------------------------------------
-- Growth content + publications + performance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id uuid,
  -- All channel variants of one idea share source_idea_id (the root item's own id).
  source_idea_id uuid NOT NULL,
  asset_id uuid,
  channel text NOT NULL CHECK (channel IN (
    'web', 'blog', 'youtube', 'youtube_shorts', 'instagram', 'facebook', 'linkedin', 'x', 'whatsapp', 'email', 'google_business', 'paid_ads'
  )),
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'drafting', 'in_review', 'approved', 'scheduled', 'published', 'archived')),
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  body_ref text,
  scheduled_at timestamptz,
  published_at timestamptz,
  external_url text,
  -- Approved content.publish ledger row; mandatory once published.
  publish_action_id uuid,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, campaign_id) REFERENCES public.growth_campaigns (organization_id, id),
  FOREIGN KEY (organization_id, asset_id) REFERENCES public.creative_assets (organization_id, id)
);
CREATE INDEX IF NOT EXISTS content_items_org_idea_idx ON public.content_items (organization_id, source_idea_id);
CREATE INDEX IF NOT EXISTS content_items_org_status_idx ON public.content_items (organization_id, status);

CREATE TABLE IF NOT EXISTS public.asset_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  asset_id uuid NOT NULL,
  content_item_id uuid,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('scheduled', 'published', 'failed', 'retracted')),
  published_at timestamptz,
  external_url text,
  approved_action_id uuid NOT NULL,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, asset_id) REFERENCES public.creative_assets (organization_id, id),
  FOREIGN KEY (organization_id, content_item_id) REFERENCES public.content_items (organization_id, id)
);
CREATE INDEX IF NOT EXISTS asset_publications_org_asset_idx ON public.asset_publications (organization_id, asset_id);

CREATE TABLE IF NOT EXISTS public.asset_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  asset_id uuid,
  publication_id uuid,
  metric_date date NOT NULL,
  impressions bigint NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  views bigint NOT NULL DEFAULT 0 CHECK (views >= 0),
  clicks bigint NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions bigint NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  spend numeric(14, 2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
  engagement jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'provider_api')),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, asset_id) REFERENCES public.creative_assets (organization_id, id),
  FOREIGN KEY (organization_id, publication_id) REFERENCES public.asset_publications (organization_id, id),
  CHECK (asset_id IS NOT NULL OR publication_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS asset_performance_unique_day ON public.asset_performance (organization_id, coalesce(publication_id, asset_id), metric_date, source);

-- ---------------------------------------------------------------------------
-- Ads (provider-neutral; metrics arrive via official API adapters or governed import)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id uuid,
  platform text NOT NULL CHECK (platform IN ('meta', 'google', 'youtube', 'linkedin', 'x', 'other')),
  external_id text,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  objective text,
  landing_page text,
  daily_budget numeric(14, 2) CHECK (daily_budget IS NULL OR daily_budget >= 0),
  currency text NOT NULL DEFAULT 'INR',
  -- Approved ads.budget_change ledger row for the CURRENT budget value.
  budget_action_id uuid,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, campaign_id) REFERENCES public.growth_campaigns (organization_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ad_campaigns_org_platform_ext_uniq ON public.ad_campaigns (organization_id, platform, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ad_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  ad_campaign_id uuid NOT NULL,
  ad_id text NOT NULL,
  ad_name text NOT NULL,
  metric_date date NOT NULL,
  spend numeric(14, 2) NOT NULL DEFAULT 0 CHECK (spend >= 0),
  impressions bigint NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks bigint NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions bigint NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  frequency numeric(6, 2),
  hook text,
  audience text,
  landing_page text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'provider_api')),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, ad_campaign_id) REFERENCES public.ad_campaigns (organization_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS ad_metrics_daily_unique ON public.ad_metrics_daily (organization_id, ad_campaign_id, ad_id, metric_date, source);

-- An ad budget may only change together with a fresh, approved ads.budget_change action.
-- (Lookup is inlined: PL/pgSQL cannot call schema "private" as an end-user role.)
CREATE OR REPLACE FUNCTION private.company_os_guard_ad_budget()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.daily_budget IS NOT NULL AND NEW.daily_budget > 0 AND NEW.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM public.rinpo_actions a
         WHERE a.id = NEW.budget_action_id AND a.organization_id = NEW.organization_id
           AND a.action_type = 'ads.budget_change' AND a.source_domain = 'company-os'
           AND a.status IN ('approved', 'executed') AND a.approved_by IS NOT NULL
       ) THEN
      RAISE EXCEPTION 'an active ad with a budget requires an approved ads.budget_change action' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.daily_budget IS DISTINCT FROM OLD.daily_budget THEN
    IF NEW.budget_action_id IS NOT DISTINCT FROM OLD.budget_action_id
       OR NOT EXISTS (
         SELECT 1 FROM public.rinpo_actions a
         WHERE a.id = NEW.budget_action_id AND a.organization_id = NEW.organization_id
           AND a.action_type = 'ads.budget_change' AND a.source_domain = 'company-os'
           AND a.status IN ('approved', 'executed') AND a.approved_by IS NOT NULL
       ) THEN
      RAISE EXCEPTION 'changing an ad budget requires a new approved ads.budget_change action' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.company_os_guard_ad_budget() FROM PUBLIC, anon;
DROP TRIGGER IF EXISTS company_os_guard_ad_budget ON public.ad_campaigns;
CREATE TRIGGER company_os_guard_ad_budget
  BEFORE INSERT OR UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION private.company_os_guard_ad_budget();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.growth_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_metrics_daily ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['studio_jobs', 'creative_assets']
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, %L))',
      'cos_' || t || '_select', t, 'studio.read');
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_permission(organization_id, %L) AND created_by = auth.uid())',
      'cos_' || t || '_insert', t, 'studio.manage');
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.has_permission(organization_id, %L)) WITH CHECK (private.has_permission(organization_id, %L))',
      'cos_' || t || '_update', t, 'studio.manage', 'studio.manage');
  END LOOP;

  FOREACH t IN ARRAY ARRAY['growth_campaigns', 'ad_metrics_daily', 'asset_performance']
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, %L))',
      'cos_' || t || '_select', t, 'growth.read');
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_permission(organization_id, %L) AND created_by = auth.uid())',
      'cos_' || t || '_insert', t, 'growth.manage');
  END LOOP;
END $$;

CREATE POLICY cos_growth_campaigns_update ON public.growth_campaigns
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'growth.manage'))
  WITH CHECK (private.has_permission(organization_id, 'growth.manage'));

-- Content: published content must carry an approved content.publish action.
CREATE POLICY cos_content_items_select ON public.content_items
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'growth.read'));
CREATE POLICY cos_content_items_insert ON public.content_items
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'growth.manage')
    AND created_by = auth.uid()
    AND (status <> 'published' OR private.company_os_is_approved_action(organization_id, publish_action_id, 'content.publish'))
  );
CREATE POLICY cos_content_items_update ON public.content_items
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'growth.manage'))
  WITH CHECK (
    private.has_permission(organization_id, 'growth.manage')
    AND (status <> 'published' OR private.company_os_is_approved_action(organization_id, publish_action_id, 'content.publish'))
  );

-- Publications exist only as the result of an approved publish; they are immutable.
CREATE POLICY cos_asset_publications_select ON public.asset_publications
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND (private.has_permission(organization_id, 'studio.read') OR private.has_permission(organization_id, 'growth.read')));
CREATE POLICY cos_asset_publications_insert ON public.asset_publications
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'growth.manage')
    AND created_by = auth.uid()
    AND private.company_os_is_approved_action(organization_id, approved_action_id, 'content.publish')
  );

-- Ads: budget changes are additionally guarded by the trigger above.
CREATE POLICY cos_ad_campaigns_select ON public.ad_campaigns
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'growth.read'));
CREATE POLICY cos_ad_campaigns_insert ON public.ad_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'growth.manage') AND created_by = auth.uid());
CREATE POLICY cos_ad_campaigns_update ON public.ad_campaigns
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'growth.manage'))
  WITH CHECK (private.has_permission(organization_id, 'growth.manage'));

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'growth_campaigns', 'studio_jobs', 'creative_assets', 'content_items', 'asset_publications',
    'asset_performance', 'ad_campaigns', 'ad_metrics_daily'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', t);
  END LOOP;
  -- Append-only facts: no UPDATE privilege for end users.
  REVOKE UPDATE ON public.asset_publications FROM authenticated;
  REVOKE UPDATE ON public.asset_performance FROM authenticated;
  REVOKE UPDATE ON public.ad_metrics_daily FROM authenticated;
  FOREACH t IN ARRAY ARRAY['growth_campaigns', 'studio_jobs', 'creative_assets', 'content_items', 'ad_campaigns']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'cos_' || t || '_touch', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.company_os_touch_updated_at()', 'cos_' || t || '_touch', t);
  END LOOP;
END $$;
