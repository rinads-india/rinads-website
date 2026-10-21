/**
 * Commercial packaging and price visibility for RINADS.
 * Keep public rates, packaging and commercial notes centralised here so
 * pricing pages, RINPO knowledge and sales surfaces stay consistent.
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

export type CommercialLayer = {
  id: string;
  name: string;
  price: string;
  description: string;
  note?: string;
  href?: string;
};

export const COMMERCIAL_CONFIG = {
  priceApproved: true as boolean,
  currency: "INR" as const,
  configuredPricingLabel: "Configured pricing",
  configuredPricingExplanation:
    "Pricing depends on team size, operating systems, integrations and implementation requirements.",
  estimateCta: {
    label: "Build my RINADS estimate",
    href: "#pricing-estimator",
  },
  homepageTeaser: "One operating platform. Add the industry depth and intelligence you need.",
  taxNote: "Prices exclude applicable taxes and third-party usage charges unless stated otherwise.",
  annualNote: "Annual plans are priced at roughly ten months of monthly subscription value.",
} as const;

export const PRICE_APPROVED = COMMERCIAL_CONFIG.priceApproved;

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "start",
    name: "Start",
    description: "For small businesses establishing one connected operating foundation.",
    targetCustomer: "Solo operators and small teams",
    monthlyPrice: 2999,
    annualPrice: 29990,
    currency: "INR",
    includedUsers: "Up to 3 internal users",
    includedAiAllowance: "Starter RINPO / RI allowance",
    includedAutomationAllowance: "Core automation allowance",
    includedOperatingSystems: ["Business OS", "RINPO"],
    integrations: "Selected standard integrations",
    supportLevel: "Standard support",
    multiLocation: "Single location",
    implementation: "Self-serve onboarding guidance",
    customWorkflows: "Core workflows",
    businessOs: "Included",
    commerce: "Add-on",
    marketing: "Add-on / pilot where available",
    automation: "Core allowance",
    cta: {
      label: "Choose Start",
      href: "/contact?intent=demo&plan=start",
    },
  },
  {
    id: "grow",
    name: "Grow",
    description: "For growing businesses connecting operations, commerce and customer growth.",
    targetCustomer: "Growing multi-person teams",
    monthlyPrice: 7999,
    annualPrice: 79990,
    currency: "INR",
    includedUsers: "Up to 10 internal users",
    includedAiAllowance: "Expanded RINPO / RI allowance",
    includedAutomationAllowance: "Expanded automation allowance",
    includedOperatingSystems: ["Business OS", "Commerce OS", "RINPO"],
    integrations: "Standard + priority integrations",
    supportLevel: "Priority support",
    multiLocation: "Multi-location ready",
    implementation: "Guided implementation available",
    customWorkflows: "Standard custom workflows",
    businessOs: "Included",
    commerce: "Included",
    marketing: "Add-on / pilot where available",
    automation: "Expanded allowance",
    cta: {
      label: "Choose Grow",
      href: "/contact?intent=sales&plan=grow",
    },
    featured: true,
  },
  {
    id: "scale",
    name: "Scale",
    description: "For multi-team or multi-location operations that need broader governed workflows.",
    targetCustomer: "Multi-location and multi-team organisations",
    monthlyPrice: 19999,
    annualPrice: 199990,
    currency: "INR",
    includedUsers: "Up to 50 internal users",
    includedAiAllowance: "Scale RINPO / RI allowance",
    includedAutomationAllowance: "Scale automation allowance",
    includedOperatingSystems: ["Business OS", "Commerce OS", "RINPO"],
    integrations: "Advanced integrations",
    supportLevel: "Named success contact",
    multiLocation: "Multi-location included",
    implementation: "Implementation engagement",
    customWorkflows: "Advanced custom workflows",
    businessOs: "Included",
    commerce: "Included",
    marketing: "Configured as available",
    automation: "Configured as available",
    cta: {
      label: "Talk to sales",
      href: "/contact?intent=sales&plan=scale",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organisations that need custom governance, integrations, deployment and support.",
    targetCustomer: "Enterprises and complex multi-brand groups",
    monthlyPrice: 49999,
    annualPrice: "contact",
    currency: "INR",
    includedUsers: "Custom",
    includedAiAllowance: "Contracted RINPO / RI pool",
    includedAutomationAllowance: "Contracted automation pool",
    includedOperatingSystems: ["Configured operating systems", "RINPO"],
    integrations: "Custom and private integrations",
    supportLevel: "Enterprise success & implementation",
    multiLocation: "Custom multi-location / multi-brand",
    implementation: "Dedicated implementation",
    customWorkflows: "Fully custom",
    businessOs: "Configured",
    commerce: "Configured",
    marketing: "Configured as available",
    automation: "Configured as available",
    cta: {
      label: "Talk to enterprise sales",
      href: "/contact?intent=sales&plan=enterprise",
    },
  },
];

export const INDUSTRY_PACKS: CommercialLayer[] = [
  {
    id: "salon",
    name: "Salon / R GLOW",
    price: "₹1,499–₹4,999/mo",
    description: "Salon workflows, bookings, customer operations and role-based configuration.",
    href: "/solutions/salon",
  },
  {
    id: "retail",
    name: "Retail",
    price: "₹2,999–₹9,999/mo",
    description: "Retail operations, commerce context and customer lifecycle configuration.",
  },
  {
    id: "landscape",
    name: "Landscape / Nursery",
    price: "₹3,999–₹12,999/mo",
    description: "Lead, project, field-work, customer and commerce configuration.",
  },
  {
    id: "jewellery",
    name: "Jewellery",
    price: "₹9,999–₹39,999/mo",
    description: "Higher-complexity customer, catalogue, commerce and governed operational workflows.",
  },
  {
    id: "automotive",
    name: "Automotive",
    price: "₹9,999–₹49,999/mo",
    description: "Lead-to-booking, delivery, retention, service and multi-department operating context.",
  },
  {
    id: "logistics",
    name: "Logistics",
    price: "₹14,999–₹59,999/mo",
    description: "Shipment, partner, exception and operational orchestration configuration.",
  },
];

export const SHOPIFY_PACKAGES: CommercialLayer[] = [
  {
    id: "commerce-launch",
    name: "Commerce Launch",
    price: "₹49,999 setup + ₹3,999/mo",
    description: "Shopify setup, storefront configuration, RINPO storefront presence and RINADS commerce connection.",
    note: "Shopify subscription and transaction-related charges are paid separately by the merchant.",
  },
  {
    id: "commerce-growth",
    name: "Commerce Growth",
    price: "₹99,999 setup + ₹9,999/mo",
    description: "Adds CRM, customer segmentation, lifecycle automation, WhatsApp and growth visibility.",
  },
  {
    id: "commerce-intelligence",
    name: "Commerce Intelligence",
    price: "From ₹2L setup + ₹19,999/mo",
    description: "Business OS + Commerce OS + governed RINADS Intelligence and advanced operating workflows.",
  },
  {
    id: "commerce-enterprise",
    name: "Commerce Enterprise",
    price: "From ₹5L setup + ₹50,000/mo",
    description: "Advanced or headless commerce, private integrations, multi-brand operations and enterprise support.",
  },
];

export const SERVICE_LAYERS: CommercialLayer[] = [
  {
    id: "implementation",
    name: "Implementation",
    price: "From ₹25,000",
    description: "Migration, configuration, integrations and workflow implementation are scoped separately.",
  },
  {
    id: "automation",
    name: "Automation Packs",
    price: "From ₹5,000 setup",
    description: "Reusable sales, WhatsApp, lifecycle, review, logistics and operating workflow packs.",
  },
  {
    id: "growth",
    name: "Managed Growth",
    price: "From ₹15,000/mo",
    description: "Strategy and execution services remain separate from SaaS so software margins stay transparent.",
  },
  {
    id: "academy",
    name: "RINADS Academy",
    price: "Free → ₹999/user/mo",
    description: "Onboarding, micro-learning, professional certification and organisation training.",
  },
  {
    id: "ri-credits",
    name: "RI Credits",
    price: "Usage based",
    description: "A single governed usage layer for AI inference, tools, workflows, voice and supported runtime actions.",
  },
  {
    id: "world",
    name: "RINADS WORLD",
    price: "From ₹499/mo",
    description: "Business presence, digital stores, 3D showrooms, branded experiences and spatial commerce activations.",
    href: "https://world.rinads.com",
  },
];

export const PRICING_NOTES = {
  softwareVsServices:
    "Implementation services are priced separately when migration, integrations, configuration or custom workflow development is required.",
  availabilityNote:
    "Public subscription anchors are live. Industry packs, implementation, RI usage and managed services are configured separately. Product readiness labels remain authoritative.",
  rinpoNote:
    "RINPO and the RINPO Phone interface are part of the RINADS experience. Higher-cost intelligence, voice, tools, workflows and runtime actions consume included allowance or RI Credits.",
  thirdPartyNote:
    "Shopify, advertising media, payment processing, messaging, telephony, logistics and other third-party charges remain separate unless a proposal explicitly says otherwise.",
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
  { key: "includedAiAllowance", label: "RINPO / RI allowance", get: (p) => p.includedAiAllowance },
  { key: "integrations", label: "Integrations", get: (p) => p.integrations },
  { key: "supportLevel", label: "Support", get: (p) => p.supportLevel },
  { key: "multiLocation", label: "Multi-location", get: (p) => p.multiLocation },
  { key: "implementation", label: "Implementation", get: (p) => p.implementation },
  { key: "customWorkflows", label: "Custom workflows", get: (p) => p.customWorkflows },
];

export const PRICING_FAQ: { question: string; answer: string }[] = [
  {
    question: "What does RINADS cost?",
    answer:
      "RINADS Start begins at ₹2,999/month, Grow at ₹7,999/month, Scale at ₹19,999/month, and Enterprise at ₹49,999/month. Industry packs, RI usage, implementation and managed services are added only when required.",
  },
  {
    question: "How is RINADS pricing calculated?",
    answer:
      "Your recurring price starts with a platform plan, then adds any required industry configuration and metered RI usage. Migration, custom integrations, implementation, managed growth and third-party services are quoted separately so the commercial model stays transparent.",
  },
  {
    question: "Is RINPO an extra subscription?",
    answer:
      "No. RINPO and the RINPO Phone interface are part of RINADS. Plans include a RINPO / RI allowance; higher-cost intelligence, voice, tools and workflow execution can consume RI Credits or a contracted enterprise pool.",
  },
  {
    question: "Can I try RINADS before buying?",
    answer:
      "Yes. You can try RINPO on the website with a demo workspace and book a demo to walk through workflows that match your business.",
  },
  {
    question: "What is a RINADS Operating System?",
    answer:
      "An Operating System is a connected product suite on the shared RINADS core — for example Business OS for customers and work, or Commerce OS for products and orders. Industry solutions layer configuration and RINPO context on top.",
  },
  {
    question: "Is implementation included?",
    answer:
      "Core onboarding guidance is included with Start. Migration, integrations and custom configuration are separately scoped when required. This keeps the recurring software subscription separate from one-time project work.",
  },
  {
    question: "How does Shopify pricing work with RINADS?",
    answer:
      "The merchant normally owns and pays Shopify directly. RINADS charges for implementation, operating integration, RINPO, automation and intelligence. Shopify, payment, messaging and logistics charges remain separate unless a proposal explicitly includes them.",
  },
  {
    question: "Can RINADS replace my current tools?",
    answer:
      "Many teams can consolidate CRM, spreadsheets, commerce and project tools onto RINADS. Replacement scope depends on your workflows and on which RINADS products are production-ready for your use case.",
  },
  {
    question: "Can RINADS support multiple branches?",
    answer:
      "Grow is multi-location ready. Scale and Enterprise are designed for broader multi-team, multi-location and multi-brand configurations.",
  },
  {
    question: "Can RINPO perform actions automatically?",
    answer:
      "Supported actions follow RINADS Intelligence governance: observe, understand, recommend, authorize, act and audit. RINPO does not bypass organisation roles, permissions or required human approval.",
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
