import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { LegalPage } from "@/components/system";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/company/terms");
}

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="The terms that will govern use of the RINADS platform, RINPO, and related services."
      sections={[
        {
          heading: "Acceptance of terms",
          body: [
            "By creating a RINADS organization or using the RINADS platform, you agree to these terms. The complete, counsel-approved terms will be published here before general availability.",
          ],
        },
        {
          heading: "Use of the platform",
          body: [
            "RINADS provides Business OS, Commerce OS, Marketing OS, Logistics OS, Creative OS, Build OS, Academy OS, Automation OS, RINADS Intelligence, and RINADS Cloud as an integrated operating platform, accessed through RINPO and the web application.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "Paid services and subscriptions are processed through our payment provider. Pricing, billing cycles, and refund terms will be detailed in full here.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Organizations and their members agree not to misuse the platform, attempt to circumvent security controls, or use RINPO to take actions outside their authorized role.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about these terms can be sent through the Company contact page."],
        },
      ]}
    />
  );
}
