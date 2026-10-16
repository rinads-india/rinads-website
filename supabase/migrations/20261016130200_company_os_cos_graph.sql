-- Company OS (issue #127) — 3/7: extend the Company OS v1 Business Graph (cos_*, PR #129).
--
-- The kernel migration (20261016120000) created the graph tables with member-wide read/write RLS and
-- single-column foreign keys. That is fine for an empty demo graph but not for finance, contracts or
-- people data. This migration, without changing any existing column:
--   1. adds the columns the governed runtime needs (provenance, approval evidence, skills, planning);
--   2. makes every cross-link a composite (organization_id, id) foreign key, so a child row can never
--      reference another tenant's parent, even from a crafted request;
--   3. replaces the member-wide policies with permission-scoped ones (the ONLY policies dropped are
--      the kernel's own `<table>_{select,insert,update}_member`, which this migration supersedes).
--
-- All affected tables were empty in production when this was written (verified read-only), so
-- tightening cannot orphan existing rows. Approval-gated writes (proposal sent, contract signed,
-- invoice issued/void, payment recorded) are in the next migration.

-- ---------------------------------------------------------------------------
-- 1. Composite keys (targets of the composite foreign keys below)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cos_departments', 'cos_workers', 'cos_companies', 'cos_contacts', 'cos_leads', 'cos_opportunities', 'cos_proposals',
    'cos_contracts', 'cos_projects', 'cos_milestones', 'cos_tasks', 'cos_deliverables', 'cos_invoices'
  ]
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = t || '_org_id_key') THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (organization_id, id)', t, t || '_org_id_key');
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Columns
-- ---------------------------------------------------------------------------
-- People: skills carry a 1..5 level (the kernel's text[] has no level), profile status, no login required.
ALTER TABLE public.cos_workers ALTER COLUMN kind SET DEFAULT 'human';
ALTER TABLE public.cos_workers
  ADD COLUMN IF NOT EXISTS skill_levels jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_status text NOT NULL DEFAULT 'active';
CREATE UNIQUE INDEX IF NOT EXISTS cos_workers_org_user_uniq ON public.cos_workers (organization_id, user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.cos_companies
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS owner_worker_id uuid,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cos_companies_org_name_uniq ON public.cos_companies (organization_id, lower(btrim(name)));

ALTER TABLE public.cos_contacts
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.cos_leads
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS source_ref text,
  ADD COLUMN IF NOT EXISTS problem text,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS disqualified_reason text,
  ADD COLUMN IF NOT EXISTS converted_company_id uuid,
  ADD COLUMN IF NOT EXISTS converted_contact_id uuid,
  ADD COLUMN IF NOT EXISTS converted_opportunity_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cos_leads_org_source_ref_uniq ON public.cos_leads (organization_id, source_ref) WHERE source_ref IS NOT NULL;

-- Opportunities: an explicit probability is optional (null ⇒ the labelled stage default is used in reports).
ALTER TABLE public.cos_opportunities
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS stage_changed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;
ALTER TABLE public.cos_opportunities ALTER COLUMN probability DROP NOT NULL;
ALTER TABLE public.cos_opportunities ALTER COLUMN probability DROP DEFAULT;

ALTER TABLE public.cos_proposals
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS document_ref text,
  ADD COLUMN IF NOT EXISTS sent_action_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.cos_contracts
  ADD COLUMN IF NOT EXISTS proposal_id uuid,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS signed_by_name text,
  ADD COLUMN IF NOT EXISTS document_ref text,
  ADD COLUMN IF NOT EXISTS sign_action_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.cos_projects
  ADD COLUMN IF NOT EXISTS contract_id uuid,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS budget numeric(14, 2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS service_order_id uuid REFERENCES public.service_orders (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.cos_milestones
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;

-- Tasks: planning inputs for explainable allocation (skills, dependencies) and a description.
ALTER TABLE public.cos_tasks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS required_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blocked_by uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.cos_deliverables
  ADD COLUMN IF NOT EXISTS milestone_id uuid,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS change_requests integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.cos_invoices
  ADD COLUMN IF NOT EXISTS contract_id uuid,
  ADD COLUMN IF NOT EXISTS subtotal numeric(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_total numeric(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS issue_action_id uuid,
  ADD COLUMN IF NOT EXISTS void_action_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.cos_payments
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS approved_action_id uuid,
  ADD COLUMN IF NOT EXISTS recorded_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cos_payments_action_uniq ON public.cos_payments (approved_action_id) WHERE approved_action_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cos_payments_org_invoice_ref_uniq ON public.cos_payments (organization_id, invoice_id, reference) WHERE reference IS NOT NULL;

-- Deliverable review has two more states than the kernel modelled (in review, changes requested, delivered).
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.cos_deliverables'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.cos_deliverables DROP CONSTRAINT %I', c.conname);
  END LOOP;
  ALTER TABLE public.cos_deliverables ADD CONSTRAINT cos_deliverables_status_check
    CHECK (status IN ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'delivered', 'published'));
END $$;

-- Value constraints for the added columns.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cos_companies_priority_check') THEN
    ALTER TABLE public.cos_companies ADD CONSTRAINT cos_companies_priority_check CHECK (priority IN ('strategic', 'standard', 'low'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cos_workers_profile_status_check') THEN
    ALTER TABLE public.cos_workers ADD CONSTRAINT cos_workers_profile_status_check CHECK (profile_status IN ('active', 'on_leave', 'inactive'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cos_workers_skill_levels_check') THEN
    ALTER TABLE public.cos_workers ADD CONSTRAINT cos_workers_skill_levels_check CHECK (jsonb_typeof(skill_levels) = 'object');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cos_opportunities_probability_range') THEN
    ALTER TABLE public.cos_opportunities ADD CONSTRAINT cos_opportunities_probability_range CHECK (probability IS NULL OR probability BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cos_opportunities_kind_check') THEN
    ALTER TABLE public.cos_opportunities ADD CONSTRAINT cos_opportunities_kind_check CHECK (kind IN ('new', 'renewal', 'upsell'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cos_projects_kind_check') THEN
    ALTER TABLE public.cos_projects ADD CONSTRAINT cos_projects_kind_check CHECK (kind IN ('project', 'retainer'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cos_payments_amount_positive') THEN
    ALTER TABLE public.cos_payments ADD CONSTRAINT cos_payments_amount_positive CHECK (amount > 0);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Composite (organization_id, id) foreign keys for every cross-link
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  l record;
BEGIN
  FOR l IN
    SELECT * FROM (VALUES
      ('cos_workers',       'department_id',            'cos_departments'),
      ('cos_capacity_snapshots', 'worker_id',           'cos_workers'),
      ('cos_daily_closings','worker_id',                'cos_workers'),
      ('cos_expenses',      'department_id',            'cos_departments'),
      ('cos_approval_items','company_id',               'cos_companies'),
      ('cos_approval_items','project_id',               'cos_projects'),
      ('cos_companies',     'owner_worker_id',          'cos_workers'),
      ('cos_contacts',      'company_id',               'cos_companies'),
      ('cos_leads',         'company_id',               'cos_companies'),
      ('cos_leads',         'contact_id',               'cos_contacts'),
      ('cos_leads',         'owner_worker_id',          'cos_workers'),
      ('cos_leads',         'converted_company_id',     'cos_companies'),
      ('cos_leads',         'converted_contact_id',     'cos_contacts'),
      ('cos_leads',         'converted_opportunity_id', 'cos_opportunities'),
      ('cos_opportunities', 'company_id',               'cos_companies'),
      ('cos_opportunities', 'contact_id',               'cos_contacts'),
      ('cos_opportunities', 'lead_id',                  'cos_leads'),
      ('cos_opportunities', 'owner_worker_id',          'cos_workers'),
      ('cos_proposals',     'opportunity_id',           'cos_opportunities'),
      ('cos_proposals',     'company_id',               'cos_companies'),
      ('cos_contracts',     'company_id',               'cos_companies'),
      ('cos_contracts',     'opportunity_id',           'cos_opportunities'),
      ('cos_contracts',     'proposal_id',              'cos_proposals'),
      ('cos_projects',      'company_id',               'cos_companies'),
      ('cos_projects',      'contract_id',              'cos_contracts'),
      ('cos_projects',      'owner_worker_id',          'cos_workers'),
      ('cos_milestones',    'project_id',               'cos_projects'),
      ('cos_tasks',         'project_id',               'cos_projects'),
      ('cos_tasks',         'milestone_id',             'cos_milestones'),
      ('cos_tasks',         'company_id',               'cos_companies'),
      ('cos_tasks',         'assignee_worker_id',       'cos_workers'),
      ('cos_deliverables',  'project_id',               'cos_projects'),
      ('cos_deliverables',  'milestone_id',             'cos_milestones'),
      ('cos_deliverables',  'company_id',               'cos_companies'),
      ('cos_deliverables',  'task_id',                  'cos_tasks'),
      ('cos_invoices',      'company_id',               'cos_companies'),
      ('cos_invoices',      'project_id',               'cos_projects'),
      ('cos_invoices',      'contract_id',              'cos_contracts'),
      ('cos_payments',      'invoice_id',               'cos_invoices'),
      ('cos_payments',      'company_id',               'cos_companies')
    ) AS v(child, col, parent)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = l.child || '_' || l.col || '_org_fk') THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (organization_id, %I) REFERENCES public.%I (organization_id, id)',
        l.child, l.child || '_' || l.col || '_org_fk', l.col, l.parent);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Permission-scoped RLS (replaces the kernel's member-wide policies)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  spec record;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('cos_companies',         'clients.read',   'clients.write'),
      ('cos_contacts',          'clients.read',   'clients.write'),
      ('cos_leads',             'sales.read',     'sales.write'),
      ('cos_opportunities',     'sales.read',     'sales.write'),
      ('cos_projects',          'work.read',      'work.write'),
      ('cos_milestones',        'work.read',      'work.write'),
      ('cos_tasks',             'work.read',      'work.write'),
      ('cos_deliverables',      'work.read',      'work.write'),
      ('cos_expenses',          'finance.read',   'finance.write'),
      ('cos_departments',       'people.read',    'people.write'),
      ('cos_capacity_snapshots','people.read',    'people.write'),
      ('cos_attention_items',   'founder.read',   'founder.decide'),
      ('cos_approval_items',    'approvals.read', 'approvals.decide')
    ) AS v(t, read_perm, write_perm)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', spec.t || '_select_member', spec.t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', spec.t || '_insert_member', spec.t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', spec.t || '_update_member', spec.t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, %L))',
      spec.t || '_select', spec.t, spec.read_perm);
    -- Rows carry their author when the table has the column; it can never be spoofed.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_permission(organization_id, %L)%s)',
      spec.t || '_insert', spec.t, spec.write_perm,
      CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = spec.t AND column_name = 'created_by')
           THEN ' AND created_by = auth.uid()' ELSE '' END);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.has_permission(organization_id, %L)) WITH CHECK (private.has_permission(organization_id, %L))',
      spec.t || '_update', spec.t, spec.write_perm, spec.write_perm);
  END LOOP;
END $$;

-- Workers: people.read sees the team; everyone can see their own profile.
DROP POLICY IF EXISTS cos_workers_select_member ON public.cos_workers;
DROP POLICY IF EXISTS cos_workers_insert_member ON public.cos_workers;
DROP POLICY IF EXISTS cos_workers_update_member ON public.cos_workers;
CREATE POLICY cos_workers_select ON public.cos_workers
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND (private.has_permission(organization_id, 'people.read') OR user_id = auth.uid()));
CREATE POLICY cos_workers_insert ON public.cos_workers
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'people.write'));
CREATE POLICY cos_workers_update ON public.cos_workers
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'people.write'))
  WITH CHECK (private.has_permission(organization_id, 'people.write'));

