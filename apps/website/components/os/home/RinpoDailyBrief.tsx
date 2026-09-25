"use client";

import Link from "next/link";
import type { RinpoDailyBriefData } from "@/lib/os-home/types";
import { useOsShell } from "@/components/os/BusinessOsShell";

function kindLabel(kind: RinpoDailyBriefData["recommendations"][number]["kind"]): string {
  switch (kind) {
    case "prepared_action":
      return "Prepared action";
    case "approval_required":
      return "Approval required";
    case "executed":
      return "Executed";
    default:
      return "Recommendation";
  }
}

export function RinpoDailyBrief({ brief }: { brief: RinpoDailyBriefData }) {
  const { askRinpo } = useOsShell();

  return (
    <section aria-labelledby="os-rinpo-brief-heading" className="os-glass rounded-3xl p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-rinads-primary">RINPO</p>
      <h2 id="os-rinpo-brief-heading" className="mt-1 text-base font-semibold text-gray-900">
        Your daily brief
      </h2>
      <p className="mt-2 text-sm text-gray-700">{brief.summary}</p>
      {brief.source === "demo" && (
        <p className="mt-1 text-xs text-amber-800">Sample recommendations — not live execution.</p>
      )}

      {brief.recommendations.length > 0 && (
        <ul className="mt-4 space-y-2">
          {brief.recommendations.map((rec) => (
            <li key={rec.id}>
              {rec.href ? (
                <Link
                  href={rec.href}
                  className="block rounded-2xl bg-white/50 px-3 py-2.5 text-sm text-gray-800 transition hover:bg-white/80"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {kindLabel(rec.kind)}
                  </span>
                  <span className="mt-0.5 block">{rec.text}</span>
                </Link>
              ) : (
                <div className="rounded-2xl bg-white/50 px-3 py-2.5 text-sm text-gray-800">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {kindLabel(rec.kind)}
                  </span>
                  <span className="mt-0.5 block">{rec.text}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => askRinpo("What should I focus on today?")}
        className="mt-4 min-h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Review with RINPO
      </button>
    </section>
  );
}
