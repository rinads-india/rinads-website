"use client";

import { DEMO_COMPANIES, DEMO_OPPORTUNITIES } from "@rinads/company-os";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";
import { OPPORTUNITY_STAGES, formatInrAmount } from "@/lib/company-os-display";

export function CompanySalesPipeline() {
  const byStage = new Map<string, typeof DEMO_OPPORTUNITIES>();
  for (const stage of OPPORTUNITY_STAGES) byStage.set(stage, []);
  for (const opp of DEMO_OPPORTUNITIES) {
    const list = byStage.get(opp.stage) ?? [];
    list.push(opp);
    byStage.set(opp.stage, list);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Sales pipeline</h1>
        <CompanyOsDemoNotice />
      </header>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {OPPORTUNITY_STAGES.map((stage) => (
          <div key={stage} className="min-w-[11rem] flex-1 rounded-2xl bg-white/30 p-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
              {stage}
            </p>
            <ul className="space-y-2">
              {(byStage.get(stage) ?? []).map((opp) => {
                const company = DEMO_COMPANIES.find((c) => c.id === opp.companyId);
                return (
                  <li key={opp.id} className="rounded-xl bg-white/80 p-2 text-xs shadow-sm">
                    <p className="font-semibold text-gray-900">{opp.title}</p>
                    <p className="text-gray-600">{company?.name}</p>
                    <p className="mt-1 font-medium">{formatInrAmount(opp.amount)}</p>
                    <p className="text-gray-500">{opp.probability}% probability</p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <CompanyOsPanel title="Note">
        <p className="text-sm text-gray-700">
          Stages follow Company OS opportunity model. Empty columns are expected until CRM sync
          lands.
        </p>
      </CompanyOsPanel>
    </div>
  );
}
