-- P0 production security hardening: close function privilege drift.
--
-- Root cause verified in production on 2026-10-09:
-- Supabase default function ACLs in schema public grant EXECUTE directly to
-- anon, authenticated, and service_role. Historical migrations often used
-- `REVOKE ... FROM PUBLIC`, which does not remove those direct role grants.
-- As a result, SECURITY DEFINER and worker/trigger helpers became callable by
-- client roles even where the migration intent was narrower.
--
-- This migration is deliberately conservative:
--   * preserve the explicit anonymous public-RPC allowlist;
--   * remove anonymous access from every other public SECURITY DEFINER RPC;
--   * remove authenticated access from trigger-only SECURITY DEFINER helpers;
--   * restore service-role-only access for known worker/internal RPCs;
--   * pin mutable search_path values identified by the production advisor;
--   * do not change RLS policies, extension placement, or Auth settings here.

-- ---------------------------------------------------------------------------
-- 1. Anonymous SECURITY DEFINER allowlist
-- ---------------------------------------------------------------------------
-- These functions are intentionally exposed to unauthenticated website/salon
-- flows. Their bodies must continue to enforce validation, rate limiting,
-- tenant scoping, idempotency, and token checks as applicable.
--
--   consume_public_salon_booking_rate_limit
--   create_public_salon_booking
--   get_public_salon_branches
--   get_public_salon_busy_slots
--   get_public_salon_organization
--   get_public_salon_services
--   get_public_salon_staff
--   get_public_salon_staff_for_service
--   get_public_service_order_status
--   submit_salon_feedback
--
-- All other public SECURITY DEFINER functions lose anonymous/Public execute.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname NOT IN (
        'consume_public_salon_booking_rate_limit',
        'create_public_salon_booking',
        'get_public_salon_branches',
        'get_public_salon_busy_slots',
        'get_public_salon_organization',
        'get_public_salon_services',
        'get_public_salon_staff',
        'get_public_salon_staff_for_service',
        'get_public_service_order_status',
        'submit_salon_feedback'
      )
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
      fn.schema_name,
      fn.function_name,
      fn.identity_args
    );
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. Trigger-only SECURITY DEFINER helpers are not client RPCs
-- ---------------------------------------------------------------------------
-- PostgreSQL trigger functions cannot be meaningfully invoked as ordinary
-- client RPCs. Existing triggers continue to invoke them after these revokes.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      fn.schema_name,
      fn.function_name,
      fn.identity_args
    );
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Restore historically documented narrow grants
-- ---------------------------------------------------------------------------
-- Service-order assignment has always been intended for the trusted worker.
REVOKE EXECUTE ON FUNCTION public.assign_service_order(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_service_order(uuid) TO service_role;

-- Runtime job claiming/reset is a worker concern. Earlier migration comments
-- explicitly state that the service role performs these operations.
REVOKE EXECUTE ON FUNCTION public.claim_runtime_jobs(uuid, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_stale_runtime_jobs(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_runtime_jobs(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_stale_runtime_jobs(uuid, integer) TO service_role;

-- Loyalty expiry posting is a scheduled/service operation.
REVOKE EXECUTE ON FUNCTION public.salon_loyalty_post_expire(uuid, uuid, integer, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.salon_loyalty_post_expire(uuid, uuid, integer, uuid, text)
  TO service_role;

-- The interactive loyalty APIs are authenticated, permission-checked RPCs.
-- Remove anonymous/Public access explicitly while retaining documented roles.
REVOKE EXECUTE ON FUNCTION public.salon_loyalty_balance(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salon_loyalty_redeem(uuid, uuid, integer, uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salon_loyalty_adjust(uuid, uuid, integer, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salon_loyalty_earn(uuid, uuid, integer, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salon_loyalty_reverse_redemption(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.salon_loyalty_balance(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salon_loyalty_redeem(uuid, uuid, integer, uuid, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salon_loyalty_adjust(uuid, uuid, integer, text, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salon_loyalty_earn(uuid, uuid, integer, text, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salon_loyalty_reverse_redemption(uuid, uuid, text, text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Pin mutable search_path values reported by the production advisor
-- ---------------------------------------------------------------------------
ALTER FUNCTION private.is_privileged_role_key(text)
  SET search_path TO private, public, pg_temp;

ALTER FUNCTION public.claim_runtime_jobs(uuid, integer)
  SET search_path TO public, pg_temp;
ALTER FUNCTION public.reset_stale_runtime_jobs(uuid, integer)
  SET search_path TO public, pg_temp;
ALTER FUNCTION public.generate_service_order_number()
  SET search_path TO public, pg_temp;
ALTER FUNCTION public.generate_salon_booking_number()
  SET search_path TO public, pg_temp;
ALTER FUNCTION public.generate_salon_sale_number()
  SET search_path TO public, pg_temp;
ALTER FUNCTION public.salon_appointments_set_updated_at()
  SET search_path TO public, pg_temp;
ALTER FUNCTION public.salon_pos_set_updated_at()
  SET search_path TO public, pg_temp;
ALTER FUNCTION public.salon_campaigns_set_updated_at()
  SET search_path TO public, pg_temp;
ALTER FUNCTION public.salon_automation_set_updated_at()
  SET search_path TO public, pg_temp;

-- Trigger/sequence helpers above are internal implementation details, not RPCs.
REVOKE EXECUTE ON FUNCTION public.generate_service_order_number()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_salon_booking_number()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_salon_sale_number()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salon_appointments_set_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salon_pos_set_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salon_campaigns_set_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salon_automation_set_updated_at()
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Fail closed if anonymous SECURITY DEFINER drift remains outside allowlist
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  drift_count integer;
BEGIN
  SELECT count(*)::integer
    INTO drift_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND p.proname NOT IN (
      'consume_public_salon_booking_rate_limit',
      'create_public_salon_booking',
      'get_public_salon_branches',
      'get_public_salon_busy_slots',
      'get_public_salon_organization',
      'get_public_salon_services',
      'get_public_salon_staff',
      'get_public_salon_staff_for_service',
      'get_public_service_order_status',
      'submit_salon_feedback'
    );

  IF drift_count <> 0 THEN
    RAISE EXCEPTION
      'security hardening failed: % anonymous SECURITY DEFINER function(s) remain outside allowlist',
      drift_count;
  END IF;

  IF has_function_privilege('authenticated', 'public.assign_service_order(uuid)'::regprocedure, 'EXECUTE') THEN
    RAISE EXCEPTION 'security hardening failed: authenticated can execute assign_service_order';
  END IF;

  IF has_function_privilege('anon', 'public.claim_runtime_jobs(uuid,integer)'::regprocedure, 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.claim_runtime_jobs(uuid,integer)'::regprocedure, 'EXECUTE') THEN
    RAISE EXCEPTION 'security hardening failed: client role can claim runtime jobs';
  END IF;
END
$$;

COMMENT ON FUNCTION public.claim_runtime_jobs(uuid, integer) IS
  'RINPO/runtime worker-only job claim RPC. EXECUTE restricted to service_role.';
COMMENT ON FUNCTION public.reset_stale_runtime_jobs(uuid, integer) IS
  'RINPO/runtime worker-only stale-job recovery RPC. EXECUTE restricted to service_role.';
