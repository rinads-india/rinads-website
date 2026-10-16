-- Company OS (issue #127) — 4/7: delivery (projects, milestones, deliverables, tasks) and finance
-- (invoices, payments). Additive only; deliberate RLS on every table.
--   projects / milestones / deliverables: SELECT projects.read, WRITE projects.manage
--   invoices: SELECT finance.read, WRITE finance.manage (+ approval evidence to issue / void)
--   payments: SELECT finance.read, INSERT only (immutable) and only with an approved payment.record row

-- ---------------------------------------------------------------------------
-- Projects / retainers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id uuid,
  contract_id uuid,
  -- Optional bridge to an existing RINADS Services order (reuse of the services delivery model).
  service_order_id uuid REFERENCES public.service_orders (id) ON DELETE SET NULL,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  kind text NOT NULL DEFAULT 'project' CHECK (kind IN ('project', 'retainer')),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'on_hold', 'completed', 'cancelled')),
  description text,
  start_date date,
  due_date date,
  owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  budget numeric(14, 2) CHECK (budget IS NULL OR budget >= 0),
  currency text NOT NULL DEFAULT 'INR',
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.crm_companies (organization_id, id),
  FOREIGN KEY (organization_id, contract_id) REFERENCES public.crm_contracts (organization_id, id)
);
CREATE INDEX IF NOT EXISTS projects_org_status_idx ON public.projects (organization_id, status);
CREATE INDEX IF NOT EXISTS projects_org_company_idx ON public.projects (organization_id, company_id);

CREATE TABLE IF NOT EXISTS public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  due_date date,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES public.projects (organization_id, id)
);
CREATE INDEX IF NOT EXISTS project_milestones_org_project_idx ON public.project_milestones (organization_id, project_id, sort_order);

-- Extend the EXISTING task engine (operational_tasks) — no second task system.
ALTER TABLE public.operational_tasks
  ADD COLUMN IF NOT EXISTS project_id uuid,
  ADD COLUMN IF NOT EXISTS milestone_id uuid,
  ADD COLUMN IF NOT EXISTS estimate_hours numeric(6, 2) CHECK (estimate_hours IS NULL OR estimate_hours >= 0),
  ADD COLUMN IF NOT EXISTS required_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blocked_by uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS operational_tasks_org_id_uniq ON public.operational_tasks (organization_id, id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operational_tasks_project_fk') THEN
    ALTER TABLE public.operational_tasks
      ADD CONSTRAINT operational_tasks_project_fk
      FOREIGN KEY (organization_id, project_id) REFERENCES public.projects (organization_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operational_tasks_milestone_fk') THEN
    ALTER TABLE public.operational_tasks
      ADD CONSTRAINT operational_tasks_milestone_fk
      FOREIGN KEY (organization_id, milestone_id) REFERENCES public.project_milestones (organization_id, id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS operational_tasks_org_project_idx ON public.operational_tasks (organization_id, project_id) WHERE project_id IS NOT NULL;

-- operational_tasks previously had SELECT-only RLS (writes went through the service role). The
-- Company OS writes through the user's own session, so add tightly scoped write policies for
-- holders of the existing tasks.manage permission. Cross-tenant writes remain impossible.
CREATE POLICY cos_operational_tasks_insert ON public.operational_tasks
  FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(organization_id, 'tasks.manage'));
CREATE POLICY cos_operational_tasks_update ON public.operational_tasks
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'tasks.manage'))
  WITH CHECK (private.has_permission(organization_id, 'tasks.manage'));

CREATE TABLE IF NOT EXISTS public.deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id uuid,
  milestone_id uuid,
  company_id uuid,
  task_id uuid,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'delivered')),
  due_date date,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  change_requests integer NOT NULL DEFAULT 0 CHECK (change_requests >= 0),
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES public.projects (organization_id, id),
  FOREIGN KEY (organization_id, milestone_id) REFERENCES public.project_milestones (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.crm_companies (organization_id, id),
  FOREIGN KEY (organization_id, task_id) REFERENCES public.operational_tasks (organization_id, id)
);
CREATE INDEX IF NOT EXISTS deliverables_org_status_idx ON public.deliverables (organization_id, status);
CREATE INDEX IF NOT EXISTS deliverables_org_project_idx ON public.deliverables (organization_id, project_id);

