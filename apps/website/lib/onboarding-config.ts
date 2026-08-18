export const ONBOARDING_MODULES = [
  { id: "customers", label: "Customers", description: "Leads, CRM, and follow-ups" },
  { id: "projects", label: "Projects", description: "Projects, tasks, and calendar" },
  { id: "finance", label: "Finance", description: "Invoices, payments, and reports" },
  { id: "marketing", label: "Marketing", description: "Campaigns, SEO, and analytics" },
  { id: "automation", label: "Automation", description: "Workflows and integrations" },
  { id: "analytics", label: "Analytics", description: "Insights and reporting" },
] as const;

export type OnboardingModuleId = (typeof ONBOARDING_MODULES)[number]["id"];

export const BUSINESS_TYPES = [
  { id: "agency", label: "Agency", templateKey: "generic-retail" },
  { id: "salon", label: "Salon", templateKey: "generic-retail" },
  { id: "retail", label: "Retail", templateKey: "generic-retail" },
  { id: "professional-services", label: "Professional Services", templateKey: "generic-retail" },
  { id: "construction", label: "Construction", templateKey: "ambady-nursery" },
  { id: "landscape", label: "Landscape", templateKey: "ambady-nursery" },
  { id: "education", label: "Education", templateKey: "generic-retail" },
  { id: "other", label: "Other", templateKey: "generic-retail" },
] as const;

export type BusinessTypeId = (typeof BUSINESS_TYPES)[number]["id"];

export function resolveTemplateForBusinessType(businessType: BusinessTypeId): string {
  return BUSINESS_TYPES.find((t) => t.id === businessType)?.templateKey ?? "generic-retail";
}
