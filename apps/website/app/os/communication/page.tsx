import Link from "next/link";
import { CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

export default function OsCommunicationPage() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">RINADS Communication · MVP</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">Calls and messaging without provider lock-in.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Customer and lead identity stays in RINADS. Voice, WhatsApp and email providers are replaceable adapters feeding RINPO Runtime and governed follow-up workflows.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <CompanyOsPanel title="Voice">
          <p className="text-sm leading-6 text-gray-700">Canonical call events support inbound/outbound context, recordings, transcripts and follow-up intelligence without making the telephony vendor the CRM.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="WhatsApp">
          <p className="text-sm leading-6 text-gray-700">Outbound communication stays consent-aware, suppression-aware and template-aware. Delivery success is never fabricated.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="RINPO follow-up">
          <p className="text-sm leading-6 text-gray-700">Call summaries, intent and recommended actions can become Work Graph items; sensitive actions still require policy and approval.</p>
        </CompanyOsPanel>
      </div>

      <CompanyOsPanel className="mt-4" title="Provider readiness">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">Calliyo</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">Contract pending. No production network calls until account-specific API, signing, credentials and sandbox tests are verified.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
            <p className="text-sm font-semibold text-gray-950">Exotel / SIM</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">Adapter targets. Production status depends on verified provider contracts and credentials.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
            <p className="text-sm font-semibold text-gray-950">Messaging outbox</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">Canonical Runtime remains responsible for queued delivery, retries and observable failures.</p>
          </div>
        </div>
      </CompanyOsPanel>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/os/customers" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">Customers</Link>
        <Link href="/os/work" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">Work</Link>
        <Link href="/os/approvals" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">Approvals</Link>
      </div>
    </main>
  );
}
