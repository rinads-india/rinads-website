-- PR-K2: additive Workspace + shared Location foundation
--
-- Organization remains the tenant boundary. Workspace adds optional business-unit /
-- operating-context scope; locations add a shared physical/operational site model.
-- Existing inventory_locations and salon branch tables remain untouched in this phase.

-- ---------------------------------------------------------------------------
-- Workspaces
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'default' CHECK (kind IN (
    'default', 'business_unit', 'brand', 'department', 'channel', 'project', 'other'
  )),
  is_default BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug),
  UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_org_status
  ON public.workspaces(organization_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_one_default_per_org
  ON public.workspaces(organization_id)
  WHERE is_default = true;

-- Backfill exactly one default workspace for every existing organization.
INSERT INTO public.workspaces (
  organization_id,
  name,
  slug,
  kind,
  is_default,
  status
)
SELECT
  o.id,
  o.name,
  'default',
  'default',
  true,
  'active'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1
  FROM public.workspaces w
  WHERE w.organization_id = o.id
    AND w.is_default = true
)
AND NOT EXISTS (
  SELECT 1
  FROM public.workspaces w
  WHERE w.organization_id = o.id
    AND w.slug = 'default'
);

-- Every future organization receives a default workspace automatically.
CREATE OR REPLACE FUNCTION private.create_default_workspace_for_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  INSERT INTO public.workspaces (
    organization_id,
    name,
    slug,
    kind,
    is_default,
    status
  )
  VALUES (
    NEW.id,
    NEW.name,
    'default',
    'default',
    true,
    'active'
  )
  ON CONFLICT (organization_id, slug) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.create_default_workspace_for_org() FROM public;

DROP TRIGGER IF EXISTS organizations_create_default_workspace ON public.organizations;
CREATE TRIGGER organizations_create_default_workspace
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION private.create_default_workspace_for_org();

-- ---------------------------------------------------------------------------
-- Shared platform locations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'physical' CHECK (kind IN (
    'physical', 'branch', 'office', 'warehouse', 'showroom', 'service_area', 'virtual', 'other'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  address JSONB NOT NULL DEFAULT '{}',
  latitude NUMERIC(9,6) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  timezone TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  UNIQUE (id, organization_id),
  CONSTRAINT locations_workspace_same_org_fk
    FOREIGN KEY (workspace_id, organization_id)
    REFERENCES public.workspaces(id, organization_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_locations_org_status
  ON public.locations(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_locations_workspace_status
  ON public.locations(workspace_id, status);

-- ---------------------------------------------------------------------------
-- RLS: organization remains the security boundary.
-- ---------------------------------------------------------------------------

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspaces_select_member ON public.workspaces;
CREATE POLICY workspaces_select_member
  ON public.workspaces FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

DROP POLICY IF EXISTS workspaces_insert_manage ON public.workspaces;
CREATE POLICY workspaces_insert_manage
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

DROP POLICY IF EXISTS workspaces_update_manage ON public.workspaces;
CREATE POLICY workspaces_update_manage
  ON public.workspaces FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (private.has_permission(organization_id, 'org.manage'));

-- No authenticated DELETE policy: archive workspaces instead of hard deleting them.

DROP POLICY IF EXISTS locations_select_member ON public.locations;
CREATE POLICY locations_select_member
  ON public.locations FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

DROP POLICY IF EXISTS locations_insert_manage ON public.locations;
CREATE POLICY locations_insert_manage
  ON public.locations FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'org.manage')
    AND EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_id
        AND w.organization_id = locations.organization_id
    )
  );

DROP POLICY IF EXISTS locations_update_manage ON public.locations;
CREATE POLICY locations_update_manage
  ON public.locations FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'org.manage'))
  WITH CHECK (
    private.has_permission(organization_id, 'org.manage')
    AND EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_id
        AND w.organization_id = locations.organization_id
    )
  );

-- No authenticated DELETE policy: archive shared locations instead of hard deleting them.
