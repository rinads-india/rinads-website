"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DEMO_ATTENTION,
  DEMO_TASKS,
  demoApprovalInbox,
  demoCompanyPulse,
  rankAssignees,
  DEMO_WORKERS,
  capacityScore,
} from "@rinads/company-os";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";
import { TASK_KANBAN_COLUMNS, formatInrAmount } from "@/lib/company-os-display";

const KANBAN_LABELS: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  waiting: "Waiting",
  review: "Review",
  done: "Done",
};

type ClosingForm = {
  completed: string;
  pending: string;
  blocked: string;
  clientDependency: string;
  tomorrowPriority: string;
  capacityNotes: string;
  rinpoDraft: string;
};

const EMPTY_CLOSING: ClosingForm = {
  completed: "",
  pending: "",
  blocked: "",
  clientDependency: "",
  tomorrowPriority: "",
  capacityNotes: "",
  rinpoDraft: "",
};

export function CompanyHome() {
  const pulse = demoCompanyPulse();
  const approvals = demoApprovalInbox();
  const [closing, setClosing] = useState<ClosingForm>(EMPTY_CLOSING);
  const [closingMessage, setClosingMessage] = useState<string | null>(null);

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, typeof DEMO_TASKS>();
    for (const col of TASK_KANBAN_COLUMNS) map.set(col, []);
    for (const task of DEMO_TASKS) {
      if (task.status === "cancelled") continue;
      const list = map.get(task.status);
      if (list) list.push(task);
    }
    return map;
  }, []);

  const topAssignee = useMemo(() => {
    const ranked = rankAssignees(
      DEMO_WORKERS.map((w) => ({
        workerId: w.id,
        displayName: w.displayName,
        factors: {
          skillMatch: 0.85,
          availability: 1,
          currentCapacity: capacityScore(w.availableHoursWeek, w.committedHoursWeek),
          deadlineUrgency: 0.7,
          clientPriority: 0.8,
          historicalDeliveryQuality: w.kind === "bot" ? 0.75 : 0.9,
          costEfficiency: w.kind === "bot" ? 0.95 : 0.7,
          dependencyFit: 0.8,
        },
      })),
    );
    return ranked[0] ?? null;
  }, []);

  const onClosingSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setClosingMessage(
      "Daily closing captured locally (demo). Nothing was persisted — connect cos_daily_closings in a later phase.",
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">
          Company OS
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Today</h1>
        <CompanyOsDemoNotice />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <CompanyOsPanel title="Today at a glance">
          <ul className="space-y-3 text-sm text-gray-800">
            <li className="flex justify-between gap-2">
              <span>Open tasks (sample)</span>
              <span className="font-semibold">{DEMO_TASKS.length}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>
                Approvals inbox{" "}
                <Link href="/os/approvals" className="text-rinads-primary underline">
                  view
                </Link>
              </span>
              <span className="font-semibold">{approvals.length}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Founder attention items</span>
              <span className="font-semibold">{DEMO_ATTENTION.length}</span>
            </li>
            <li className="flex justify-between gap-2 border-t border-black/5 pt-3">
              <span>Weighted pipeline (sample)</span>
              <span className="font-semibold">
                {formatInrAmount(pulse.pipelineWeighted, pulse.currency)}
              </span>
            </li>
          </ul>
        </CompanyOsPanel>

        <CompanyOsPanel title="Attention" description="Sample founder attention queue — not live alerts.">
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {DEMO_ATTENTION.map((item) => (
              <li key={item.id} className="rounded-2xl bg-white/50 px-3 py-2">
                <p className="text-xs font-semibold text-gray-500">{item.severity}</p>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                {item.href && (
                  <Link href={item.href} className="text-xs text-rinads-primary underline">
                    Open
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </CompanyOsPanel>
      </div>

      {topAssignee && (
        <CompanyOsPanel
          title="Assignment recommendation"
          description="Intelligent allocation suggestion — managers may override."
        >
          <p className="text-sm text-gray-800">
            Top pick for capacity-aware work:{" "}
            <span className="font-semibold">{topAssignee.displayName}</span> (score{" "}
            {topAssignee.score.toFixed(2)})
          </p>
          <Link href="/os/work" className="mt-2 inline-block text-sm text-rinads-primary underline">
            Review on Work
          </Link>
        </CompanyOsPanel>
      )}

      <CompanyOsPanel title="My work" description="Kanban from sample tasks.">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {TASK_KANBAN_COLUMNS.map((col) => (
            <div key={col} className="min-w-[10.5rem] flex-1 rounded-2xl bg-white/40 p-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {KANBAN_LABELS[col] ?? col}
              </p>
              <ul className="space-y-2">
                {(tasksByColumn.get(col) ?? []).map((task) => (
                  <li
                    key={task.id}
                    className="rounded-xl bg-white/80 px-2 py-2 text-xs shadow-sm"
                  >
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-gray-500">{task.priority}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CompanyOsPanel>

      <CompanyOsPanel
        title="Daily closing"
        description="End-of-day capture (cos_daily_closings fields). Demo submit only."
      >
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={onClosingSubmit}>
          {(
            [
              ["completed", "Completed today"],
              ["pending", "Still pending"],
              ["blocked", "Blocked"],
              ["clientDependency", "Client dependency"],
              ["tomorrowPriority", "Tomorrow priority"],
              ["capacityNotes", "Capacity notes"],
              ["rinpoDraft", "RINPO draft notes"],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-800">{label}</span>
              <textarea
                className="min-h-[4.5rem] rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm"
                value={closing[field]}
                onChange={(e) => setClosing((prev) => ({ ...prev, [field]: e.target.value }))}
              />
            </label>
          ))}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="min-h-11 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Submit closing (demo)
            </button>
            {closingMessage && (
              <p className="text-sm text-emerald-800" role="status">{closingMessage}</p>
            )}
          </div>
        </form>
      </CompanyOsPanel>
    </div>
  );
}
