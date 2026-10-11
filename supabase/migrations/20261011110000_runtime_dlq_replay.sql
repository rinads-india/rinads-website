-- RINPO Runtime P1: auditable dead-letter lifecycle + controlled job replay.
--
-- Security model:
-- - authenticated users keep SELECT-only visibility through existing RLS
-- - replay mutation is service-role only
-- - application/server policy must authorize the human actor before calling this RPC
-- - original runtime job/idempotency identity is reused; replay does not clone work

ALTER TABLE runtime_dead_letters
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS replay_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replayed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replayed_by TEXT,
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'runtime_dead_letters_status_check'
  ) THEN
    ALTER TABLE runtime_dead_letters
      ADD CONSTRAINT runtime_dead_letters_status_check
      CHECK (status IN ('open', 'replayed', 'discarded'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'runtime_dead_letters_replay_count_check'
  ) THEN
    ALTER TABLE runtime_dead_letters
      ADD CONSTRAINT runtime_dead_letters_replay_count_check
      CHECK (replay_count >= 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_runtime_dead_letters_org_open
  ON runtime_dead_letters(organization_id, created_at DESC)
  WHERE status = 'open';

CREATE OR REPLACE FUNCTION replay_runtime_dead_letter(
  p_org_id UUID,
  p_dead_letter_id UUID,
  p_replayed_by TEXT,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS SETOF runtime_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dlq runtime_dead_letters%ROWTYPE;
  v_job runtime_jobs%ROWTYPE;
BEGIN
  IF p_replayed_by IS NULL OR length(trim(p_replayed_by)) = 0 THEN
    RAISE EXCEPTION 'Replay requires an authenticated actor';
  END IF;

  SELECT *
  INTO v_dlq
  FROM runtime_dead_letters
  WHERE id = p_dead_letter_id
    AND organization_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dead letter not found for tenant';
  END IF;

  IF v_dlq.source_type <> 'job' THEN
    RAISE EXCEPTION 'Only job dead letters are replayable in v1';
  END IF;

  IF v_dlq.status <> 'open' THEN
    RAISE EXCEPTION 'Dead letter is already %', v_dlq.status;
  END IF;

  UPDATE runtime_jobs
  SET status = 'queued',
      attempts = 0,
      last_error = NULL,
      run_after = now(),
      updated_at = now()
  WHERE id = v_dlq.source_id
    AND organization_id = p_org_id
    AND status = 'dead_letter'
  RETURNING * INTO v_job;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source job is missing or no longer dead_letter';
  END IF;

  UPDATE runtime_dead_letters
  SET status = 'replayed',
      replay_count = replay_count + 1,
      replayed_at = now(),
      replayed_by = p_replayed_by,
      resolution_note = p_resolution_note,
      updated_at = now()
  WHERE id = p_dead_letter_id;

  RETURN NEXT v_job;
END;
$$;

REVOKE ALL ON FUNCTION replay_runtime_dead_letter(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION replay_runtime_dead_letter(UUID, UUID, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION replay_runtime_dead_letter(UUID, UUID, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION replay_runtime_dead_letter(UUID, UUID, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION replay_runtime_dead_letter(UUID, UUID, TEXT, TEXT) IS
  'Service-role-only atomic replay of an open job dead letter. Application policy must authorize actor first.';
