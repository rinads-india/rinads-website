import type { Metadata } from "next";
import { PlatformPillarPage } from "@/components/system/PlatformPillarPage";
import { RinpoRuntimeDiagram } from "@/components/system/RinpoRuntimeDiagram";
import { pillarFromCatalog } from "@/lib/content/platform-pillars";
import { CTAS } from "@/lib/ctas";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/platform/rinpo-runtime";

const RUNTIME_BULLETS = [
  "Agents — role-bound assistants scoped to tenant context and supported tools.",
  "Tools — registered product mutations with explicit permission and confirmation paths.",
  "Workflows — durable multi-step processes with waiting, retry, and failure states.",
  "Triggers — schedules, events, and conditions that start governed work.",
  "Permissions — authorization checks before sensitive runtime steps execute.",
  "Approvals — human gates when risk thresholds require a pause.",
  "Execution — workers, queues, retries, and side effects inside platform controls.",
  "Audit — correlated records for important mutations and workflow transitions.",
];

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "RINPO Runtime | RINADS" };
}

export default function RinpoRuntimePillarPage() {
  const product = pillarFromCatalog("rinpo-runtime");
  if (!product) return null;

  return (
    <PlatformPillarPage
      path={PATH}
      eyebrow="RINPO Runtime"
      title={product.name}
      headline="Governed execution behind RINPO."
      summary={product.description}
      status={product.status}
      bullets={RUNTIME_BULLETS}
      primaryCta={CTAS.seeRinpo}
      secondaryCta={CTAS.viewSecurity}
      related={[
        { label: "RINADS Intelligence", href: "/platform/intelligence" },
        { label: "Automation", href: "/platform/automation" },
        { label: "Developers", href: "/resources/developers" },
      ]}
    >
      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
            Runtime map
          </p>
          <h2 className="mt-4 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
            From recommendation to auditable execution.
          </h2>
          <RinpoRuntimeDiagram className="mt-8" />
        </div>
      </section>
    </PlatformPillarPage>
  );
}
