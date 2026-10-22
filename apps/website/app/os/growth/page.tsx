import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";
import { getGrowthModuleDestinations } from "@/lib/os-module-destinations";

const leadBus = [
  ["Capture", "Ads · social · SEO · forms · WhatsApp · calls · landing pages · imports"],
  ["Normalize", "Tenant-scoped lead identity and deterministic idempotency key"],
  ["Govern", "Suppression and contact consent are checked before outreach"],
  ["Prioritize", "RINPO can score and recommend; it cannot bypass policy"],
  ["Act", "Qualified follow-up becomes governed work, demo, proposal or handoff"],
] as const;

export default function OsGrowthPage() {
  return (
    <main id="main">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">RINADS Growth Engine · MVP</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">One governed lead bus.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Normalize acquisition signals into one tenant-safe funnel, preserve attribution, enforce consent and turn qualified follow-up into Work Graph actions.
          </p>
        </header>

        <CompanyOsPanel title="Lead lifecycle">
          <div className="grid gap-3 md:grid-cols-5">
            {leadBus.map(([title, description], index) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <span className="text-xs font-semibold text-gray-400">0{index + 1}</span>
                <h2 className="mt-2 text-sm font-semibold text-gray-950">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </CompanyOsPanel>

        <CompanyOsPanel className="mt-4" title="MVP safety boundary">
          <p className="text-sm leading-6 text-gray-700">
            Funnel publishing remains draft-first and approval-gated. Suppressed or non-consenting contacts are not eligible for automated outreach, and this surface does not fabricate campaign delivery or attribution data.
          </p>
        </CompanyOsPanel>
      </div>
      <OsModuleBridge config={getGrowthModuleDestinations()} />
    </main>
  );
}
