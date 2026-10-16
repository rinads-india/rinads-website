-- Company OS (issue #127) — 1/7: permissions.
-- Additive only. Nothing here is applied automatically; see docs/company-os/ARCHITECTURE.md.
--
-- Builds on the Company OS v1 kernel (20261016120000_company_os_foundation.sql, PR #129), which seeded
-- founder.read, clients.*, sales.*, work.*, finance.read, people.*, approvals.decide and ai.agent.execute
-- definitions but granted them to NO role. This migration seeds the remaining keys and makes the grants
-- explicit so row-level security (private.has_permission) can rely on them.
--
-- Grants mirror packages/company-os-engine/src/permissions.ts ROLE_PERMISSION_GRANTS. A test
-- (packages/company-os-engine/tests/db/migrations.test.ts) proves the two never drift.

INSERT INTO public.permissions (key, description) VALUES
  ('founder.read', 'View the Founder Control Tower'),
  ('clients.read', 'Read companies, contacts and contracts'),
  ('clients.write', 'Create and update companies, contacts and contracts'),
  ('sales.read', 'Read leads, opportunities and proposals'),
  ('sales.write', 'Create and update leads, opportunities and proposals'),
  ('work.read', 'Read projects, milestones, tasks and deliverables'),
  ('work.write', 'Create and manage projects, milestones, tasks, deliverables and allocation'),
  ('finance.read', 'Read invoices, payments, expenses and receivables'),
  ('finance.write', 'Issue invoices and record payments (approval-gated)'),
  ('people.read', 'Read team skills and capacity'),
  ('people.write', 'Manage team skills and capacity'),
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

-- Founder-level decisions on the tower (seeded by the kernel, granted here).
INSERT INTO public.permissions (key, description) VALUES
  ('founder.decide', 'Act on founder attention / approvals from tower')
ON CONFLICT (key) DO NOTHING;

-- Role grants (explicit pairs so they can be diffed against the TypeScript table).
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON (r.key, p.key) IN (VALUES
  ('founder', 'founder.read'), ('founder', 'clients.read'), ('founder', 'clients.write'), ('founder', 'sales.read'), ('founder', 'sales.write'), ('founder', 'work.read'), ('founder', 'work.write'), ('founder', 'finance.read'), ('founder', 'finance.write'), ('founder', 'people.read'), ('founder', 'people.write'), ('founder', 'studio.read'), ('founder', 'studio.manage'), ('founder', 'growth.read'), ('founder', 'growth.manage'), ('founder', 'engineering.read'), ('founder', 'ai.read'), ('founder', 'ai.manage'), ('founder', 'comms.read'), ('founder', 'comms.manage'), ('founder', 'academy.read'), ('founder', 'academy.manage'), ('founder', 'reports.read'), ('founder', 'approvals.read'), ('founder', 'approvals.decide'),
  ('super_admin', 'founder.read'), ('super_admin', 'clients.read'), ('super_admin', 'clients.write'), ('super_admin', 'sales.read'), ('super_admin', 'sales.write'), ('super_admin', 'work.read'), ('super_admin', 'work.write'), ('super_admin', 'finance.read'), ('super_admin', 'finance.write'), ('super_admin', 'people.read'), ('super_admin', 'people.write'), ('super_admin', 'studio.read'), ('super_admin', 'studio.manage'), ('super_admin', 'growth.read'), ('super_admin', 'growth.manage'), ('super_admin', 'engineering.read'), ('super_admin', 'ai.read'), ('super_admin', 'ai.manage'), ('super_admin', 'comms.read'), ('super_admin', 'comms.manage'), ('super_admin', 'academy.read'), ('super_admin', 'academy.manage'), ('super_admin', 'reports.read'), ('super_admin', 'approvals.read'), ('super_admin', 'approvals.decide'),
  ('admin', 'founder.read'), ('admin', 'clients.read'), ('admin', 'clients.write'), ('admin', 'sales.read'), ('admin', 'sales.write'), ('admin', 'work.read'), ('admin', 'work.write'), ('admin', 'finance.read'), ('admin', 'finance.write'), ('admin', 'people.read'), ('admin', 'people.write'), ('admin', 'studio.read'), ('admin', 'studio.manage'), ('admin', 'growth.read'), ('admin', 'growth.manage'), ('admin', 'engineering.read'), ('admin', 'ai.read'), ('admin', 'ai.manage'), ('admin', 'comms.read'), ('admin', 'comms.manage'), ('admin', 'academy.read'), ('admin', 'academy.manage'), ('admin', 'reports.read'), ('admin', 'approvals.read'), ('admin', 'approvals.decide'),
  ('manager', 'clients.read'), ('manager', 'clients.write'), ('manager', 'sales.read'), ('manager', 'sales.write'), ('manager', 'work.read'), ('manager', 'work.write'), ('manager', 'finance.read'), ('manager', 'people.read'), ('manager', 'people.write'), ('manager', 'studio.read'), ('manager', 'studio.manage'), ('manager', 'growth.read'), ('manager', 'growth.manage'), ('manager', 'engineering.read'), ('manager', 'ai.read'), ('manager', 'comms.read'), ('manager', 'comms.manage'), ('manager', 'academy.read'), ('manager', 'academy.manage'), ('manager', 'reports.read'), ('manager', 'approvals.read'), ('manager', 'approvals.decide'),
  ('staff', 'clients.read'), ('staff', 'sales.read'), ('staff', 'work.read'), ('staff', 'studio.read'), ('staff', 'growth.read'), ('staff', 'comms.read'), ('staff', 'academy.read'), ('staff', 'approvals.read'),
  ('founder', 'founder.decide'), ('super_admin', 'founder.decide'), ('admin', 'founder.decide')
)
ON CONFLICT DO NOTHING;