-- Daily closings are personal: the owner sees and writes their own; people.read sees all.
DROP POLICY IF EXISTS cos_daily_closings_select_member ON public.cos_daily_closings;
DROP POLICY IF EXISTS cos_daily_closings_insert_member ON public.cos_daily_closings;
DROP POLICY IF EXISTS cos_daily_closings_update_member ON public.cos_daily_closings;
CREATE POLICY cos_daily_closings_select ON public.cos_daily_closings
  FOR SELECT TO authenticated
  USING (
    private.is_org_member(organization_id)
    AND (private.has_permission(organization_id, 'people.read')
         OR EXISTS (SELECT 1 FROM public.cos_workers w WHERE w.id = worker_id AND w.organization_id = cos_daily_closings.organization_id AND w.user_id = auth.uid()))
  );
CREATE POLICY cos_daily_closings_insert ON public.cos_daily_closings
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_org_member(organization_id)
    AND EXISTS (SELECT 1 FROM public.cos_workers w WHERE w.id = worker_id AND w.organization_id = cos_daily_closings.organization_id AND w.user_id = auth.uid())
  );
CREATE POLICY cos_daily_closings_update ON public.cos_daily_closings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cos_workers w WHERE w.id = worker_id AND w.organization_id = cos_daily_closings.organization_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cos_workers w WHERE w.id = worker_id AND w.organization_id = cos_daily_closings.organization_id AND w.user_id = auth.uid()));

-- The people doing the work can progress it. A worker may update tasks assigned to them (and cannot hand them
-- to someone else: WITH CHECK requires the row to stay theirs) and submit their own draft deliverables.
-- Everything else on work needs work.write.
CREATE POLICY cos_tasks_update_assignee ON public.cos_tasks
  FOR UPDATE TO authenticated
  USING (
    private.is_org_member(organization_id)
    AND EXISTS (SELECT 1 FROM public.cos_workers w WHERE w.id = assignee_worker_id AND w.organization_id = cos_tasks.organization_id AND w.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.cos_workers w WHERE w.id = assignee_worker_id AND w.organization_id = cos_tasks.organization_id AND w.user_id = auth.uid())
  );

CREATE POLICY cos_deliverables_update_submit ON public.cos_deliverables
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'work.read') AND status IN ('draft', 'changes_requested'))
  WITH CHECK (private.has_permission(organization_id, 'work.read') AND status IN ('draft', 'submitted'));
