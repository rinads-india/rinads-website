-- Public website lead capture (service-role insert only; no secrets columns)

CREATE TABLE IF NOT EXISTS public.site_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome TEXT NOT NULL,
  name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  company_size TEXT NOT NULL,
  industry TEXT NOT NULL,
  current_tools TEXT,
  problem TEXT NOT NULL,
  timeline TEXT NOT NULL,
  budget TEXT,
  message TEXT,
  intent TEXT,
  plan TEXT,
  source_path TEXT,
  privacy_accepted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_leads_created_at_idx ON public.site_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS site_leads_work_email_idx ON public.site_leads (work_email);

ALTER TABLE public.site_leads ENABLE ROW LEVEL SECURITY;

-- Deny-all for anon/authenticated. Inserts go through the service role
-- (bypasses RLS). No public SELECT/INSERT/UPDATE/DELETE policies.
REVOKE ALL ON public.site_leads FROM anon, authenticated;
GRANT SELECT, INSERT ON public.site_leads TO service_role;
