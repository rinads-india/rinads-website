import Link from "next/link";
import {
  AUTONOMY_LEVELS,
  RI_LABS_MODULES,
  RUN_BUSINESS_24X7_LOOPS,
} from "@rinads/platform";
import { CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

const labLifecycle = [
  "Signal",
  "Thesis",
  "Spec",
  "Sandbox",
  "Eval",
  "Pilot",
  "Productize",
  "Launch",
  "Scale / Kill",
];

const activationLifecycle = [
  "Discover",
  "Identity",
  "Tenant reserve",
  "Payment",
  "Entitlement",
  "Provision",
  "Install pack",
  "First value",
  "Active",
];

export default function OsLabsPage() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">RI LABS · GOVERNED PRODUCT FACTORY</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">Build, prove and scale businesses that can run 24/7.</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
          RI LABS turns signals, research and real operating evidence into reusable RINADS capabilities, digital products, services and Industry Packs. Every experiment stays tenant-bound, permission-bound, measurable and reversible before it can reach production.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <CompanyOsPanel title="Self-serve by default">
          <p className="text-sm leading-6 text-gray-700">A customer should be able to discover, buy, create an organization, receive entitlements, provision a tenant and reach first value without manual RINADS setup.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="Governed autonomy">
          <p className="text-sm leading-6 text-gray-700">RINADS Intelligence can observe, recommend and execute only inside explicit tenant policy, approval, budget and risk limits.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="Evidence over activity">
          <p className="text-sm leading-6 text-gray-700">Experiments advance on task success, customer value, security, reliability and unit economics—not feature count or unverifiable scores.</p>
        </CompanyOsPanel>
      </div>

      <CompanyOsPanel className="mt-4" title="RI LABS modules">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RI_LABS_MODULES.map((module) => (
            <article key={module.key} className="rounded-2xl border border-gray-200 bg-white/70 p-4">
              <p className="text-sm font-semibold text-gray-950">{module.name}</p>
              <p className="mt-2 text-xs leading-5 text-gray-600">{module.outcome}</p>
            </article>
          ))}
        </div>
      </CompanyOsPanel>

      <CompanyOsPanel className="mt-4" title="Evidence-gated product lifecycle">
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {labLifecycle.map((item, index) => (
            <li key={item} className="rounded-xl border border-gray-200 bg-white/70 p-3 text-xs font-semibold text-gray-900">
              <span className="mb-1 block text-[10px] text-gray-400">{String(index + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ol>
      </CompanyOsPanel>

      <CompanyOsPanel className="mt-4" title="RUN BUSINESS 24/7">
        <div className="grid gap-3 md:grid-cols-5">
          {RUN_BUSINESS_24X7_LOOPS.map((loop) => (
            <article key={loop.key} className="rounded-2xl border border-gray-200 bg-gray-950 p-4 text-white">
              <p className="text-xs font-bold tracking-[0.16em]">{loop.name}</p>
              <p className="mt-2 text-xs leading-5 text-gray-300">{loop.purpose}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-gray-600">
          RINPO is the conversational interface. RINADS Intelligence decides within policy. RINPO Runtime executes capabilities and records outcomes back into the Business Graph and audit trail.
        </p>
      </CompanyOsPanel>

      <CompanyOsPanel className="mt-4" title="Global self-serve activation">
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {activationLifecycle.map((item, index) => (
            <li key={item} className="rounded-xl border border-gray-200 bg-white p-3 text-xs font-medium text-gray-900">
              <span className="mb-1 block text-[10px] text-gray-400">{String(index + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-5 text-gray-600">
          Payment confirmation alone never grants production access. A verified entitlement must exist before provisioning, and first-value activation is measured separately from account creation.
        </p>
      </CompanyOsPanel>

      <CompanyOsPanel className="mt-4" title="Autonomy ladder">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(AUTONOMY_LEVELS).map(([level, description]) => (
            <article key={level} className="rounded-2xl border border-gray-200 bg-white/70 p-4">
              <p className="text-xs font-bold text-gray-950">L{level}</p>
              <p className="mt-2 text-xs leading-5 text-gray-600">{description}</p>
            </article>
          ))}
        </div>
      </CompanyOsPanel>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/start" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">Open Self-Serve Start</Link>
        <Link href="/marketplace" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">Open Marketplace</Link>
        <Link href="/os/work" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">Open Work</Link>
        <Link href="/os/automate" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">Open Automations</Link>
        <Link href="/os/approvals" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">Open Approvals</Link>
      </div>
    </main>
  );
}
