import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPillarPage } from "@/components/system/PlatformPillarPage";
import { pillarFromCatalog } from "@/lib/content/platform-pillars";
import { getOsPage } from "@/lib/content/platform-os";
import { CTAS } from "@/lib/ctas";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/platform/intelligence";

const INTELLIGENCE_CAPABILITIES = [
  {
    title: "Understand",
    description: "Read permitted signals from customers, work, commerce, and runtime events inside organisation context.",
  },
  {
    title: "Reason",
    description: "Relate the current request to entities, workflows, and constraints — without inventing authority.",
  },
  {
    title: "Recommend",
    description: "Turn available context into explainable next steps that still require human or policy confirmation.",
  },
  {
    title: "Orchestrate",
    description: "Route supported work through RINPO Runtime tools, workflows, permissions, and approvals.",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "RINADS INTELLIGENCE | RINADS" };
}

export default function IntelligencePillarPage() {
  const product = pillarFromCatalog("intelligence");
  const os = getOsPage("rinads-intelligence");
  if (!product || !os) return null;

  return (
    <PlatformPillarPage
      path={PATH}
      eyebrow="RINADS INTELLIGENCE"
      title={product.name}
      headline={os.headline}
      summary={product.description}
      status={product.status}
      bullets={os.modules.map((m) =>
        m.description ? `${m.name} — ${m.description}` : m.name,
      )}
      primaryCta={CTAS.seeRinpo}
      secondaryCta={CTAS.explorePlatform}
      related={[
        { label: "RINPO", href: "/rinpo" },
        { label: "RINPO RUNTIME", href: "/platform/rinpo-runtime" },
        { label: "RINADS Platform", href: "/platform/cloud" },
      ]}
    >
      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
            Capability model
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {INTELLIGENCE_CAPABILITIES.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            Model and tool providers remain replaceable at the platform layer. Customer data stays inside
            organisation permissions — intelligence routes through governed runtime paths instead of bypassing
            them.
          </p>
          <Link
            href="/rinpo/intelligence"
            className="mt-6 inline-flex text-sm font-semibold text-rinads-primary hover:underline"
          >
            RINPO intelligence experience →
          </Link>
        </div>
      </section>
    </PlatformPillarPage>
  );
}
