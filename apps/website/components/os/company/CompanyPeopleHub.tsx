"use client";

import { DEMO_WORKERS, capacityScore } from "@rinads/company-os";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

export function CompanyPeopleHub() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">People</h1>
        <CompanyOsDemoNotice />
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {DEMO_WORKERS.map((worker) => {
          const util =
            worker.availableHoursWeek > 0
              ? worker.committedHoursWeek / worker.availableHoursWeek
              : 0;
          const remaining = capacityScore(worker.availableHoursWeek, worker.committedHoursWeek);
          return (
            <li key={worker.id}>
              <CompanyOsPanel>
                <p className="text-lg font-semibold text-gray-900">{worker.displayName}</p>
                <p className="text-sm text-gray-600">
                  {worker.roleTitle} · {worker.kind}
                </p>
                <p className="mt-2 text-sm text-gray-800">
                  Utilization: {Math.round(util * 100)}% ({worker.committedHoursWeek}h /{" "}
                  {worker.availableHoursWeek}h)
                </p>
                <p className="text-xs text-gray-600">
                  Remaining capacity score: {remaining.toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-gray-500">Skills: {worker.skills.join(", ")}</p>
              </CompanyOsPanel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
