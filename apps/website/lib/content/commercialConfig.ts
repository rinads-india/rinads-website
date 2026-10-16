/**
 * Commercial packaging and price-visibility gate.
 * Numeric prices render only when priceApproved is true.
 */
import type { ProductStatusValue } from "@/lib/product-status";
import { OS_AVAILABILITY, type OperatingSystemAvailability } from "./productCatalog";

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
  multiLocation: string;
  implementation: string;
  customWorkflows: string;
  businessOs: string;
  commerce: string;
  marketing: string;
  automation: string;
  cta: { label: string; href: string };
  featured?: boolean;
};

/**
 * Flip to true only after commercial/counsel approval of public rates.
 * When false, UI shows "Configured pricing" — never blank price fields.
 */
export const COMMERCIAL_CONFIG = {
  priceApproved: false as boolean,
  currency: "INR" as const,
  configuredPricingLabel: "Configured pricing",
  configuredPricingExplanation:
    "Pricing depends on team size, operating systems, integrations and implementation requirements.",
  estimateCta: {
    label: "Get my pricing estimate",
    href: "/contact?intent=sales&flow=pricing-estimate",
  },
  homepageTeaser: "Choose the operating coverage your business needs.",
} as const;

export const PRICE_APPROVED = COMMERCIAL_CONFIG.priceApproved;

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
    includedAiAllowance: "Starter AI / RINPO allowance",
    includedAutomationAllowance: "Core automation allowance",
    includedOperatingSystems: ["Business OS"],
    integrations: "Selected standard integrations",
    supportLevel: "Standard support",
    multiLocation: "Single location",
    implementation: "Self-serve onboarding guidance",
    customWorkflows: "Core workflows",
    businessOs: "Included",
    commerce: "Add-on",
    marketing: "Add-on",
    automation: "Core allowance",
    cta: {
      label: COMMERCIAL_CONFIG.estimateCta.label,
      href: "/contact?intent=demo&plan=start",
    },
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
    includedAiAllowance: "Expanded AI / RINPO allowance",
    includedAutomationAllowance: "Expanded automation allowance",
    includedOperatingSystems: ["Business OS", "Commerce OS", "Marketing OS"],
    integrations: "Standard + priority integrations",
    supportLevel: "Priority support",
    multiLocation: "Multi-location ready",
    implementation: "Guided implementation available",
    customWorkflows: "Standard custom workflows",
    businessOs: "Included",
    commerce: "Included",
    marketing: "Included",
    automation: "Expanded allowance",
    cta: {
      label: COMMERCIAL_CONFIG.estimateCta.label,
      href: "/contact?intent=sales&plan=grow",
    },
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
    includedAiAllowance: "Scale AI / RINPO allowance",
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
    multiLocation: "Multi-location included",
    implementation: "Implementation engagement",
    customWorkflows: "Advanced custom workflows",
    businessOs: "Included",
    commerce: "Included",
    marketing: "Included",
    automation: "Included",
    cta: {
      label: "Talk to sales",
      href: "/contact?intent=sales&plan=scale",
    },
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
    includedAiAllowance: "Custom AI / RINPO allowance",
    includedAutomationAllowance: "Custom automation allowance",
    includedOperatingSystems: ["Configured operating systems"],
    integrations: "Custom and private integrations",
    supportLevel: "Enterprise success & implementation",
    multiLocation: "Custom multi-location / multi-brand",
    implementation: "Dedicated implementation",
    customWorkflows: "Fully custom",
    businessOs: "Configured",
    commerce: "Configured",
    marketing: "Configured",
    automation: "Configured",
    cta: {
      label: "Talk to sales",
      href: "/contact?intent=sales&plan=enterprise",
    },
  },
];

export const PRICING_NOTES = {
  softwareVsServices:
    "Implementation services are priced separately when migration, integrations, configuration or custom workflow development is required.",
  availabilityNote:
    "Published plan architecture is editable commercial configuration. Numeric prices appear only after commercial approval.",
} as const;

