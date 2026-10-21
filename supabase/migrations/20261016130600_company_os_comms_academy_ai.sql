-- Company OS (issue #127) — 7/7: communication activity, Academy skill graph, AI run ledger and
-- role profiles. Additive only; deliberate RLS on every table.

-- ---------------------------------------------------------------------------
-- Communication: calls / voice / WhatsApp / email / SMS / web chat linked to work objects.
-- Records activity only — this migration enables NO sending (providers stay off).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('call', 'voice', 'whatsapp', 'email', 'sms', 'web_chat', 'meeting')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status text NOT NULL DEFAULT 'logged' CHECK (status IN ('logged', 'delivered', 'failed', 'missed')),
  subject text,
  summary text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  linked_type text CHECK (linked_type IN ('lead', 'company', 'contact', 'opportunity', 'project', 'ticket', 'order', 'invoice')),
  linked_id uuid,
  external_ref text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((linked_type IS NULL) = (linked_id IS NULL))
);
CREATE INDEX IF NOT EXISTS comm_activities_org_time_idx ON public.comm_activities (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS comm_activities_org_link_idx ON public.comm_activities (organization_id, linked_type, linked_id);
CREATE INDEX IF NOT EXISTS comm_activities_org_failed_idx ON public.comm_activities (organization_id, occurred_at DESC) WHERE status IN ('failed', 'missed');

-- ---------------------------------------------------------------------------
-- Academy: Skill → Learn → Practice → Lab → Supervised work → Evidence → Assessment → Certification.
-- Progress is ADVISORY evidence; it never makes an employment decision.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  skill_key text NOT NULL CHECK (skill_key ~ '^[a-z0-9_]+$'),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  description text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, skill_key)
);

CREATE TABLE IF NOT EXISTS public.academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  skill_id uuid NOT NULL,
  stage text NOT NULL DEFAULT 'learn' CHECK (stage IN ('learn', 'practice', 'lab', 'supervised_work', 'evidence', 'assessment', 'certified')),
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  assessed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  certified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, skill_id),
  FOREIGN KEY (organization_id, skill_id) REFERENCES public.academy_skills (organization_id, id),
  CHECK ((stage = 'certified') = (certified_at IS NOT NULL))
);

-- ---------------------------------------------------------------------------
-- AI: append-only run ledger (provider/model/cost/errors) + per-role configuration.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  agent_role text,
  provider text NOT NULL,
  model text NOT NULL,
  task_kind text NOT NULL,
  sensitivity text NOT NULL DEFAULT 'internal' CHECK (sensitivity IN ('public', 'internal', 'confidential', 'restricted')),
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'blocked')),
  input_tokens integer CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
  -- Null = cost not reported by the provider. Never estimated here.
  cost_usd numeric(12, 6) CHECK (cost_usd IS NULL OR cost_usd >= 0),
  latency_ms integer CHECK (latency_ms IS NULL OR latency_ms >= 0),
  error_class text,
  routing_reason text,
  correlation_id text,
  action_id uuid,
  started_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_runs_org_time_idx ON public.ai_runs (organization_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  role_key text NOT NULL CHECK (role_key ~ '^[a-z_]+$'),
  enabled boolean NOT NULL DEFAULT true,
  -- Empty = let @rinads/intelligence routing decide. Never holds credentials.
  allowed_providers text[] NOT NULL DEFAULT '{}',
  max_sensitivity text NOT NULL DEFAULT 'internal' CHECK (max_sensitivity IN ('public', 'internal', 'confidential', 'restricted')),
  notes text,
  updated_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, role_key)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.comm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY cos_comm_activities_select ON public.comm_activities
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'comms.read'));
CREATE POLICY cos_comm_activities_insert ON public.comm_activities
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'comms.manage') AND created_by = auth.uid());
CREATE POLICY cos_comm_activities_update ON public.comm_activities
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'comms.manage'))
  WITH CHECK (private.has_permission(organization_id, 'comms.manage'));

CREATE POLICY cos_academy_skills_select ON public.academy_skills
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'academy.read'));
CREATE POLICY cos_academy_skills_insert ON public.academy_skills
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'academy.manage') AND created_by = auth.uid());
CREATE POLICY cos_academy_skills_update ON public.academy_skills
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'academy.manage'))
  WITH CHECK (private.has_permission(organization_id, 'academy.manage'));

-- A learner can always see their own progress; managers see everyone's.
CREATE POLICY cos_academy_progress_select ON public.academy_progress
  FOR SELECT TO authenticated
  USING (
    private.is_org_member(organization_id)
    AND (user_id = auth.uid() OR private.has_permission(organization_id, 'academy.read'))
  );
CREATE POLICY cos_academy_progress_insert ON public.academy_progress
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'academy.manage'));
CREATE POLICY cos_academy_progress_update ON public.academy_progress
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'academy.manage'))
  WITH CHECK (private.has_permission(organization_id, 'academy.manage'));

CREATE POLICY cos_ai_runs_select ON public.ai_runs
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND (private.has_permission(organization_id, 'ai.read') OR user_id = auth.uid()));
CREATE POLICY cos_ai_runs_insert ON public.ai_runs
  FOR INSERT TO authenticated
  WITH CHECK (private.is_org_member(organization_id) AND user_id = auth.uid());

CREATE POLICY cos_ai_agent_profiles_select ON public.ai_agent_profiles
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'ai.read'));
CREATE POLICY cos_ai_agent_profiles_insert ON public.ai_agent_profiles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'ai.manage'));
CREATE POLICY cos_ai_agent_profiles_update ON public.ai_agent_profiles
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'ai.manage'))
  WITH CHECK (private.has_permission(organization_id, 'ai.manage'));

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['comm_activities', 'academy_skills', 'academy_progress', 'ai_runs', 'ai_agent_profiles']
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', t);
  END LOOP;
  REVOKE UPDATE ON public.ai_runs FROM authenticated;
  FOREACH t IN ARRAY ARRAY['academy_progress', 'ai_agent_profiles']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'cos_' || t || '_touch', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.company_os_touch_updated_at()', 'cos_' || t || '_touch', t);
  END LOOP;
END $$;
