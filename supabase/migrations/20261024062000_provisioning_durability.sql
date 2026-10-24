-- Release B4: durable tenant provisioning state.
-- Additive columns permit bounded retry/backoff without introducing a new queue.
-- Rollback note: first move retrying/blocked/dead_letter rows to pending/failed,
-- then restore the legacy status CHECK and drop the added columns/index.

ALTER TABLE public.tenant_provisioning_jobs
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error_class TEXT,
  ADD COLUMN IF NOT EXISTS dead_lettered_at TIMESTAMPTZ;

ALTER TABLE public.tenant_provisioning_jobs
  DROP CONSTRAINT IF EXISTS tenant_provisioning_jobs_status_check;

ALTER TABLE public.tenant_provisioning_jobs
  ADD CONSTRAINT tenant_provisioning_jobs_status_check
  CHECK (
    status IN (
      'pending',
      'running',
      'retrying',
      'blocked',
      'dead_letter',
      'completed',
      'failed'
    )
  );

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_runnable
  ON public.tenant_provisioning_jobs (status, next_attempt_at, created_at)
  WHERE status IN ('pending', 'retrying');

COMMENT ON COLUMN public.tenant_provisioning_jobs.attempts IS
  'Number of provisioning execution attempts started for this idempotent job.';
COMMENT ON COLUMN public.tenant_provisioning_jobs.next_attempt_at IS
  'Earliest time a retrying provisioning job may run again.';
COMMENT ON COLUMN public.tenant_provisioning_jobs.last_error_class IS
  'Stable worker error classification used for operations and retry decisions.';
COMMENT ON COLUMN public.tenant_provisioning_jobs.dead_lettered_at IS
  'Timestamp when bounded retries were exhausted and manual retry became required.';
