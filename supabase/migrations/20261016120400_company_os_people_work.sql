-- Company OS (issue #127) — 5/7: people capacity and work-allocation decisions.
-- Additive only. Skills / capacity feed explainable ASSIGNMENT RECOMMENDATIONS; they never
-- assign work or make employment decisions — a manager always decides, and overrides are recorded.

CREATE TABLE IF NOT EXISTS public.people_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  -- Null for external collaborators who have no login.
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  display_name text NOT NULL CHECK (length(btrim(display_name)) > 0),
  role_title text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  -- skill key → level 1..5, e.g. {"design": 4, "motion": 2}
  skills jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(skills) = 'object'),
  weekly_capacity_hours numeric(5, 1) CHECK (weekly_capacity_hours IS NULL OR weekly_capacity_hours BETWEEN 0 AND 168),
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS people_profiles_org_user_uniq ON public.people_profiles (organization_id, user_id) WHERE user_id IS NOT NULL;

-- Append-only record of each assignment decision: what was recommended, what the manager chose,
-- and why they overrode it (required when they did).
CREATE TABLE IF NOT EXISTS public.work_assignment_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  recommended_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  chosen_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  followed_recommendation boolean NOT NULL,
  override_reason text,
  confidence text CHECK (confidence IN ('high', 'medium', 'low')),
  factor_snapshot jsonb,
  decided_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, task_id) REFERENCES public.operational_tasks (organization_id, id),
  CHECK (followed_recommendation OR length(btrim(coalesce(override_reason, ''))) > 0)
);
CREATE INDEX IF NOT EXISTS work_assignment_decisions_org_task_idx ON public.work_assignment_decisions (organization_id, task_id, created_at DESC);

ALTER TABLE public.people_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_assignment_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cos_people_profiles_select ON public.people_profiles
  FOR SELECT TO authenticated
  USING (
    private.is_org_member(organization_id)
    AND (private.has_permission(organization_id, 'people.read') OR user_id = auth.uid())
  );
CREATE POLICY cos_people_profiles_insert ON public.people_profiles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'people.manage') AND created_by = auth.uid());
CREATE POLICY cos_people_profiles_update ON public.people_profiles
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'people.manage'))
  WITH CHECK (private.has_permission(organization_id, 'people.manage'));

CREATE POLICY cos_work_assignment_decisions_select ON public.work_assignment_decisions
  FOR SELECT TO authenticated
  USING (
    private.is_org_member(organization_id)
    AND (private.has_permission(organization_id, 'people.read') OR private.has_permission(organization_id, 'projects.read'))
  );
CREATE POLICY cos_work_assignment_decisions_insert ON public.work_assignment_decisions
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'projects.manage') AND decided_by = auth.uid());

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['people_profiles', 'work_assignment_decisions']
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', t);
  END LOOP;
  REVOKE UPDATE ON public.work_assignment_decisions FROM authenticated;
  DROP TRIGGER IF EXISTS cos_people_profiles_touch ON public.people_profiles;
  CREATE TRIGGER cos_people_profiles_touch BEFORE UPDATE ON public.people_profiles
    FOR EACH ROW EXECUTE FUNCTION private.company_os_touch_updated_at();
END $$;
