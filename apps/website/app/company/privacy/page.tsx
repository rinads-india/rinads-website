import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { LegalPage } from "@/components/system";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/company/privacy");
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="How RINADS collects, uses, and protects information across the RINADS platform, RINPO, and our public website."
      sections={[
        {
          heading: "Overview",
          body: [
            "RINADS operates an AI operating platform for business, including the public website, RINPO, and the Business OS suite. This policy will describe what information we collect, why we collect it, and how organizations and their end users can control it.",
          ],
        },
        {
          heading: "Information we collect",
          body: [
            "Account and organization details provided during signup and onboarding.",
            "Usage data generated while using RINADS products, including RINPO conversations and platform activity, to operate and improve the service.",
          ],
        },
        {
          heading: "How we use information",
          body: [
            "To operate, secure, and improve the RINADS platform and RINPO.",
            "To communicate service updates, billing, and support information.",
          ],
        },
        {
          heading: "Data retention & security",
          body: [
            "Tenant data is isolated by organization with database-level access controls. Retention periods and deletion procedures will be finalized with counsel and published here.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about this policy can be sent through the Company contact page."],
        },
      ]}
    />
  );
}
