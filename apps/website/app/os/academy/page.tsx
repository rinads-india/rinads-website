import Link from "next/link";
import { CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

export default function OsAcademyPage() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-6 pb-28 lg:pb-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">RINADS Academy</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">Learn. Practice. Prove.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          Academy provides the learning layer; LABS connects eligible learners to scoped practical work through the governed Work Graph.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <CompanyOsPanel title="Academy" description="Structured learning and role preparation.">
          <p className="text-sm leading-6 text-gray-700">Courses and guided learning remain separate from production permissions. Completion does not automatically grant customer or infrastructure access.</p>
        </CompanyOsPanel>
        <CompanyOsPanel title="LABS" description="Evidence-backed practical execution.">
          <p className="text-sm leading-6 text-gray-700">Eligible work can be allocated by skills, availability, tenant boundary, workload and prior reviewed quality.</p>
          <Link href="/os/labs" className="mt-4 inline-flex rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">Open LABS</Link>
        </CompanyOsPanel>
      </div>

      <CompanyOsPanel className="mt-4" title="RINADS Verified">
        <p className="text-sm leading-6 text-gray-700">Verification is issued only when a real work unit is approved by a named reviewer and has inspectable evidence. RINPO cannot create verification by assertion.</p>
      </CompanyOsPanel>
    </main>
  );
}
