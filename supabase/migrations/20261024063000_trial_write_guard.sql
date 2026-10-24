-- Release B5: database-authoritative write entitlement for the launch Business OS slice.
-- Reads remain governed by the existing organization membership policies.
-- Writes to customers/tasks require membership plus an operator, paid, or live trial entitlement.
-- Rollback: restore the previous membership-only insert/update policies and drop private.org_can_write.

CREATE OR REPLACE FUNCTION private.org_can_write(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = p_org_id
        AND o.status = 'active'
        AND o.is_platform_operator = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.organization_subscriptions s
      WHERE s.organization_id = p_org_id
        AND s.status = 'active'
        AND (s.ends_at IS NULL OR s.ends_at > now())
    )
    OR EXISTS (
      SELECT 1
      FROM public.trial_grants tg
      WHERE tg.organization_id = p_org_id
        AND tg.revoked_at IS NULL
        AND tg.expires_at > now()
    );
$$;

REVOKE ALL ON FUNCTION private.org_can_write(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.org_can_write(UUID) TO authenticated;

DROP POLICY IF EXISTS cos_contacts_insert_member ON public.cos_contacts;
CREATE POLICY cos_contacts_insert_member
  ON public.cos_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.is_org_member(organization_id)
    AND private.org_can_write(organization_id)
  );

DROP POLICY IF EXISTS cos_contacts_update_member ON public.cos_contacts;
CREATE POLICY cos_contacts_update_member
  ON public.cos_contacts
  FOR UPDATE
  TO authenticated
  USING (
    private.is_org_member(organization_id)
    AND private.org_can_write(organization_id)
  )
  WITH CHECK (
    private.is_org_member(organization_id)
    AND private.org_can_write(organization_id)
  );

DROP POLICY IF EXISTS cos_tasks_insert_member ON public.cos_tasks;
CREATE POLICY cos_tasks_insert_member
  ON public.cos_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.is_org_member(organization_id)
    AND private.org_can_write(organization_id)
  );

DROP POLICY IF EXISTS cos_tasks_update_member ON public.cos_tasks;
CREATE POLICY cos_tasks_update_member
  ON public.cos_tasks
  FOR UPDATE
  TO authenticated
  USING (
    private.is_org_member(organization_id)
    AND private.org_can_write(organization_id)
  )
  WITH CHECK (
    private.is_org_member(organization_id)
    AND private.org_can_write(organization_id)
  );
