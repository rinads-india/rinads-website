import {
  INDUSTRY_FAMILIES,
  RINADS_INDUSTRIES,
  resolveIndustryTemplate,
  type IndustryId,
} from "@rinads/platform/industries";

export const ONBOARDING_MODULES = [
  { id: "customers", label: "Customers", description: "Leads, CRM, and follow-ups" },
  { id: "projects", label: "Projects", description: "Projects, tasks, and calendar" },
  { id: "finance", label: "Finance", description: "Invoices, payments, and reports" },
  { id: "marketing", label: "Marketing", description: "Campaigns, SEO, and analytics" },
  { id: "automation", label: "Automation", description: "Workflows and integrations" },
  { id: "analytics", label: "Analytics", description: "Insights and reporting" },
] as const;

export type OnboardingModuleId = (typeof ONBOARDING_MODULES)[number]["id"];

export const BUSINESS_TYPES = RINADS_INDUSTRIES;
export type BusinessTypeId = IndustryId;

export const BUSINESS_TYPE_GROUPS = INDUSTRY_FAMILIES.map((family) => ({
  id: family.id,
  label: family.label,
  industries: RINADS_INDUSTRIES.filter((industry) => industry.familyId === family.id),
})).filter((family) => family.industries.length > 0);

export const BUSINESS_STAGES = [
  { id: "idea", label: "Idea / Pre-launch" },
  { id: "startup", label: "Startup" },
  { id: "growing", label: "Growing business" },
  { id: "established", label: "Established business" },
  { id: "enterprise", label: "Enterprise" },
] as const;

export const EMPLOYEE_BANDS = [
  "1",
  "2-5",
  "6-10",
  "11-25",
  "26-50",
  "51-100",
  "101-250",
  "251-500",
  "500+",
] as const;

export const REVENUE_BANDS = [
  "Pre-revenue",
  "Under ₹10L",
  "₹10L-₹50L",
  "₹50L-₹1Cr",
  "₹1Cr-₹5Cr",
  "₹5Cr-₹25Cr",
  "₹25Cr-₹100Cr",
  "₹100Cr+",
  "Prefer not to say",
] as const;

// Existing tenants and old onboarding links can still submit pre-registry IDs.
const LEGACY_BUSINESS_TYPE_ALIASES: Record<string, string> = {
  agency: "advertising-marketing",
  retail: "retail-brick-mortar",
  "professional-services": "consulting",
  landscape: "landscaping",
  education: "education-schools-tutoring",
};

const INDUSTRY_REGISTRY_SCHEMA_IDENTIFIERS = [
  "primary_industry_id",
  "business_description",
  "business_stage",
  "website_url",
  "country_code",
  "state_region",
  "city",
  "employee_band",
  "annual_revenue_band",
  "organization_industries",
] as const;

export function resolveTemplateForBusinessType(businessType: string): string {
  return resolveIndustryTemplate(LEGACY_BUSINESS_TYPE_ALIASES[businessType] ?? businessType);
}

/**
 * During a production migration-history incident the application can deploy before
 * the additive Industry Registry migration is accepted by Supabase. Only that
 * narrow schema-missing case may be deferred; permission/RLS/data errors must fail.
 */
export function isIndustryRegistrySchemaUnavailable(message: string): boolean {
  const normalized = message.toLowerCase();
  const isMissingSchemaError =
    normalized.includes("schema cache") ||
    normalized.includes("does not exist") ||
    normalized.includes("could not find the");

  return (
    isMissingSchemaError &&
    INDUSTRY_REGISTRY_SCHEMA_IDENTIFIERS.some((identifier) =>
      normalized.includes(identifier)
    )
  );
}
