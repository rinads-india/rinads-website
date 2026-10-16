-- Company OS (issue #127) — 4/7: approval gates, immutability and privilege hardening on the cos_* graph.
--
--   * proposal "sent"        needs an approved `proposal.send`  ledger row (HIGH)
--   * contract "signed"      needs an approved `contract.sign`  ledger row (CRITICAL)
--   * invoice leaves "draft" needs an approved `invoice.issue`; "void" needs an approved `invoice.void`
--   * a payment row          needs an approved `payment.record` ledger row, one approval per payment
--   * payments are an immutable ledger (no UPDATE / DELETE)
-- The ledger is `rinpo_actions` (see 20261016130100). `private.company_os_is_approved_action` checks the
-- row is in this organisation, has the right action type, is approved/executed and (for human HIGH
-- actions) was approved by someone other than the requester.

-- Sales -----------------------------------------------------------------------
DROP POLICY IF EXISTS cos_proposals_select_member ON public.cos_proposals;
DROP POLICY IF EXISTS cos_proposals_insert_member ON public.cos_proposals;
DROP POLICY IF EXISTS cos_proposals_update_member ON public.cos_proposals;
CREATE POLICY cos_proposals_select ON public.cos_proposals
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'sales.read'));
CREATE POLICY cos_proposals_insert ON public.cos_proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'sales.write')
    AND created_by = auth.uid()
    AND (status = 'draft' OR private.company_os_is_approved_action(organization_id, sent_action_id, 'proposal.send'))
  );
CREATE POLICY cos_proposals_update ON public.cos_proposals
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'sales.write'))
  WITH CHECK (
    private.has_permission(organization_id, 'sales.write')
    AND (status = 'draft' OR private.company_os_is_approved_action(organization_id, sent_action_id, 'proposal.send'))
  );

DROP POLICY IF EXISTS cos_contracts_select_member ON public.cos_contracts;
DROP POLICY IF EXISTS cos_contracts_insert_member ON public.cos_contracts;
DROP POLICY IF EXISTS cos_contracts_update_member ON public.cos_contracts;
CREATE POLICY cos_contracts_select ON public.cos_contracts
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'clients.read'));
CREATE POLICY cos_contracts_insert ON public.cos_contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'clients.write')
    AND created_by = auth.uid()
    AND (status NOT IN ('signed', 'active', 'completed') OR private.company_os_is_approved_action(organization_id, sign_action_id, 'contract.sign'))
  );
CREATE POLICY cos_contracts_update ON public.cos_contracts
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'clients.write'))
  WITH CHECK (
    private.has_permission(organization_id, 'clients.write')
    AND (status NOT IN ('signed', 'active', 'completed') OR private.company_os_is_approved_action(organization_id, sign_action_id, 'contract.sign'))
  );

-- Finance ---------------------------------------------------------------------
DROP POLICY IF EXISTS cos_invoices_select_member ON public.cos_invoices;
DROP POLICY IF EXISTS cos_invoices_insert_member ON public.cos_invoices;
DROP POLICY IF EXISTS cos_invoices_update_member ON public.cos_invoices;
CREATE POLICY cos_invoices_select ON public.cos_invoices
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'finance.read'));
CREATE POLICY cos_invoices_insert ON public.cos_invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'finance.write')
    AND created_by = auth.uid()
    AND (status = 'draft' OR private.company_os_is_approved_action(organization_id, issue_action_id, 'invoice.issue'))
  );
CREATE POLICY cos_invoices_update ON public.cos_invoices
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'finance.write'))
  WITH CHECK (
    private.has_permission(organization_id, 'finance.write')
    AND (status = 'draft' OR private.company_os_is_approved_action(organization_id, issue_action_id, 'invoice.issue'))
    AND (status <> 'void' OR issue_action_id IS NULL OR private.company_os_is_approved_action(organization_id, void_action_id, 'invoice.void'))
  );

-- Payments are an immutable ledger: insert-only, and only with an approved payment.record action.
DROP POLICY IF EXISTS cos_payments_select_member ON public.cos_payments;
DROP POLICY IF EXISTS cos_payments_insert_member ON public.cos_payments;
DROP POLICY IF EXISTS cos_payments_update_member ON public.cos_payments;
CREATE POLICY cos_payments_select ON public.cos_payments
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'finance.read'));
CREATE POLICY cos_payments_insert ON public.cos_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'finance.write')
    AND recorded_by = auth.uid()
    AND private.company_os_is_approved_action(organization_id, approved_action_id, 'payment.record')
  );

-- Privileges + updated_at maintenance on every graph table ---------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cos_departments', 'cos_workers', 'cos_capacity_snapshots', 'cos_companies', 'cos_contacts', 'cos_leads',
    'cos_opportunities', 'cos_proposals', 'cos_contracts', 'cos_projects', 'cos_milestones', 'cos_tasks',
    'cos_deliverables', 'cos_invoices', 'cos_payments', 'cos_expenses', 'cos_daily_closings',
    'cos_attention_items', 'cos_approval_items'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY[
    'cos_departments', 'cos_workers', 'cos_companies', 'cos_contacts', 'cos_leads', 'cos_opportunities',
    'cos_proposals', 'cos_contracts', 'cos_projects', 'cos_milestones', 'cos_tasks', 'cos_deliverables', 'cos_invoices'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.company_os_touch_updated_at()', t || '_touch', t);
  END LOOP;
  -- Payments are immutable: also remove UPDATE at the privilege layer.
  REVOKE UPDATE ON public.cos_payments FROM authenticated;
END $$;