export const PRICING_COMPARISON_ROWS: {
  key: keyof PricingPlan | "idealSize";
  label: string;
  get: (plan: PricingPlan) => string;
}[] = [
  { key: "idealSize", label: "Ideal business size", get: (p) => p.targetCustomer },
  { key: "includedUsers", label: "Users / seats", get: (p) => p.includedUsers },
  { key: "businessOs", label: "Business OS", get: (p) => p.businessOs },
  { key: "commerce", label: "Commerce", get: (p) => p.commerce },
  { key: "marketing", label: "Marketing", get: (p) => p.marketing },
  { key: "automation", label: "Automation", get: (p) => p.automation },
  { key: "includedAiAllowance", label: "AI / RINPO allowance", get: (p) => p.includedAiAllowance },
  { key: "integrations", label: "Integrations", get: (p) => p.integrations },
  { key: "supportLevel", label: "Support", get: (p) => p.supportLevel },
  { key: "multiLocation", label: "Multi-location", get: (p) => p.multiLocation },
  { key: "implementation", label: "Implementation", get: (p) => p.implementation },
  { key: "customWorkflows", label: "Custom workflows", get: (p) => p.customWorkflows },
];

export const PRICING_FAQ: { question: string; answer: string }[] = [
  {
    question: "How is RINADS pricing calculated?",
    answer:
      "Pricing depends on team size, which operating systems you need, integrations, and whether implementation or custom workflows are required. We configure a package around your operating coverage rather than a one-size public rate.",
  },
  {
    question: "Can I try RINADS before buying?",
    answer:
      "Yes. You can try RINPO on the website with a demo workspace, and you can book a demo to walk through workflows that match your business.",
  },
  {
    question: "What is a RINADS Operating System?",
    answer:
      "An Operating System is a connected product suite on the shared RINADS core — for example Business OS for customers, work and money, or Commerce OS for products, orders and fulfilment. Industry solutions layer configuration and RINPO context on top.",
  },
  {
    question: "Is implementation included?",
    answer:
      "Core onboarding guidance is available on Start. Guided or dedicated implementation is available on Grow, Scale and Enterprise when migration, integrations or custom configuration are needed. Implementation services may be priced separately.",
  },
  {
    question: "Can RINADS replace my current tools?",
    answer:
      "Many teams consolidate CRM, spreadsheets, commerce and project tools onto RINADS. Replacement scope depends on your workflows — we map that during discovery and implementation planning.",
  },
  {
    question: "Can I start with only Business OS?",
    answer:
      "Yes. Start is designed around Business OS. You can add Commerce, Marketing, Automation and other systems as your operating coverage grows.",
  },
  {
    question: "Can RINADS support multiple branches?",
    answer:
      "Grow and above are multi-location ready. Scale and Enterprise support broader multi-team and multi-brand configurations.",
  },
  {
    question: "What does RINPO do?",
    answer:
      "RINPO is the AI interface across RINADS. It can understand permitted business context, explain what matters, prepare next steps and route supported actions through the right permissions and approval paths.",
  },
  {
    question: "Can RINPO perform actions automatically?",
    answer:
      "RINPO can recommend and prepare actions, but recommendation does not equal execution permission. Supported actions go through role-based access and human approval where required. RINPO cannot bypass permissions.",
  },
  {
    question: "How is business data protected?",
    answer:
      "Data is encrypted in transit. Access is role-based, actions are permission-aware, and human approval is required where configured. See the Security page for implemented controls — we do not claim certifications we have not obtained.",
  },
];

export const PRICING_TRUST_ITEMS = [
  { label: "Encrypted in transit", href: undefined },
  { label: "Role-based access", href: undefined },
  { label: "Permission-aware actions", href: undefined },
  { label: "Human approval where required", href: undefined },
  { label: "View Security", href: "/security" },
] as const;

export type { OperatingSystemAvailability, ProductStatusValue };
export { OS_AVAILABILITY };
export { getOsAvailability } from "./productCatalog";
