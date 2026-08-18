-- Add enabled_modules to organization settings for onboarding V2

ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS enabled_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS business_type text;

COMMENT ON COLUMN public.organization_settings.enabled_modules IS 'Module IDs selected during onboarding (customers, projects, finance, etc.)';
COMMENT ON COLUMN public.organization_settings.business_type IS 'Business type selected during onboarding (agency, salon, retail, etc.)';
