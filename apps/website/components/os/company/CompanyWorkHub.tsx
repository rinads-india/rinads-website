"use client";

import {
  DEMO_PROJECTS,
  DEMO_TASKS,
  DEMO_WORKERS,
  DEMO_COMPANIES,
  rankAssignees,
  capacityScore,
} from "@rinads/company-os";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

export function CompanyWorkHub() {
  const ranked = rankAssignees(
    DEMO_WORKERS.map((w) => ({
      workerId: w.id,
      displayName: w.displayName,
      factors: {
        skillMatch: 0.8,
        availability: 1,
        currentCapacity: capacityScore(w.availableHoursWeek, w.committedHoursWeek),
        deadlineUrgency: 0.75,
        clientPriority: 0.85,
        historicalDeliveryQuality: w.kind === "human" ? 0.88 : 0.7,
        costEfficiency: w.kind === "bot" ? 0.92 : 0.65,
        dependencyFit: 0.78,
      },
    })),
  );
  const top = ranked[0];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Work</h1>
        <CompanyOsDemoNotice />
      </header>

      {top && (
        <CompanyOsPanel title="Assignment recommendation">
          <p className="text-sm text-gray-800">
            Top pick: <span className="font-semibold">{top.displayName}</span> (score{" "}
            {top.score.toFixed(3)}). Managers can override intelligent allocation at any time.
          </p>
        </CompanyOsPanel>
      )}

      <CompanyOsPanel title="Projects">
        <ul className="space-y-2">
          {DEMO_PROJECTS.map((project) => {
            const company = DEMO_COMPANIES.find((c) => c.id === project.companyId);
            return (
              <li key={project.id} className="rounded-2xl bg-white/50 px-3 py-3 text-sm">
                <p className="font-semibold text-gray-900">{project.name}</p>
                <p className="text-gray-600">
                  {company?.name} · {project.status} · {project.health}
                </p>
              </li>
            );
          })}
        </ul>
      </CompanyOsPanel>

      <CompanyOsPanel title="Tasks">
        <ul className="space-y-2">
          {DEMO_TASKS.map((task) => {
            const assignee = DEMO_WORKERS.find((w) => w.id === task.assigneeWorkerId);
            return (
              <li key={task.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-white/50 px-3 py-2 text-sm">
                <span>{task.title}</span>
                <span className="text-gray-600">
                  {task.status} · {assignee?.displayName ?? "Unassigned"}
                </span>
              </li>
            );
          })}
        </ul>
      </CompanyOsPanel>
    </div>
  );
}
