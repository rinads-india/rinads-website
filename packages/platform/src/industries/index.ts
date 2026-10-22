import type { VerticalTemplateKey } from "../templates/index";

export const INDUSTRY_FAMILIES = [
  { id: "agriculture-nature", label: "Agriculture, Forestry, Fishing & Animal Economy" },
  { id: "mining-resources", label: "Mining, Minerals & Natural Resources" },
  { id: "manufacturing-industrial", label: "Manufacturing & Industrial" },
  { id: "energy-utilities", label: "Energy, Power & Utilities" },
  { id: "construction-infrastructure", label: "Construction, Infrastructure & Trades" },
  { id: "wholesale-distribution", label: "Wholesale, Distribution & Trading" },
  { id: "retail-commerce", label: "Retail & Commerce" },
  { id: "ecommerce-digital-commerce", label: "E-commerce & Digital Commerce" },
  { id: "automotive-mobility", label: "Automotive & Mobility" },
  { id: "transport-logistics", label: "Transportation, Courier & Logistics" },
  { id: "hospitality-tourism", label: "Hospitality, Tourism & Accommodation" },
  { id: "food-beverage", label: "Food, Beverage & Restaurants" },
  { id: "real-estate-property", label: "Real Estate & Property" },
  { id: "professional-services", label: "Professional & Business Services" },
  { id: "technology-software", label: "Technology, IT, Software & SaaS" },
  { id: "telecom-communications", label: "Telecom, Internet & Communications" },
  { id: "finance-insurance", label: "Banking, Finance, Fintech & Insurance" },
  { id: "healthcare-life-sciences", label: "Healthcare, Medical & Life Sciences" },
  { id: "beauty-wellness", label: "Beauty, Wellness & Personal Care" },
  { id: "education-training", label: "Education, Training & Academy" },
  { id: "media-advertising", label: "Media, Advertising & Publishing" },
  { id: "entertainment-sports", label: "Entertainment, Events, Gaming & Sports" },
  { id: "creative-design", label: "Creative, Design & Creator Economy" },
  { id: "hr-workforce", label: "HR, Recruitment & Workforce" },
  { id: "legal-governance", label: "Legal, Compliance & Governance" },
  { id: "government-public", label: "Government & Public Sector" },
  { id: "ngo-social", label: "NGO, Social Enterprise & Associations" },
  { id: "environment-green", label: "Environmental, Waste & Green Economy" },
  { id: "personal-household", label: "Household & Personal Services" },
  { id: "emerging-multi", label: "Emerging / Other / Multi-industry" },
] as const;

export type IndustryFamilyId = (typeof INDUSTRY_FAMILIES)[number]["id"];

export type IndustryRecord = {
  id: string;
  label: string;
  familyId: IndustryFamilyId;
  templateKey: VerticalTemplateKey;
  aliases?: readonly string[];
  defaultModules?: readonly string[];
  source: "uploaded" | "rinads";
};

const COMMON = ["customers", "finance", "automation", "analytics"] as const;
const COMMERCE = ["customers", "finance", "marketing", "automation", "analytics"] as const;
const SERVICES = ["customers", "projects", "finance", "automation", "analytics"] as const;

