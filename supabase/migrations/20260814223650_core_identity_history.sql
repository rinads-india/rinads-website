-- Historical Supabase migration-ledger marker.
--
-- The Phase 1 CORE identity migration originally existed at version
-- 20260814223650 and was later renamed to 20260814100001 to correct the
-- repository migration order. The canonical schema SQL is now maintained in:
--   20260814100001_core_identity.sql
--
-- Some long-lived Supabase environments may already record 20260814223650 as
-- applied. Removing that version from the repository makes `supabase db push`
-- fail with "Remote migration versions not found in local migrations directory."
--
-- This file intentionally performs no schema changes. It preserves the
-- historical version for ledger reconciliation while keeping clean database
-- replays safe after the canonical 20260814100001 migration has run.
-- Keep this historical version permanently; do not renumber or delete it.

DO $$
BEGIN
  NULL;
END
$$;
