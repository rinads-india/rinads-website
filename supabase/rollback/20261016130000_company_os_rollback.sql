-- Company OS (issue #127) — ROLLBACK for migrations 20261016130000 … 20261016130600.
--
-- DESTRUCTIVE: drops every table this series created (and their data) and removes the columns, constraints, indexes and
-- policies it added to the Company OS v1 kernel tables (cos_*, 20261016120000), whose own member-wide policies it restores.
-- Table privileges revoked from `anon`/`authenticated` are NOT re-granted (the result is stricter than before). This file is deliberately NOT
-- in supabase/migrations/. Run it only on a non-production database, or on production after a
-- verified backup and an explicit founder decision. Order matters (reverse of creation).
-- Verified by packages/company-os-engine/tests/db/rollback.test.ts: apply → rollback → identical baseline → re-apply.

BEGIN;

-- 7/7 comms, academy, AI
DROP TABLE IF EXISTS public.ai_agent_profiles;
DROP TABLE IF EXISTS public.ai_runs;
DROP TABLE IF EXISTS public.academy_progress;
DROP TABLE IF EXISTS public.academy_skills;
DROP TABLE IF EXISTS public.comm_activities;

-- 6/7 studio, growth, ads
DROP TABLE IF EXISTS public.ad_metrics_daily;
DROP TABLE IF EXISTS public.ad_campaigns;
DROP FUNCTION IF EXISTS private.company_os_guard_ad_budget();
DROP TABLE IF EXISTS public.asset_performance;
DROP TABLE IF EXISTS public.asset_publications;
DROP TABLE IF EXISTS public.content_items;
DROP TABLE IF EXISTS public.creative_assets;
DROP TABLE IF EXISTS public.studio_jobs;
DROP TABLE IF EXISTS public.growth_campaigns;

-- 5/7 allocation decisions
DROP TABLE IF EXISTS public.work_assignment_decisions;

-- 3-4/7 Business Graph (cos_*) extensions: policies, triggers, constraints, indexes, columns
DO $$
DECLARE
  t text;
  p text;
  c record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cos_departments', 'cos_workers', 'cos_capacity_snapshots', 'cos_companies', 'cos_contacts', 'cos_leads',
    'cos_opportunities', 'cos_proposals', 'cos_contracts', 'cos_projects', 'cos_milestones', 'cos_tasks',
    'cos_deliverables', 'cos_invoices', 'cos_payments', 'cos_expenses', 'cos_daily_closings',
    'cos_attention_items', 'cos_approval_items'
  ]
  LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND policyname NOT LIKE '%\_member' ESCAPE '\'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
    END LOOP;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
    -- Restore the kernel's member-wide policies.
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_member', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert_member', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update_member', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.is_org_member(organization_id))', t || '_select_member', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.is_org_member(organization_id))', t || '_insert_member', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.is_org_member(organization_id)) WITH CHECK (private.is_org_member(organization_id))', t || '_update_member', t);
  END LOOP;

  -- Foreign keys and unique keys added by this series.
  FOR c IN
    SELECT conrelid::regclass::text AS rel, conname FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace AND conrelid::regclass::text LIKE 'cos\_%' ESCAPE '\'
      AND (conname LIKE '%\_org\_fk' ESCAPE '\' OR conname LIKE '%\_org\_id\_key' ESCAPE '\'
           OR conname IN ('cos_companies_priority_check', 'cos_workers_profile_status_check', 'cos_workers_skill_levels_check',
                          'cos_opportunities_probability_range', 'cos_opportunities_kind_check', 'cos_projects_kind_check',
                          'cos_payments_amount_positive'))
    ORDER BY (conname LIKE '%\_org\_id\_key' ESCAPE '\')
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', c.rel, c.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS public.cos_workers_org_user_uniq;
DROP INDEX IF EXISTS public.cos_companies_org_name_uniq;
DROP INDEX IF EXISTS public.cos_leads_org_source_ref_uniq;
DROP INDEX IF EXISTS public.cos_payments_action_uniq;
DROP INDEX IF EXISTS public.cos_payments_org_invoice_ref_uniq;

-- Deliverable statuses back to the kernel set.
ALTER TABLE public.cos_deliverables DROP CONSTRAINT IF EXISTS cos_deliverables_status_check;
ALTER TABLE public.cos_deliverables ADD CONSTRAINT cos_deliverables_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'published'));

ALTER TABLE public.cos_workers ALTER COLUMN kind DROP DEFAULT;
UPDATE public.cos_opportunities SET probability = 0 WHERE probability IS NULL;
ALTER TABLE public.cos_opportunities ALTER COLUMN probability SET DEFAULT 0;
ALTER TABLE public.cos_opportunities ALTER COLUMN probability SET NOT NULL;

