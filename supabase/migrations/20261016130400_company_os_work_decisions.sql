-- Company OS (issue #127) — 5/7: work-allocation decisions.
-- Additive only. Skills / capacity (cos_workers.skill_levels, available_hours_week) feed explainable
-- ASSIGNMENT RECOMMENDATIONS; they never assign work or make employment decisions — a manager always
-- decides, and overrides are recorded here (append-only) with the reason.

CREATE TABLE IF NOT EXISTS public.work_assignment_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  recommended_worker_id uuid,
  chosen_worker_id uuid NOT NULL,
  followed_recommendation boolean NOT NULL,
  override_reason text,
  confidence text CHECK (confidence IN ('high', 'medium', 'low')),
  factor_snapshot jsonb,
  decided_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, task_id) REFERENCES public.cos_tasks (organization_id, id),
  FOREIGN KEY (organization_id, recommended_worker_id) REFERENCES public.cos_workers (organization_id, id),
  FOREIGN KEY (organization_id, chosen_worker_id) REFERENCES public.cos_workers (organization_id, id),
  CHECK (followed_recommendation OR length(btrim(coalesce(override_reason, ''))) > 0)
);
CREATE INDEX IF NOT EXISTS work_assignment_decisions_org_task_idx ON public.work_assignment_decisions (organization_id, task_id, created_at DESC);

ALTER TABLE public.work_assignment_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cos_work_assignment_decisions_select ON public.work_assignment_decisions
  FOR SELECT TO authenticated
  USING (
    private.is_org_member(organization_id)
    AND (private.has_permission(organization_id, 'people.read') OR private.has_permission(organization_id, 'work.read'))
  );
CREATE POLICY cos_work_assignment_decisions_insert ON public.work_assignment_decisions
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'work.write') AND decided_by = auth.uid());

REVOKE ALL ON public.work_assignment_decisions FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER, UPDATE ON public.work_assignment_decisions FROM authenticated;
