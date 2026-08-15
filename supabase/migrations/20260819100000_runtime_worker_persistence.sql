-- Phase 13: runtime worker persistence — job claim RPC + execution snapshots

CREATE INDEX IF NOT EXISTS idx_runtime_jobs_org_poll
  ON runtime_jobs(organization_id, status, run_after)
  WHERE status IN ('queued', 'failed', 'running');

CREATE TABLE IF NOT EXISTS runtime_execution_snapshots (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  execution_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runtime_execution_snapshots_org
  ON runtime_execution_snapshots(organization_id);

ALTER TABLE runtime_execution_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY runtime_execution_snapshots_member_select ON runtime_execution_snapshots
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

-- Claim eligible jobs with row lock (service role bypasses RLS)
CREATE OR REPLACE FUNCTION claim_runtime_jobs(p_org_id UUID, p_limit INT DEFAULT 10)
RETURNS SETOF runtime_jobs
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE runtime_jobs j
  SET status = 'running', updated_at = now()
  FROM (
    SELECT id
    FROM runtime_jobs
    WHERE organization_id = p_org_id
      AND status IN ('queued', 'failed')
      AND run_after <= now()
    ORDER BY run_after ASC
    LIMIT GREATEST(p_limit, 1)
    FOR UPDATE SKIP LOCKED
  ) sub
  WHERE j.id = sub.id
  RETURNING j.*;
END;
$$;

-- Reset jobs stuck in running after worker crash
CREATE OR REPLACE FUNCTION reset_stale_runtime_jobs(p_org_id UUID, p_stale_minutes INT DEFAULT 10)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  affected INT;
BEGIN
  UPDATE runtime_jobs
  SET status = 'queued', updated_at = now()
  WHERE organization_id = p_org_id
    AND status = 'running'
    AND updated_at < now() - (p_stale_minutes || ' minutes')::interval;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
