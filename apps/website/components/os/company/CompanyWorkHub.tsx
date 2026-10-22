"use client";

import Link from "next/link";
import {
  DEMO_PROJECTS,
  DEMO_TASKS,
  DEMO_WORKERS,
  DEMO_COMPANIES,
  rankAssignees,
  capacityScore,
  evaluateWorkAssignment,
  type WorkActorProfile,
  type WorkUnit,
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

  const policyExample: WorkUnit = {
    id: "policy-preview",
    organizationId: "org_current",
    title: "Policy preview",
    status: "ready",
    requiredSkills: ["operations"],
    requiredPermissions: ["work.execute"],
    evidence: [],
    approvalRequired: true,
  };
  const actorExample: WorkActorProfile = {
    actorId: "actor_preview",
    kind: "human",
    organizationId: "org_current",
    skills: ["operations"],
    available: true,
    workload: 0.25,
    qualityScore: 0.85,
    permissions: ["work.execute"],
  };
  const policyDecision = evaluateWorkAssignment(policyExample, actorExample);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Work Graph · governed MVP</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Work</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/os/labs" className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900">LABS</Link>
            <Link href="/os/approvals" className="rounded-xl bg-gray-950 px-3 py-2 text-xs font-semibold text-white">Approvals</Link>
          </div>
        </div>
        <CompanyOsDemoNotice />
      </header>

      <CompanyOsPanel title="Governance gate" description="Recommendations are advisory; tenant and permission policy remains authoritative.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/60 px-3 py-3 text-sm">
            <p className="font-semibold text-gray-900">Allocation policy</p>
            <p className="mt-1 text-xs text-gray-600">Example policy result: {policyDecision.allowed ? "eligible" : "blocked"}.</p>
          </div>
          <div className="rounded-xl bg-white/60 px-3 py-3 text-sm">
            <p className="font-semibold text-gray-900">Evidence</p>
            <p className="mt-1 text-xs text-gray-600">Files, URLs, commits, deployments and records back review decisions.</p>
          </div>
          <div className="rounded-xl bg-white/60 px-3 py-3 text-sm">
            <p className="font-semibold text-gray-900">RINADS Verified</p>
            <p className="mt-1 text-xs text-gray-600">Only after named human approval plus inspectable evidence.</p>
          </div>
        </div>
      </CompanyOsPanel>

      {top && (
        <CompanyOsPanel title="Assignment recommendation">
          <p className="text-sm text-gray-800">
            Top demo pick: <span className="font-semibold">{top.displayName}</span> (score{" "}
            {top.score.toFixed(3)}). Managers can override intelligent allocation; production candidates must additionally pass Work Graph tenant, permission and conflict gates.
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