-- ---------------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  number text NOT NULL CHECK (length(btrim(number)) > 0),
  company_id uuid,
  project_id uuid,
  contract_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'void')),
  issue_date date,
  due_date date,
  subtotal numeric(14, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_total numeric(14, 2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency text NOT NULL DEFAULT 'INR',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  -- Ledger rows that approved issuing / voiding this invoice (HIGH actions).
  issue_action_id uuid,
  void_action_id uuid,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, number),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.crm_companies (organization_id, id),
  FOREIGN KEY (organization_id, project_id) REFERENCES public.projects (organization_id, id),
  FOREIGN KEY (organization_id, contract_id) REFERENCES public.crm_contracts (organization_id, id)
);
CREATE INDEX IF NOT EXISTS finance_invoices_org_status_due_idx ON public.finance_invoices (organization_id, status, due_date);

CREATE TABLE IF NOT EXISTS public.finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  received_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL DEFAULT 'bank_transfer' CHECK (method IN ('bank_transfer', 'upi', 'card', 'cash', 'cheque', 'other')),
  reference text,
  -- Approved payment.record ledger row. Mandatory: no payment exists without an approval.
  approved_action_id uuid NOT NULL,
  recorded_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, invoice_id) REFERENCES public.finance_invoices (organization_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_payments_org_invoice_ref_uniq ON public.finance_payments (organization_id, invoice_id, reference) WHERE reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS finance_payments_action_uniq ON public.finance_payments (approved_action_id);
CREATE INDEX IF NOT EXISTS finance_payments_org_received_idx ON public.finance_payments (organization_id, received_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects', 'project_milestones', 'deliverables']
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, %L))',
      'cos_' || t || '_select', t, 'projects.read');
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_permission(organization_id, %L) AND created_by = auth.uid())',
      'cos_' || t || '_insert', t, 'projects.manage');
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.has_permission(organization_id, %L)) WITH CHECK (private.has_permission(organization_id, %L))',
      'cos_' || t || '_update', t, 'projects.manage', 'projects.manage');
  END LOOP;
END $$;

-- Staff who hold tasks.manage (but not projects.manage) submit their own deliverables.
CREATE POLICY cos_deliverables_staff_submit ON public.deliverables
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'tasks.manage') AND status IN ('draft', 'changes_requested'))
  WITH CHECK (private.has_permission(organization_id, 'tasks.manage') AND status IN ('draft', 'submitted'));

CREATE POLICY cos_finance_invoices_select ON public.finance_invoices
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'finance.read'));
CREATE POLICY cos_finance_invoices_insert ON public.finance_invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'finance.manage')
    AND created_by = auth.uid()
    AND (status = 'draft' OR private.company_os_is_approved_action(organization_id, issue_action_id, 'invoice.issue'))
  );
CREATE POLICY cos_finance_invoices_update ON public.finance_invoices
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'finance.manage'))
  WITH CHECK (
    private.has_permission(organization_id, 'finance.manage')
    AND (status = 'draft' OR private.company_os_is_approved_action(organization_id, issue_action_id, 'invoice.issue'))
    AND (status <> 'void' OR issue_action_id IS NULL OR private.company_os_is_approved_action(organization_id, void_action_id, 'invoice.void'))
  );

-- Payments are an immutable ledger: insert-only, and only with an approved payment.record action.
CREATE POLICY cos_finance_payments_select ON public.finance_payments
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'finance.read'));
CREATE POLICY cos_finance_payments_insert ON public.finance_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'finance.manage')
    AND recorded_by = auth.uid()
    AND private.company_os_is_approved_action(organization_id, approved_action_id, 'payment.record')
  );

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects', 'project_milestones', 'deliverables', 'finance_invoices', 'finance_payments']
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['projects', 'project_milestones', 'deliverables', 'finance_invoices']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'cos_' || t || '_touch', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.company_os_touch_updated_at()', 'cos_' || t || '_touch', t);
  END LOOP;
  -- Payments are immutable: also remove UPDATE at the privilege layer.
  REVOKE UPDATE ON public.finance_payments FROM authenticated;
END $$;
