import type { Metadata } from "next";
import { LegalPage } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/legal/dpa") as Metadata) ?? { title: "Data Processing Addendum | RINADS" };
}

export default function DataProcessingAddendumPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Data Processing Addendum"
      intro="Structure for organisation data-processing terms. This is not binding counsel-approved language yet."
      sections={[
        {
          heading: "Status",
          body: [
            "A counsel-approved Data Processing Addendum has not been published on this page. Do not treat the text below as contractual commitments.",
            "Organisations evaluating RINADS should contact us for the current commercial and legal process.",
          ],
        },
        {
          heading: "Intended scope (placeholder)",
          body: [
            "When published, this addendum will describe roles, processing purposes, security measures, subprocessors, and assistance with data-subject requests at a level approved by counsel.",
            "No specific regulatory certification, transfer mechanism, or retention period is claimed here.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about data processing can be sent through /contact?intent=security or the company contact path.",
          ],
        },
      ]}
    />
  );
}
