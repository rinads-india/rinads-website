import type { ProductStatusValue } from "@/lib/product-status";

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  targetCustomer: string;
  monthlyPrice: number | "contact" | "coming_soon";
  annualPrice: number | "contact" | "coming_soon";
  currency: "INR" | "USD";
  includedUsers: string;
  includedAiAllowance: string;
  includedAutomationAllowance: string;
  includedOperatingSystems: string[];
  integrations: string;
  supportLevel: string;
  cta: { label: string; href: string };
  featured?: boolean;
};

/**
 * Editable packaging model. Commercial prices are not hard-coded as approved
 * public rates — use contact / coming soon until counsel/commercial sign-off.
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "start",
    name: "Start",
    description: "For small teams consolidating core customer, work, and commerce workflows.",
    targetCustomer: "Solo operators and small teams",
    monthlyPrice: "coming_soon",
    annualPrice: "coming_soon",
    currency: "INR",
    includedUsers: "Configured per workspace",
    includedAiAllowance: "Starter AI allowance",
    includedAutomationAllowance: "Core automation allowance",
    includedOperatingSystems: ["Business OS"],
    integrations: "Selected standard integrations",
    supportLevel: "Standard support",
    cta: { label: "Book a platform demo", href: "/contact?intent=demo&plan=start" },
  },
  {
    id: "grow",
    name: "Grow",
    description: "For growing businesses connecting CRM, commerce, marketing, and automation.",
    targetCustomer: "Growing multi-person teams",
    monthlyPrice: "contact",
    annualPrice: "contact",
    currency: "INR",
    includedUsers: "Expanded seat pack",
    includedAiAllowance: "Expanded AI allowance",
    includedAutomationAllowance: "Expanded automation allowance",
    includedOperatingSystems: ["Business OS", "Commerce OS", "Marketing OS"],
    integrations: "Standard + priority integrations",
    supportLevel: "Priority support",
    cta: { label: "Talk to sales", href: "/contact?intent=sales&plan=grow" },
    featured: true,
  },
  {
    id: "scale",
    name: "Scale",
    description: "For multi-location or multi-team operations that need broader OS coverage.",
    targetCustomer: "Multi-location and multi-team organisations",
    monthlyPrice: "contact",
    annualPrice: "contact",
    currency: "INR",
    includedUsers: "Scale seat pack",
    includedAiAllowance: "Scale AI allowance",
    includedAutomationAllowance: "Scale automation allowance",
    includedOperatingSystems: [
      "Business OS",
      "Commerce OS",
      "Marketing OS",
      "Automation OS",
      "Logistics OS",
    ],
    integrations: "Advanced integrations",
    supportLevel: "Named success contact",
    cta: { label: "Talk to sales", href: "/contact?intent=sales&plan=scale" },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organisations that need custom configuration, governance, and implementation.",
    targetCustomer: "Enterprises and complex multi-brand groups",
    monthlyPrice: "contact",
    annualPrice: "contact",
    currency: "INR",
    includedUsers: "Custom",
    includedAiAllowance: "Custom AI allowance",
    includedAutomationAllowance: "Custom automation allowance",
    includedOperatingSystems: ["Configured operating systems"],
    integrations: "Custom and private integrations",
    supportLevel: "Enterprise success & implementation",
    cta: { label: "Talk to sales", href: "/contact?intent=sales&plan=enterprise" },
  },
];

export const PRICING_NOTES = {
  softwareVsServices:
    "Implementation services are priced separately when migration, integrations, configuration or custom workflow development is required.",
  availabilityNote:
    "Published plan architecture is editable commercial configuration. Numeric prices appear only after commercial approval.",
} as const;

export type OperatingSystemAvailability = {
  slug: string;
  name: string;
  href: string;
  status: ProductStatusValue;
  commercialPriority: "primary" | "secondary" | "foundation";
};

export const OS_AVAILABILITY: OperatingSystemAvailability[] = [
  {
    slug: "business-os",
    name: "Business OS",
    href: "/platform/business-os",
    status: "available_configuration",
    commercialPriority: "primary",
  },
  {
    slug: "commerce-os",
    name: "Commerce OS",
    href: "/platform/commerce-os",
    status: "available_configuration",
    commercialPriority: "primary",
  },
  {
    slug: "marketing-os",
    name: "Marketing OS",
    href: "/platform/marketing-os",
    status: "prototype_demo",
    commercialPriority: "primary",
  },
  {
    slug: "automation-os",
    name: "Automation OS",
    href: "/platform/automation-os",
    status: "prototype_demo",
    commercialPriority: "secondary",
  },
  {
    slug: "logistics-os",
    name: "Logistics OS",
    href: "/platform/logistics-os",
    status: "prototype_demo",
    commercialPriority: "secondary",
  },
  {
    slug: "creative-os",
    name: "Creative OS",
    href: "/platform/creative-os",
    status: "coming_soon",
    commercialPriority: "secondary",
  },
  {
    slug: "build-os",
    name: "Build OS",
    href: "/platform/build-os",
    status: "prototype_demo",
    commercialPriority: "secondary",
  },
  {
    slug: "academy-os",
    name: "Academy OS",
    href: "/platform/academy-os",
    status: "prototype_demo",
    commercialPriority: "secondary",
  },
  {
    slug: "rinads-intelligence",
    name: "RINADS Intelligence",
    href: "/platform/rinads-intelligence",
    status: "available_configuration",
    commercialPriority: "foundation",
  },
  {
    slug: "rinads-cloud",
    name: "RINADS Cloud",
    href: "/platform/rinads-cloud",
    status: "available_configuration",
    commercialPriority: "foundation",
  },
];

export function getOsAvailability(slug: string): OperatingSystemAvailability | undefined {
  return OS_AVAILABILITY.find((item) => item.slug === slug);
}
