import type { ProductStatusValue } from "@/lib/product-status";

export type CaseStudyApproval = "approved" | "draft" | "internal_only";

export type CaseStudy = {
  slug: string;
  customerName: string;
  industry: string;
  location: string;
  logo?: string;
  problem: string;
  previousWorkflow: string;
  rinadsSolution: string;
  operatingSystems: string[];
  implementationScope: string;
  timeline: string;
  integrations: string[];
  results: string;
  /** Only include metrics that are verified and approved for publication. */
  verifiedMetrics: { label: string; value: string }[];
  quote?: { text: string; attribution: string };
  approvalStatus: CaseStudyApproval;
  productStatusNote?: string;
};

/**
 * Public case studies. Never invent customers or metrics.
 * Empty list is intentional until approved stories exist.
 */
export const CASE_STUDIES: CaseStudy[] = [];

export function getPublishedCaseStudies(): CaseStudy[] {
  return CASE_STUDIES.filter((study) => study.approvalStatus === "approved");
}

export function getCaseStudy(slug: string): CaseStudy | null {
  return getPublishedCaseStudies().find((study) => study.slug === slug) ?? null;
}

export type IntegrationStatus = "live" | "beta" | "private_preview" | "planned";

export type Integration = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  status: IntegrationStatus;
  productStatus: ProductStatusValue;
  href: string;
};

/**
 * Only list integrations that are real. Do not display fake partner logos.
 */
export const INTEGRATIONS: Integration[] = [
  {
    slug: "razorpay",
    name: "Razorpay",
    category: "Payments",
    summary: "Checkout and payment capture for supported commerce and services flows.",
    status: "live",
    productStatus: "generally_available",
    href: "/integrations/razorpay",
  },
  {
    slug: "whatsapp",
    name: "WhatsApp Business",
    category: "Communications",
    summary: "Business messaging workflows where provider credentials and templates are configured.",
    status: "private_preview",
    productStatus: "private_preview",
    href: "/integrations/whatsapp",
  },
  {
    slug: "meta-ads",
    name: "Meta Ads",
    category: "Marketing",
    summary: "Campaign connection paths for Marketing OS — availability depends on organisation setup.",
    status: "planned",
    productStatus: "coming_soon",
    href: "/integrations/meta-ads",
  },
];

export function getIntegration(slug: string): Integration | null {
  return INTEGRATIONS.find((item) => item.slug === slug) ?? null;
}

export type SecurityControlStatus =
  | "implemented"
  | "partial"
  | "in_progress"
  | "planned"
  | "not_currently_claimed";

export type SecurityControl = {
  id: string;
  title: string;
  summary: string;
  status: SecurityControlStatus;
};

/**
 * Security claims must match verified posture. Prefer honest status badges
 * over compliance marketing language.
 */
export const SECURITY_CONTROLS: SecurityControl[] = [
  {
    id: "overview",
    title: "Security overview",
    summary:
      "RINADS is designed so AI assistance operates inside organisation context, permissions, and human approval where required.",
    status: "in_progress",
  },
  {
    id: "identity",
    title: "Identity & authentication",
    summary: "Organisation membership and authenticated sessions gate product access.",
    status: "implemented",
  },
  {
    id: "tenant",
    title: "Tenant isolation",
    summary: "Business data access is organised around organisation context rather than a shared global workspace.",
    status: "implemented",
  },
  {
    id: "permissions",
    title: "Permissions",
    summary: "Product actions are intended to respect the same authorization boundaries as the operating system.",
    status: "partial",
  },
  {
    id: "approvals",
    title: "Human approval",
    summary: "Sensitive or meaningful actions can be held for review instead of treating AI output as automatic authority.",
    status: "partial",
  },
  {
    id: "audit",
    title: "Audit / event architecture",
    summary: "Event and audit primitives exist so important system activity can remain traceable.",
    status: "partial",
  },
  {
    id: "data-handling",
    title: "Data handling",
    summary: "Data handling practices will be published in counsel-approved privacy and DPA materials.",
    status: "in_progress",
  },
  {
    id: "ai-providers",
    title: "AI / model providers",
    summary: "Model provider use depends on deployment configuration. No blanket retention or training claim is published here.",
    status: "not_currently_claimed",
  },
  {
    id: "encryption",
    title: "Encryption",
    summary: "Transport encryption is used for public HTTPS surfaces. Broader encryption claims require verified inventory.",
    status: "partial",
  },
  {
    id: "backup",
    title: "Backup & recovery",
    summary: "Backup and recovery posture depends on the deployed environment and is not published as a universal SLA here.",
    status: "not_currently_claimed",
  },
  {
    id: "secure-dev",
    title: "Secure development",
    summary: "Secure development practices are evolving with the platform. Formal programme claims are not published yet.",
    status: "in_progress",
  },
  {
    id: "incident",
    title: "Incident response",
    summary: "Incident response process will be published when counsel-approved and operationally ready.",
    status: "planned",
  },
  {
    id: "subprocessors",
    title: "Subprocessors",
    summary: "See /legal/subprocessors when the counsel-approved list is published.",
    status: "planned",
  },
  {
    id: "compliance",
    title: "Compliance status",
    summary:
      "No SOC 2, ISO 27001, GDPR, DPDP, or HIPAA compliance certification is claimed on this page unless explicitly verified and approved.",
    status: "not_currently_claimed",
  },
  {
    id: "vuln",
    title: "Vulnerability reporting",
    summary: "Report suspected vulnerabilities through the security contact channel below.",
    status: "planned",
  },
  {
    id: "contact",
    title: "Security contact",
    summary: "Use /contact?intent=security or the company contact path for security questions.",
    status: "partial",
  },
];