export const RINADS_INDUSTRIES = [
  { id: "consulting", label: "Consulting", familyId: "professional-services", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "accounting", label: "Accounting", familyId: "professional-services", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "legal-services", label: "Legal Services", familyId: "legal-governance", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "advertising-marketing", label: "Advertising & Marketing", familyId: "media-advertising", templateKey: "generic-retail", defaultModules: ["customers", "projects", "marketing", "automation", "analytics"], source: "uploaded" },
  { id: "it-managed-services", label: "IT Services & Managed Services", familyId: "technology-software", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "software-saas", label: "Software & SaaS Companies", familyId: "technology-software", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "design-services", label: "Design Services", familyId: "creative-design", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "construction", label: "Construction", familyId: "construction-infrastructure", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "specialty-trade-contractors", label: "Specialty Trade Contractors", familyId: "construction-infrastructure", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "retail-brick-mortar", label: "Retail (Brick-and-Mortar)", familyId: "retail-commerce", templateKey: "generic-retail", defaultModules: COMMERCE, source: "uploaded" },
  { id: "ecommerce", label: "E-commerce", familyId: "ecommerce-digital-commerce", templateKey: "generic-retail", defaultModules: COMMERCE, source: "uploaded" },
  { id: "healthcare-clinics", label: "Healthcare (Clinics & Private Practice)", familyId: "healthcare-life-sciences", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "food-beverage", label: "Food & Beverage", familyId: "food-beverage", templateKey: "generic-retail", defaultModules: COMMERCE, source: "uploaded" },
  { id: "hospitality-lodging", label: "Hospitality & Lodging", familyId: "hospitality-tourism", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "training-coaching", label: "Training, Coaching & Professional Development", familyId: "education-training", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "agriculture-forestry-fishing", label: "Agriculture, Forestry & Fishing", familyId: "agriculture-nature", templateKey: "ambady-nursery", defaultModules: COMMERCE, source: "uploaded" },
  { id: "architecture", label: "Architecture", familyId: "professional-services", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "beauty-personal-care", label: "Beauty & Personal Care", familyId: "beauty-wellness", templateKey: "salon-os", defaultModules: COMMERCE, source: "uploaded" },
  { id: "biotechnology", label: "Biotechnology", familyId: "healthcare-life-sciences", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "education-schools-tutoring", label: "Education (Schools, Tutoring)", familyId: "education-training", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "energy-oil-gas-renewables", label: "Energy (Oil, Gas, Renewables)", familyId: "energy-utilities", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "entertainment-events", label: "Entertainment & Events", familyId: "entertainment-sports", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "financial-services", label: "Financial Services (Advisory & Planning)", familyId: "finance-insurance", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "fitness-sports", label: "Fitness & Sports", familyId: "entertainment-sports", templateKey: "generic-retail", defaultModules: COMMERCE, source: "uploaded" },
  { id: "government-public-sector", label: "Government (Public Sector)", familyId: "government-public", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "human-resources", label: "Human Resources", familyId: "hr-workforce", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "insurance-agencies-brokers", label: "Insurance Agencies & Brokers", familyId: "finance-insurance", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "logistics-3pl-fulfillment", label: "Logistics (3PL, Fulfillment)", familyId: "transport-logistics", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "manufacturing", label: "Manufacturing", familyId: "manufacturing-industrial", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "media-publishing", label: "Media & Publishing", familyId: "media-advertising", templateKey: "generic-retail", defaultModules: ["customers", "projects", "marketing", "automation", "analytics"], source: "uploaded" },
  { id: "mental-health-services", label: "Mental Health Services", familyId: "healthcare-life-sciences", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "nonprofit-ngo", label: "Non-Profit / NGO", familyId: "ngo-social", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "personal-services", label: "Personal Services", familyId: "personal-household", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "pharmaceuticals", label: "Pharmaceuticals", familyId: "healthcare-life-sciences", templateKey: "generic-retail", defaultModules: COMMERCE, source: "uploaded" },
  { id: "property-management", label: "Property Management", familyId: "real-estate-property", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "real-estate-brokerage-agents", label: "Real Estate (Brokerage, Agents)", familyId: "real-estate-property", templateKey: "generic-retail", defaultModules: SERVICES, source: "uploaded" },
  { id: "telecommunications", label: "Telecommunications", familyId: "telecom-communications", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "transportation-trucking-courier", label: "Transportation (Trucking, Courier)", familyId: "transport-logistics", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "utilities", label: "Utilities", familyId: "energy-utilities", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "wellness-alternative-health", label: "Wellness & Alternative Health", familyId: "beauty-wellness", templateKey: "salon-os", defaultModules: COMMERCE, source: "uploaded" },
  { id: "venture-capital-investment", label: "Venture Capital / Investment Firms", familyId: "finance-insurance", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },
  { id: "other", label: "Other / Not Listed", familyId: "emerging-multi", templateKey: "generic-retail", defaultModules: COMMON, source: "uploaded" },

  { id: "salon", label: "Salon / Hair / Beauty Studio", familyId: "beauty-wellness", templateKey: "salon-os", aliases: ["salon", "beauty salon", "hair salon", "unisex salon"], defaultModules: COMMERCE, source: "rinads" },
  { id: "jewellery-luxury", label: "Jewellery & Luxury", familyId: "retail-commerce", templateKey: "generic-retail", aliases: ["jewelry", "gold jewellery", "silver jewellery", "diamond jewellery", "bullion"], defaultModules: COMMERCE, source: "rinads" },
  { id: "nursery-horticulture", label: "Nursery, Horticulture & Garden Retail", familyId: "agriculture-nature", templateKey: "ambady-nursery", aliases: ["nursery", "plants", "garden center", "horticulture"], defaultModules: COMMERCE, source: "rinads" },
  { id: "landscaping", label: "Landscaping & Garden Services", familyId: "agriculture-nature", templateKey: "ambady-nursery", aliases: ["landscape", "landscaping contractor"], defaultModules: SERVICES, source: "rinads" },
  { id: "automotive-dealership", label: "Automotive Dealership", familyId: "automotive-mobility", templateKey: "generic-retail", aliases: ["car dealer", "vehicle dealership", "two wheeler dealer"], defaultModules: COMMERCE, source: "rinads" },
  { id: "automotive-service", label: "Automotive Service, Body Shop & Detailing", familyId: "automotive-mobility", templateKey: "generic-retail", aliases: ["car service", "body shop", "detailing", "ceramic coating"], defaultModules: SERVICES, source: "rinads" },
  { id: "immigration-services", label: "Immigration, Visa & Overseas Services", familyId: "professional-services", templateKey: "generic-retail", aliases: ["immigration", "visa consultant", "study abroad"], defaultModules: SERVICES, source: "rinads" },
  { id: "courier-delivery", label: "Courier, Parcel & Last-mile Delivery", familyId: "transport-logistics", templateKey: "generic-retail", aliases: ["courier", "delivery", "last mile"], defaultModules: COMMON, source: "rinads" },
  { id: "academy-training", label: "Academy & Vocational Training", familyId: "education-training", templateKey: "generic-retail", aliases: ["academy", "training center", "vocational training"], defaultModules: SERVICES, source: "rinads" },
  { id: "restaurant-cafe", label: "Restaurant, Cafe & Cloud Kitchen", familyId: "food-beverage", templateKey: "generic-retail", aliases: ["restaurant", "cafe", "cloud kitchen"], defaultModules: COMMERCE, source: "rinads" },
] as const satisfies readonly IndustryRecord[];

export type IndustryId = (typeof RINADS_INDUSTRIES)[number]["id"];

export function getIndustry(industryId: string): IndustryRecord | undefined {
  return RINADS_INDUSTRIES.find((industry) => industry.id === industryId);
}

export function resolveIndustryTemplate(industryId: string): VerticalTemplateKey {
  return getIndustry(industryId)?.templateKey ?? "generic-retail";
}

export function getIndustriesByFamily(familyId: IndustryFamilyId): IndustryRecord[] {
  return RINADS_INDUSTRIES.filter((industry) => industry.familyId === familyId);
}

export function searchIndustries(query: string): IndustryRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...RINADS_INDUSTRIES];
  return RINADS_INDUSTRIES.filter((industry) => {
    const record: IndustryRecord = industry;
    const haystack = [record.id, record.label, ...(record.aliases ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}
