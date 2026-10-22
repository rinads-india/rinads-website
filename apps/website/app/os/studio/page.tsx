import Link from "next/link";
import { CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

const workflow = [
  ["Ingest", "Register product, brand and reference assets with ownership or licence evidence."],
  ["Generate", "Create draft image, video, copy or layout outputs through job-scoped providers."],
  ["Review", "Human operators inspect brand fit, factual accuracy, rights and required repairs."],
  ["QA", "Record the quality gate before an approver can release the creative."],
  ["Approve", "A named human approval with timestamp is mandatory for publish eligibility."],
  ["Handoff", "Send approved exports to the appropriate publishing or campaign workflow."],
] as const;

export default function OsStudioPage() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">RINADS STUDIOS · Production MVP</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">Studio</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Governed creative production from source assets to approved publishing handoff. Provider output is always treated as a draft.
          </p>
        </div>
        <Link href="/os/assets" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">
          Open assets
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <CompanyOsPanel title="Rights first" description="Every source asset needs an approved rights or consent record before release.">
          <p className="text-sm leading-6 text-gray-700">No unverified client, product, character or reference asset is silently cleared for publishing.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="Human approval" description="RINPO may prepare job specs and recommendations, not self-authorize publishing.">
          <p className="text-sm leading-6 text-gray-700">Approval identity, timestamp and QA state are part of the publish decision.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="Provider neutral" description="Generation vendors remain replaceable execution adapters.">
          <p className="text-sm leading-6 text-gray-700">The canonical job, asset and approval context stays inside RINADS.</p>
        </CompanyOsPanel>
      </div>

      <CompanyOsPanel className="mt-4" title="Creative production lifecycle">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflow.map(([title, description], index) => (
            <article key={title} className="rounded-2xl border border-gray-200 bg-white/70 p-4">
              <p className="text-xs font-semibold text-gray-400">0{index + 1}</p>
              <h2 className="mt-2 text-sm font-semibold text-gray-950">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-gray-600">{description}</p>
            </article>
          ))}
        </div>
      </CompanyOsPanel>

      <CompanyOsPanel className="mt-4" title="MVP boundary" description="This production surface does not claim unverified auto-publishing or arbitrary media-suite parity.">
        <p className="text-sm leading-6 text-gray-700">
          Current scope is the canonical rights, generation-review, QA, approval and handoff contract. Provider-specific generation and publishing integrations must prove their own credentials and API contracts before being marked live.
        </p>
      </CompanyOsPanel>
    </main>
  );
}
