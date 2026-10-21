-- Company OS (issue #127) — 2/7: governed-action ledger, helpers, event + audit guards.
-- Additive only. Reuses the existing `rinpo_actions` table as THE approval ledger (no second
-- approval system) and tightens how Company OS rows can change.

-- ---------------------------------------------------------------------------
-- 1. Ledger columns (all nullable → existing salon RINPO rows are untouched)
-- ---------------------------------------------------------------------------
ALTER TABLE public.rinpo_actions
  ADD COLUMN IF NOT EXISTS source_domain text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS risk_level text CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  ADD COLUMN IF NOT EXISTS payload_hash text,
  ADD COLUMN IF NOT EXISTS requires_approval boolean,
  ADD COLUMN IF NOT EXISTS distinct_approver boolean,
  ADD COLUMN IF NOT EXISTS approver_permission text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS actor_kind text CHECK (actor_kind IN ('user', 'agent', 'system')),
  ADD COLUMN IF NOT EXISTS agent_role text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS correlation_id text,
  ADD COLUMN IF NOT EXISTS error_class text,
  ADD COLUMN IF NOT EXISTS verification jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS rinpo_actions_org_idempotency_uniq
  ON public.rinpo_actions (organization_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS rinpo_actions_company_os_pending_idx
  ON public.rinpo_actions (organization_id, created_at DESC)
  WHERE source_domain = 'company-os' AND status = 'pending';

-- ---------------------------------------------------------------------------
-- 2. Helpers (SECURITY INVOKER only — no SECURITY DEFINER, see PR #115)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.company_os_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- True when `p_action_id` is a Company OS ledger row of type `p_action_type`, in this
-- organisation, that a *human approver* has approved. Runs as the caller, so the ledger's own
-- RLS applies. Used in WITH CHECK clauses so high-risk writes (payments, contract signature,
-- invoice issue/void, publishing) cannot happen without an approval row.
CREATE OR REPLACE FUNCTION private.company_os_is_approved_action(
  p_org uuid,
  p_action_id uuid,
  p_action_type text
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT p_action_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.rinpo_actions a
    WHERE a.id = p_action_id
      AND a.organization_id = p_org
      AND a.action_type = p_action_type
      AND a.source_domain = 'company-os'
      AND a.status IN ('approved', 'executed')
      AND a.approved_by IS NOT NULL
  );
$$;

-- Ledger state-machine guard. Enforced in the database so a client holding a valid session
-- cannot self-approve, tamper with an approved payload, or skip approval by calling PostgREST
-- directly. Applies only to source_domain = 'company-os'. Calls with no end-user (service role,
-- migrations, cron) are not constrained here.
CREATE OR REPLACE FUNCTION private.company_os_guard_ledger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_decider_perm text;
  v_can_decide boolean;
  v_is_admin boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.source_domain IS DISTINCT FROM 'company-os' THEN
      RETURN NEW;
    END IF;
    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'company-os ledger rows must be created pending' USING ERRCODE = '42501';
    END IF;
    IF NEW.idempotency_key IS NULL OR NEW.payload_hash IS NULL OR NEW.risk_level IS NULL
       OR NEW.requires_approval IS NULL OR NEW.actor_kind IS NULL THEN
      RAISE EXCEPTION 'company-os ledger row is missing required governance fields' USING ERRCODE = '23514';
    END IF;
    IF NEW.risk_level IN ('HIGH', 'CRITICAL') AND NEW.requires_approval IS NOT TRUE THEN
      RAISE EXCEPTION 'HIGH/CRITICAL actions must require approval' USING ERRCODE = '42501';
    END IF;
    IF NEW.approved_by IS NOT NULL THEN
      RAISE EXCEPTION 'approved_by cannot be set on creation' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF OLD.source_domain IS DISTINCT FROM 'company-os' THEN
    RETURN NEW;
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.action_type IS DISTINCT FROM OLD.action_type
     OR NEW.input IS DISTINCT FROM OLD.input
     OR NEW.payload_hash IS DISTINCT FROM OLD.payload_hash
     OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
     OR NEW.risk_level IS DISTINCT FROM OLD.risk_level
     OR NEW.requires_approval IS DISTINCT FROM OLD.requires_approval
     OR NEW.distinct_approver IS DISTINCT FROM OLD.distinct_approver
     OR NEW.approver_permission IS DISTINCT FROM OLD.approver_permission
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.actor_kind IS DISTINCT FROM OLD.actor_kind
     OR NEW.agent_role IS DISTINCT FROM OLD.agent_role
     OR NEW.source_domain IS DISTINCT FROM OLD.source_domain
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'company-os ledger identity, payload and policy fields are immutable' USING ERRCODE = '42501';
  END IF;

  IF OLD.status IN ('executed', 'failed', 'rejected') THEN
    RAISE EXCEPTION 'company-os ledger row is final (%)', OLD.status USING ERRCODE = '42501';
  END IF;

  v_decider_perm := COALESCE(NULLIF(OLD.approver_permission, ''), 'approvals.decide');

  -- Same logic as private.has_permission(), inlined: end-user roles have no USAGE on schema
  -- "private", and this function is SECURITY INVOKER (never SECURITY DEFINER). The caller can
  -- already read their own membership and the role/permission catalogue under RLS.
  SELECT
    COALESCE(bool_or(p.key = v_decider_perm), false),
    COALESCE(bool_or(p.key = 'org.manage'), false)
  INTO v_can_decide, v_is_admin
  FROM public.organization_members m
  JOIN public.roles r ON r.id = m.role_id
  JOIN public.role_permissions rp ON rp.role_id = r.id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE m.organization_id = OLD.organization_id
    AND m.user_id = v_uid
    AND m.status = 'active'
    AND p.key IN (v_decider_perm, 'org.manage');

  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    IF OLD.requires_approval IS NOT TRUE THEN
      RAISE EXCEPTION 'this action does not require approval' USING ERRCODE = '42501';
    END IF;
    IF NOT v_can_decide THEN
      RAISE EXCEPTION 'approver lacks permission %', v_decider_perm USING ERRCODE = '42501';
    END IF;
    IF OLD.expires_at IS NOT NULL AND OLD.expires_at < now() THEN
      RAISE EXCEPTION 'approval request has expired' USING ERRCODE = '42501';
    END IF;
    IF OLD.risk_level = 'CRITICAL' AND NOT v_is_admin THEN
      RAISE EXCEPTION 'CRITICAL actions require an admin or founder approver' USING ERRCODE = '42501';
    END IF;
    IF NEW.status = 'approved' THEN
      IF NEW.approved_by IS DISTINCT FROM v_uid THEN
        RAISE EXCEPTION 'approved_by must be the approving user' USING ERRCODE = '42501';
      END IF;
      IF COALESCE(OLD.distinct_approver, true) AND OLD.actor_kind IS DISTINCT FROM 'agent' AND OLD.user_id = v_uid THEN
        RAISE EXCEPTION 'the requester cannot approve their own action' USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NEW.approved_by IS NOT NULL THEN
        RAISE EXCEPTION 'a rejected action has no approver' USING ERRCODE = '42501';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('executed', 'failed') THEN
    IF OLD.requires_approval IS NOT FALSE THEN
      RAISE EXCEPTION 'an action that requires approval cannot execute while pending' USING ERRCODE = '42501';
    END IF;
    IF OLD.user_id IS DISTINCT FROM v_uid THEN
      RAISE EXCEPTION 'only the requester may execute a self-service action' USING ERRCODE = '42501';
    END IF;
    IF NEW.approved_by IS NOT NULL THEN
      RAISE EXCEPTION 'approved_by cannot be set on a no-approval action' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'approved' AND NEW.status IN ('executed', 'failed') THEN
    IF v_uid IS DISTINCT FROM OLD.approved_by AND v_uid IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'only the approver or requester may complete an approved action' USING ERRCODE = '42501';
    END IF;
    IF NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
      RAISE EXCEPTION 'approver cannot change after approval' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'invalid company-os ledger transition % -> %', OLD.status, NEW.status USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS company_os_guard_ledger ON public.rinpo_actions;
CREATE TRIGGER company_os_guard_ledger
  BEFORE INSERT OR UPDATE ON public.rinpo_actions
  FOR EACH ROW EXECUTE FUNCTION private.company_os_guard_ledger();

REVOKE ALL ON FUNCTION private.company_os_touch_updated_at() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.company_os_guard_ledger() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.company_os_is_approved_action(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.company_os_is_approved_action(uuid, uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Ledger policies (additive; the trigger is the state-machine arbiter)
-- ---------------------------------------------------------------------------
-- Requester resolves their own self-service rows; deciders resolve approval rows.
CREATE POLICY cos_rinpo_actions_update ON public.rinpo_actions
  FOR UPDATE TO authenticated
  USING (
    source_domain = 'company-os'
    AND private.is_org_member(organization_id)
    AND (user_id = auth.uid() OR private.has_permission(organization_id, 'approvals.decide'))
  )
  WITH CHECK (source_domain = 'company-os' AND private.is_org_member(organization_id));

-- Company OS payloads (amounts, client data) are visible to the requester and to approvers /
-- queue readers only — not to every org member (the legacy select policy is member-wide).
CREATE POLICY cos_rinpo_actions_select_guard ON public.rinpo_actions
  AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    source_domain IS DISTINCT FROM 'company-os'
    OR user_id = auth.uid()
    OR private.has_permission(organization_id, 'approvals.read')
  );

CREATE POLICY cos_rinpo_actions_insert_guard ON public.rinpo_actions
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (source_domain IS DISTINCT FROM 'company-os' OR status = 'pending');

-- ---------------------------------------------------------------------------
-- 4. Canonical events + audit written from the caller's own session
-- ---------------------------------------------------------------------------
CREATE POLICY cos_business_events_insert ON public.business_events
  FOR INSERT TO authenticated
  WITH CHECK (
    source = 'company-os'
    AND private.is_org_member(organization_id)
    AND (
      (actor_type = 'user' AND actor_id = auth.uid()::text)
      OR (actor_type = 'ai' AND metadata ->> 'onBehalfOf' = auth.uid()::text)
    )
  );

CREATE POLICY cos_business_events_select_guard ON public.business_events
  AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    source IS DISTINCT FROM 'company-os'
    OR private.has_permission(organization_id, 'reports.read')
  );

-- A member may only write Company OS audit rows as themselves (or as an agent acting for them).
CREATE POLICY cos_audit_logs_insert_guard ON public.audit_logs
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    source IS DISTINCT FROM 'company-os'
    OR (
      (actor_id = auth.uid()::text OR (actor_id LIKE 'agent:%' AND right(actor_id, 36) = auth.uid()::text))
      AND (approved_by IS NULL OR approved_by = auth.uid())
    )
  );
