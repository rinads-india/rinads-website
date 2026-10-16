-- Company OS (issue #127) — 3/7: CRM and sales (lead → company/contact → opportunity → proposal → contract).
-- Additive only. Every table is organisation-scoped with deliberate RLS:
--   * SELECT  → crm.read
--   * INSERT/UPDATE → crm.manage (+ approval evidence for proposal "sent" and contract "signed")
--   * no DELETE policy (records are retired by status, never destroyed)
-- Cross-links use composite (organization_id, id) foreign keys so a child row can never reference
-- another tenant's parent, even by a crafted request.

CREATE TABLE IF NOT EXISTS public.crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  relationship text NOT NULL DEFAULT 'prospect' CHECK (relationship IN ('prospect', 'client', 'partner', 'churned')),
  priority text NOT NULL DEFAULT 'standard' CHECK (priority IN ('strategic', 'standard', 'low')),
  industry text,
  website text,
  company_size text,
  owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_companies_org_name_uniq ON public.crm_companies (organization_id, lower(btrim(name)));
CREATE INDEX IF NOT EXISTS crm_companies_org_rel_idx ON public.crm_companies (organization_id, relationship);

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id uuid,
  full_name text NOT NULL CHECK (length(btrim(full_name)) > 0),
  email text,
  phone text,
  role_title text,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.crm_companies (organization_id, id)
);
CREATE INDEX IF NOT EXISTS crm_contacts_org_company_idx ON public.crm_contacts (organization_id, company_id);
CREATE INDEX IF NOT EXISTS crm_contacts_org_email_idx ON public.crm_contacts (organization_id, lower(email));

CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id uuid,
  contact_id uuid,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  kind text NOT NULL DEFAULT 'new' CHECK (kind IN ('new', 'renewal', 'upsell')),
  stage text NOT NULL DEFAULT 'discovery' CHECK (stage IN ('discovery', 'solution', 'proposal', 'negotiation', 'won', 'lost')),
  amount numeric(14, 2) CHECK (amount IS NULL OR amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  probability integer CHECK (probability IS NULL OR probability BETWEEN 0 AND 100),
  expected_close_date date,
  owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  stage_changed_at timestamptz NOT NULL DEFAULT now(),
  lost_reason text,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.crm_companies (organization_id, id),
  FOREIGN KEY (organization_id, contact_id) REFERENCES public.crm_contacts (organization_id, id)
);
CREATE INDEX IF NOT EXISTS crm_opportunities_org_stage_idx ON public.crm_opportunities (organization_id, stage);
CREATE INDEX IF NOT EXISTS crm_opportunities_org_company_idx ON public.crm_opportunities (organization_id, company_id);

CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  email text,
  phone text,
  company_name text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'disqualified', 'converted')),
  source text NOT NULL DEFAULT 'manual',
  -- Stable external identifier (e.g. site_leads.id) so imports are idempotent.
  source_ref text,
  problem text,
  budget text,
  timeline text,
  owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  last_contacted_at timestamptz,
  disqualified_reason text,
  converted_company_id uuid,
  converted_contact_id uuid,
  converted_opportunity_id uuid,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, converted_company_id) REFERENCES public.crm_companies (organization_id, id),
  FOREIGN KEY (organization_id, converted_contact_id) REFERENCES public.crm_contacts (organization_id, id),
  FOREIGN KEY (organization_id, converted_opportunity_id) REFERENCES public.crm_opportunities (organization_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_org_source_ref_uniq ON public.crm_leads (organization_id, source_ref) WHERE source_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_leads_org_status_idx ON public.crm_leads (organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.crm_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  opportunity_id uuid,
  company_id uuid,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  amount numeric(14, 2) CHECK (amount IS NULL OR amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  valid_until date,
  sent_at timestamptz,
  document_ref text,
  -- Ledger row (rinpo_actions) that approved sending this proposal to the client.
  sent_action_id uuid,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, opportunity_id) REFERENCES public.crm_opportunities (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.crm_companies (organization_id, id)
);
CREATE INDEX IF NOT EXISTS crm_proposals_org_status_idx ON public.crm_proposals (organization_id, status);

CREATE TABLE IF NOT EXISTS public.crm_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id uuid,
  opportunity_id uuid,
  proposal_id uuid,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'declined', 'cancelled')),
  contract_value numeric(14, 2) CHECK (contract_value IS NULL OR contract_value >= 0),
  currency text NOT NULL DEFAULT 'INR',
  start_date date,
  end_date date,
  signed_at timestamptz,
  signed_by_name text,
  document_ref text,
  -- Ledger row that approved recording the signature (CRITICAL action).
  sign_action_id uuid,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, company_id) REFERENCES public.crm_companies (organization_id, id),
  FOREIGN KEY (organization_id, opportunity_id) REFERENCES public.crm_opportunities (organization_id, id),
  FOREIGN KEY (organization_id, proposal_id) REFERENCES public.crm_proposals (organization_id, id)
);
CREATE INDEX IF NOT EXISTS crm_contracts_org_status_idx ON public.crm_contracts (organization_id, status);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contracts ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crm_companies', 'crm_contacts', 'crm_opportunities', 'crm_leads']
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, %L))',
      'cos_' || t || '_select', t, 'crm.read');
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_permission(organization_id, %L) AND created_by = auth.uid())',
      'cos_' || t || '_insert', t, 'crm.manage');
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.has_permission(organization_id, %L)) WITH CHECK (private.has_permission(organization_id, %L))',
      'cos_' || t || '_update', t, 'crm.manage', 'crm.manage');
  END LOOP;
END $$;

-- Proposals: a proposal can only leave "draft" with an approved proposal.send ledger row.
CREATE POLICY cos_crm_proposals_select ON public.crm_proposals
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'crm.read'));
CREATE POLICY cos_crm_proposals_insert ON public.crm_proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'crm.manage')
    AND created_by = auth.uid()
    AND (status = 'draft' OR private.company_os_is_approved_action(organization_id, sent_action_id, 'proposal.send'))
  );
CREATE POLICY cos_crm_proposals_update ON public.crm_proposals
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'crm.manage'))
  WITH CHECK (
    private.has_permission(organization_id, 'crm.manage')
    AND (status = 'draft' OR private.company_os_is_approved_action(organization_id, sent_action_id, 'proposal.send'))
  );

-- Contracts: "signed" requires an approved contract.sign ledger row (CRITICAL).
CREATE POLICY cos_crm_contracts_select ON public.crm_contracts
  FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id) AND private.has_permission(organization_id, 'crm.read'));
CREATE POLICY cos_crm_contracts_insert ON public.crm_contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_permission(organization_id, 'crm.manage')
    AND created_by = auth.uid()
    AND (status <> 'signed' OR private.company_os_is_approved_action(organization_id, sign_action_id, 'contract.sign'))
  );
CREATE POLICY cos_crm_contracts_update ON public.crm_contracts
  FOR UPDATE TO authenticated
  USING (private.has_permission(organization_id, 'crm.manage'))
  WITH CHECK (
    private.has_permission(organization_id, 'crm.manage')
    AND (status <> 'signed' OR private.company_os_is_approved_action(organization_id, sign_action_id, 'contract.sign'))
  );

-- Hardening + updated_at maintenance.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crm_companies', 'crm_contacts', 'crm_opportunities', 'crm_leads', 'crm_proposals', 'crm_contracts']
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'cos_' || t || '_touch', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.company_os_touch_updated_at()', 'cos_' || t || '_touch', t);
  END LOOP;
END $$;
