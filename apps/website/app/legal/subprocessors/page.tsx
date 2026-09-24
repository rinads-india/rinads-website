import type { Metadata } from "next";
import { LegalPage } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (
    (metadataFromRegistry("/legal/subprocessors") as Metadata) ?? { title: "Subprocessors | RINADS" }
  );
}

export default function SubprocessorsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Subprocessors"
      intro="Placeholder for the counsel-approved list of subprocessors engaged to deliver RINADS services."
      sections={[
        {
          heading: "Status",
          body: [
            "A counsel-approved subprocessors list has not been published on this page. We do not invent vendor names, regions, or processing purposes for marketing effect.",
            "When the list is ready, it will appear here with enough specificity for customer diligence.",
          ],
        },
        {
          heading: "How to enquire",
          body: [
            "For diligence conversations before publication, contact the team via /contact?intent=security or review the security page for honest control status.",
          ],
        },
      ]}
    />
  );
}