ALTER TABLE public.cos_workers DROP COLUMN IF EXISTS skill_levels, DROP COLUMN IF EXISTS profile_status;
ALTER TABLE public.cos_companies DROP COLUMN IF EXISTS priority, DROP COLUMN IF EXISTS company_size, DROP COLUMN IF EXISTS owner_worker_id, DROP COLUMN IF EXISTS notes, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_contacts DROP COLUMN IF EXISTS notes, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_leads
  DROP COLUMN IF EXISTS email, DROP COLUMN IF EXISTS phone, DROP COLUMN IF EXISTS company_name, DROP COLUMN IF EXISTS source_ref,
  DROP COLUMN IF EXISTS problem, DROP COLUMN IF EXISTS budget, DROP COLUMN IF EXISTS timeline, DROP COLUMN IF EXISTS last_contacted_at,
  DROP COLUMN IF EXISTS disqualified_reason, DROP COLUMN IF EXISTS converted_company_id, DROP COLUMN IF EXISTS converted_contact_id,
  DROP COLUMN IF EXISTS converted_opportunity_id, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_opportunities
  DROP COLUMN IF EXISTS contact_id, DROP COLUMN IF EXISTS kind, DROP COLUMN IF EXISTS stage_changed_at, DROP COLUMN IF EXISTS lost_reason,
  DROP COLUMN IF EXISTS notes, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_proposals
  DROP COLUMN IF EXISTS valid_until, DROP COLUMN IF EXISTS sent_at, DROP COLUMN IF EXISTS document_ref, DROP COLUMN IF EXISTS sent_action_id, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_contracts
  DROP COLUMN IF EXISTS proposal_id, DROP COLUMN IF EXISTS start_date, DROP COLUMN IF EXISTS end_date, DROP COLUMN IF EXISTS signed_by_name,
  DROP COLUMN IF EXISTS document_ref, DROP COLUMN IF EXISTS sign_action_id, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_projects
  DROP COLUMN IF EXISTS contract_id, DROP COLUMN IF EXISTS kind, DROP COLUMN IF EXISTS description, DROP COLUMN IF EXISTS budget,
  DROP COLUMN IF EXISTS currency, DROP COLUMN IF EXISTS service_order_id, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_milestones DROP COLUMN IF EXISTS completed_at, DROP COLUMN IF EXISTS sort_order, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_tasks
  DROP COLUMN IF EXISTS description, DROP COLUMN IF EXISTS required_skills, DROP COLUMN IF EXISTS blocked_by, DROP COLUMN IF EXISTS completed_at, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_deliverables
  DROP COLUMN IF EXISTS milestone_id, DROP COLUMN IF EXISTS company_id, DROP COLUMN IF EXISTS due_date, DROP COLUMN IF EXISTS submitted_at,
  DROP COLUMN IF EXISTS approved_at, DROP COLUMN IF EXISTS approved_by, DROP COLUMN IF EXISTS change_requests, DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_invoices
  DROP COLUMN IF EXISTS contract_id, DROP COLUMN IF EXISTS subtotal, DROP COLUMN IF EXISTS tax_total, DROP COLUMN IF EXISTS line_items,
  DROP COLUMN IF EXISTS notes, DROP COLUMN IF EXISTS issue_action_id, DROP COLUMN IF EXISTS void_action_id, DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.cos_payments DROP COLUMN IF EXISTS reference, DROP COLUMN IF EXISTS approved_action_id, DROP COLUMN IF EXISTS recorded_by;

-- 2/7 ledger + events + audit guards (rinpo_actions / business_events / audit_logs are EXISTING)
DROP POLICY IF EXISTS cos_audit_logs_insert_guard ON public.audit_logs;
DROP POLICY IF EXISTS cos_business_events_select_guard ON public.business_events;
DROP POLICY IF EXISTS cos_business_events_insert ON public.business_events;
DROP POLICY IF EXISTS cos_rinpo_actions_insert_guard ON public.rinpo_actions;
DROP POLICY IF EXISTS cos_rinpo_actions_select_guard ON public.rinpo_actions;
DROP POLICY IF EXISTS cos_rinpo_actions_update ON public.rinpo_actions;
DROP TRIGGER IF EXISTS company_os_guard_ledger ON public.rinpo_actions;
DROP FUNCTION IF EXISTS private.company_os_guard_ledger();
DROP FUNCTION IF EXISTS private.company_os_is_approved_action(uuid, uuid, text);
DROP FUNCTION IF EXISTS private.company_os_touch_updated_at();
DROP INDEX IF EXISTS public.rinpo_actions_company_os_pending_idx;
DROP INDEX IF EXISTS public.rinpo_actions_org_idempotency_uniq;
ALTER TABLE public.rinpo_actions
  DROP COLUMN IF EXISTS source_domain,
  DROP COLUMN IF EXISTS idempotency_key,
  DROP COLUMN IF EXISTS risk_level,
  DROP COLUMN IF EXISTS payload_hash,
  DROP COLUMN IF EXISTS requires_approval,
  DROP COLUMN IF EXISTS distinct_approver,
  DROP COLUMN IF EXISTS approver_permission,
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS actor_kind,
  DROP COLUMN IF EXISTS agent_role,
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS model,
  DROP COLUMN IF EXISTS correlation_id,
  DROP COLUMN IF EXISTS error_class,
  DROP COLUMN IF EXISTS verification;

-- 1/7 permissions (keys seeded by the kernel stay; only the grants and the keys this series added are removed)
DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE key IN (
    'founder.read', 'founder.decide', 'clients.read', 'clients.write', 'sales.read', 'sales.write', 'work.read', 'work.write',
    'finance.read', 'finance.write', 'people.read', 'people.write', 'studio.read', 'studio.manage', 'growth.read', 'growth.manage',
    'engineering.read', 'ai.read', 'ai.manage', 'comms.read', 'comms.manage', 'academy.read', 'academy.manage', 'reports.read',
    'approvals.read', 'approvals.decide'
  )
);
DELETE FROM public.permissions
WHERE key IN (
  'finance.write', 'studio.read', 'studio.manage', 'growth.read', 'growth.manage', 'engineering.read', 'ai.read', 'ai.manage',
  'comms.read', 'comms.manage', 'academy.read', 'academy.manage', 'reports.read', 'approvals.read'
);

COMMIT;
