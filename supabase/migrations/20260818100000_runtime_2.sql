-- Phase 12 Runtime 2.0: event model extension, workflow engine, durable jobs, approvals, outbox

-- Extend business_events (append-only canonical events)
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS aggregate_type TEXT;
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS aggregate_id TEXT;
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'system';
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS causation_id TEXT;
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS actor_type TEXT;
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS actor_id TEXT;
ALTER TABLE business_events ADD COLUMN IF NOT EXISTS schema_version TEXT NOT NULL DEFAULT 'v1';

CREATE INDEX IF NOT EXISTS idx_business_events_org_type_created
  ON business_events(organization_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_org_correlation
  ON business_events(organization_id, correlation_id) WHERE correlation_id IS NOT NULL;

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  version INT NOT NULL,
  definition JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, version)
);

CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_version_id UUID NOT NULL REFERENCES workflow_versions(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'manual', 'condition')),
  event_type TEXT,
  schedule_cron TEXT,
  condition JSONB,
  is_enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_version_id UUID NOT NULL REFERENCES workflow_versions(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_key TEXT NOT NULL,
  action_key TEXT NOT NULL,
  condition JSONB,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (workflow_version_id, step_key)
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  workflow_version_id UUID NOT NULL REFERENCES workflow_versions(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'running', 'waiting', 'completed', 'failed', 'cancelled', 'dead_letter'
  )),
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  trigger_event_id UUID REFERENCES business_events(id),
  input_payload JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  iteration_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_step_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'skipped', 'waiting_approval'
  )),
  attempt_count INT NOT NULL DEFAULT 0,
  output_payload JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Durable runtime jobs (distinct from tenant_provisioning_jobs)
CREATE TABLE IF NOT EXISTS runtime_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  processor_key TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'running', 'completed', 'failed', 'dead_letter'
  )),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error TEXT,
  run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_runtime_jobs_poll
  ON runtime_jobs(status, run_after) WHERE status IN ('queued', 'failed');

CREATE TABLE IF NOT EXISTS runtime_dead_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('job', 'workflow', 'outbox')),
  source_id UUID NOT NULL,
  error_class TEXT,
  error_message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtime_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_run_id UUID REFERENCES workflow_step_runs(id) ON DELETE SET NULL,
  action_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_by TEXT,
  reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'push')),
  template_key TEXT NOT NULL,
  recipient TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS tenant_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_key TEXT NOT NULL,
  policy_value JSONB NOT NULL DEFAULT '{}',
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, policy_key, version)
);

CREATE TABLE IF NOT EXISTS workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  cron_expression TEXT NOT NULL,
  misfire_policy TEXT NOT NULL DEFAULT 'run_once' CHECK (misfire_policy IN ('skip', 'run_once', 'catch_up_limited')),
  is_paused BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rinpo_memory_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID,
  fact_key TEXT NOT NULL,
  fact_value JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  source TEXT NOT NULL DEFAULT 'system',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rinpo_memory_org ON rinpo_memory_facts(organization_id, fact_key);

-- RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rinpo_memory_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflows_member_select ON workflows FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY workflow_executions_member_select ON workflow_executions FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY runtime_jobs_member_select ON runtime_jobs FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY runtime_dead_letters_member_select ON runtime_dead_letters FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY runtime_approvals_member_select ON runtime_approvals FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY runtime_approvals_member_update ON runtime_approvals FOR UPDATE TO authenticated
  USING (private.is_org_member(organization_id))
  WITH CHECK (private.is_org_member(organization_id));
CREATE POLICY notification_outbox_member_select ON notification_outbox FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY tenant_policies_member_select ON tenant_policies FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));
CREATE POLICY rinpo_memory_member_select ON rinpo_memory_facts FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY business_events_member_select ON business_events FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

-- Seed Ambady order-fulfilment workflow template (platform-wide key, enabled per org on provision)
INSERT INTO workflows (id, organization_id, key, name, description, is_enabled)
SELECT gen_random_uuid(), o.id, 'order-fulfilment-v1', 'Order fulfilment', 'On order.paid.v1: fulfilment + order confirmation outbox', true
FROM organizations o
WHERE o.slug = 'ambady'
ON CONFLICT DO NOTHING;
