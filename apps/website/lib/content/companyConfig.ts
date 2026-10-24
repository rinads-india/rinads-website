/**
 * Verified company identity for marketing, schema, and contact fallbacks.
 * Optional contact/social fields render only when set via env — never invent.
 */

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export type CompanySocial = {
  name: string;
  href: string;
};

export type CompanyFounder = {
  name: string;
  title: string;
  story: string;
  /** Public asset path when an approved headshot exists */
  headshotSrc?: string;
};

const businessEmail = env("NEXT_PUBLIC_BUSINESS_EMAIL");
const whatsappUrl = env("NEXT_PUBLIC_WHATSAPP_URL");
const linkedIn = env("NEXT_PUBLIC_SOCIAL_LINKEDIN");
const xUrl = env("NEXT_PUBLIC_SOCIAL_X");
const facebook = env("NEXT_PUBLIC_SOCIAL_FACEBOOK");
const headshot = env("NEXT_PUBLIC_FOUNDER_HEADSHOT");

const socials: CompanySocial[] = [];
if (linkedIn) socials.push({ name: "LinkedIn", href: linkedIn });
if (xUrl) socials.push({ name: "X", href: xUrl });
if (facebook) socials.push({ name: "Facebook", href: facebook });

export const COMPANY_CONFIG = {
  legalName: "RINADS Technologies",
  brandName: "RINADS",
  category: "Business Intelligence Infrastructure",
  tagline: "Business, simplified.",
  location: {
    city: "Thrissur",
    region: "Kerala",
    country: "India",
    /** Display line for trust / about */
    display: "Built in Thrissur, Kerala, India.",
    trustLine: "Built in Thrissur, Kerala · Designed for growing businesses",
  },
  founder: {
    name: "Andrino T D",
    title: "Founder / Managing Director & CEO",
    story:
      "I grew up inside small businesses. Now I'm building the system I wish they had — connecting software, people, data, commerce, communication and operations into one intelligence-controlled environment.",
    ...(headshot ? { headshotSrc: headshot } : {}),
  } satisfies CompanyFounder,
  /** Only populated when env provides verified values */
  contact: {
    businessEmail,
    whatsappUrl,
  },
  socials,
  siteUrl: env("NEXT_PUBLIC_SITE_URL") ?? "https://www.rinads.com",
} as const;

export function hasBusinessEmail(): boolean {
  return Boolean(COMPANY_CONFIG.contact.businessEmail);
}

export function hasWhatsApp(): boolean {
  return Boolean(COMPANY_CONFIG.contact.whatsappUrl);
}

export function hasPublicSocials(): boolean {
  return COMPANY_CONFIG.socials.length > 0;
}
