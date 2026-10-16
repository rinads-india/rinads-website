-- Company OS (issue #127) — 1/7: permissions.
-- Additive only. Nothing here is applied automatically; see docs/company-os/ARCHITECTURE.md.
--
-- Grants mirror packages/company-os/src/permissions.ts ROLE_PERMISSION_GRANTS. A test
-- (packages/company-os/tests/db/migrations.test.ts) proves the two never drift.

INSERT INTO public.permissions (key, description) VALUES
  ('company.founder.view', 'View the Founder Control Tower'),
  ('crm.read', 'Read leads, companies, contacts, opportunities, proposals and contracts'),
  ('crm.manage', 'Create and update CRM and sales objects'),
  ('projects.read', 'Read projects, milestones and deliverables'),
  ('projects.manage', 'Create and manage projects, milestones, deliverables and task allocation'),
  ('finance.read', 'Read invoices, payments and receivables'),
  ('finance.manage', 'Issue invoices and record payments (approval-gated)'),
  ('people.read', 'Read team skills and capacity'),
  ('people.manage', 'Manage team skills and capacity'),
  ('studio.read', 'Read Studio jobs and creative assets'),
  ('studio.manage', 'Run Studio production and register creative assets'),
  ('growth.read', 'Read campaigns, content and ads performance'),
  ('growth.manage', 'Manage campaigns, content and ads (publishing is approval-gated)'),
  ('engineering.read', 'Read engineering and deployment health'),
  ('ai.read', 'Read AI provider, run and cost visibility'),
  ('ai.manage', 'Manage AI role profiles'),
  ('comms.read', 'Read communication activity'),
  ('comms.manage', 'Record and link communication activity'),
  ('academy.read', 'Read Academy skills and progress'),
  ('academy.manage', 'Manage Academy skills and record progress evidence'),
  ('reports.read', 'Read computed company reports'),
  ('approvals.read', 'Read the approvals queue'),
  ('approvals.decide', 'Approve or reject governed actions')
ON CONFLICT (key) DO NOTHING;

-- Role grants (explicit pairs so they can be diffed against the TypeScript table).
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON (r.key, p.key) IN (VALUES
  ('founder', 'company.founder.view'), ('founder', 'crm.read'), ('founder', 'crm.manage'), ('founder', 'projects.read'), ('founder', 'projects.manage'),
  ('founder', 'finance.read'), ('founder', 'finance.manage'), ('founder', 'people.read'), ('founder', 'people.manage'), ('founder', 'studio.read'),
  ('founder', 'studio.manage'), ('founder', 'growth.read'), ('founder', 'growth.manage'), ('founder', 'engineering.read'), ('founder', 'ai.read'),
  ('founder', 'ai.manage'), ('founder', 'comms.read'), ('founder', 'comms.manage'), ('founder', 'academy.read'), ('founder', 'academy.manage'),
  ('founder', 'reports.read'), ('founder', 'approvals.read'), ('founder', 'approvals.decide'),
  ('super_admin', 'company.founder.view'), ('super_admin', 'crm.read'), ('super_admin', 'crm.manage'), ('super_admin', 'projects.read'), ('super_admin', 'projects.manage'),
  ('super_admin', 'finance.read'), ('super_admin', 'finance.manage'), ('super_admin', 'people.read'), ('super_admin', 'people.manage'), ('super_admin', 'studio.read'),
  ('super_admin', 'studio.manage'), ('super_admin', 'growth.read'), ('super_admin', 'growth.manage'), ('super_admin', 'engineering.read'), ('super_admin', 'ai.read'),
  ('super_admin', 'ai.manage'), ('super_admin', 'comms.read'), ('super_admin', 'comms.manage'), ('super_admin', 'academy.read'), ('super_admin', 'academy.manage'),
  ('super_admin', 'reports.read'), ('super_admin', 'approvals.read'), ('super_admin', 'approvals.decide'),
  ('admin', 'company.founder.view'), ('admin', 'crm.read'), ('admin', 'crm.manage'), ('admin', 'projects.read'), ('admin', 'projects.manage'),
  ('admin', 'finance.read'), ('admin', 'finance.manage'), ('admin', 'people.read'), ('admin', 'people.manage'), ('admin', 'studio.read'),
  ('admin', 'studio.manage'), ('admin', 'growth.read'), ('admin', 'growth.manage'), ('admin', 'engineering.read'), ('admin', 'ai.read'),
  ('admin', 'ai.manage'), ('admin', 'comms.read'), ('admin', 'comms.manage'), ('admin', 'academy.read'), ('admin', 'academy.manage'),
  ('admin', 'reports.read'), ('admin', 'approvals.read'), ('admin', 'approvals.decide'),
  ('manager', 'crm.read'), ('manager', 'crm.manage'), ('manager', 'projects.read'), ('manager', 'projects.manage'), ('manager', 'finance.read'),
  ('manager', 'people.read'), ('manager', 'people.manage'), ('manager', 'studio.read'), ('manager', 'studio.manage'), ('manager', 'growth.read'),
  ('manager', 'growth.manage'), ('manager', 'engineering.read'), ('manager', 'ai.read'), ('manager', 'comms.read'), ('manager', 'comms.manage'),
  ('manager', 'academy.read'), ('manager', 'academy.manage'), ('manager', 'reports.read'), ('manager', 'approvals.read'), ('manager', 'approvals.decide'),
  ('staff', 'crm.read'), ('staff', 'projects.read'), ('staff', 'studio.read'), ('staff', 'growth.read'), ('staff', 'comms.read'),
  ('staff', 'academy.read'), ('staff', 'approvals.read')
)
ON CONFLICT DO NOTHING;
