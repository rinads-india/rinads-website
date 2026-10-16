-- Company OS (issue #127) — ROLLBACK for migrations 20261016120000 … 20261016120600.
--
-- DESTRUCTIVE: drops every Company OS table and all data in them. This file is deliberately NOT
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

-- 5/7 people + allocation decisions
DROP TABLE IF EXISTS public.work_assignment_decisions;
DROP TABLE IF EXISTS public.people_profiles;

-- 4/7 delivery + finance (operational_tasks is an EXISTING table: only our additions are removed)
DROP TABLE IF EXISTS public.finance_payments;
DROP TABLE IF EXISTS public.finance_invoices;
DROP TABLE IF EXISTS public.deliverables;
DROP POLICY IF EXISTS cos_operational_tasks_insert ON public.operational_tasks;
DROP POLICY IF EXISTS cos_operational_tasks_update ON public.operational_tasks;
ALTER TABLE public.operational_tasks DROP CONSTRAINT IF EXISTS operational_tasks_project_fk;
ALTER TABLE public.operational_tasks DROP CONSTRAINT IF EXISTS operational_tasks_milestone_fk;
DROP INDEX IF EXISTS public.operational_tasks_org_project_idx;
DROP INDEX IF EXISTS public.operational_tasks_org_id_uniq;
ALTER TABLE public.operational_tasks
  DROP COLUMN IF EXISTS project_id,
  DROP COLUMN IF EXISTS milestone_id,
  DROP COLUMN IF EXISTS estimate_hours,
  DROP COLUMN IF EXISTS required_skills,
  DROP COLUMN IF EXISTS blocked_by,
  DROP COLUMN IF EXISTS created_by;
DROP TABLE IF EXISTS public.project_milestones;
DROP TABLE IF EXISTS public.projects;

-- 3/7 CRM
DROP TABLE IF EXISTS public.crm_contracts;
DROP TABLE IF EXISTS public.crm_proposals;
DROP TABLE IF EXISTS public.crm_leads;
DROP TABLE IF EXISTS public.crm_opportunities;
DROP TABLE IF EXISTS public.crm_contacts;
DROP TABLE IF EXISTS public.crm_companies;

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

-- 1/7 permissions
DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT id FROM public.permissions
  WHERE key IN (
    'company.founder.view', 'crm.read', 'crm.manage', 'projects.read', 'projects.manage', 'finance.read',
    'finance.manage', 'people.read', 'people.manage', 'studio.read', 'studio.manage', 'growth.read',
    'growth.manage', 'engineering.read', 'ai.read', 'ai.manage', 'comms.read', 'comms.manage',
    'academy.read', 'academy.manage', 'reports.read', 'approvals.read', 'approvals.decide'
  )
);
DELETE FROM public.permissions
WHERE key IN (
  'company.founder.view', 'crm.read', 'crm.manage', 'projects.read', 'projects.manage', 'finance.read',
  'finance.manage', 'people.read', 'people.manage', 'studio.read', 'studio.manage', 'growth.read',
  'growth.manage', 'engineering.read', 'ai.read', 'ai.manage', 'comms.read', 'comms.manage',
  'academy.read', 'academy.manage', 'reports.read', 'approvals.read', 'approvals.decide'
);

COMMIT;
