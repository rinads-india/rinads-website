import Link from "next/link";
import { CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

export default function OsLabsPage() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">RINADS LABS · MVP</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">Learn by shipping governed work.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          LABS connects practical learning to the Work Graph. Interns and learners can contribute to real scoped work without receiving production secrets, global customer access or permission bypasses.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <CompanyOsPanel title="Scoped access">
          <p className="text-sm leading-6 text-gray-700">Assignments remain tenant-bound and permission-bound. Production secret access is never implied by participation.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="Evidence-backed learning">
          <p className="text-sm leading-6 text-gray-700">Submissions attach files, links, commits, deployments or operating records that reviewers can inspect.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="Quality loop">
          <p className="text-sm leading-6 text-gray-700">Review outcomes feed quality history and future allocation recommendations rather than creating unverifiable scores.</p>
        </CompanyOsPanel>
      </div>

      <CompanyOsPanel className="mt-4" title="LABS operating loop">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "Skill profile",
            "Eligible work",
            "Submission + evidence",
            "Human review",
            "Verified completion",
          ].map((item, index) => (
            <li key={item} className="rounded-2xl border border-gray-200 bg-white/70 p-4 text-sm font-medium text-gray-900">
              <span className="mb-2 block text-xs text-gray-400">0{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </CompanyOsPanel>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/os/work" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">Open Work</Link>
        <Link href="/os/academy" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">Open Academy</Link>
        <Link href="/os/approvals" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900">Open Approvals</Link>
      </div>
    </main>
  );
}
