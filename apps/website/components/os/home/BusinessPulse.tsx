"use client";

import Link from "next/link";
import type { PulseMetric } from "@/lib/os-home/types";

export function BusinessPulse({
  metrics,
  error,
}: {
  metrics: PulseMetric[];
  error?: string;
}) {
  return (
    <section aria-labelledby="os-pulse-heading" className="os-glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="os-pulse-heading" className="text-base font-semibold text-gray-900">
          Business Pulse
        </h2>
        {metrics.some((m) => m.source === "demo") && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
            Sample
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          Could not load pulse metrics.
        </p>
      )}

      {!error && metrics.length === 0 && (
        <p className="mt-3 text-sm text-gray-600">
          No supported operational metrics are available for this organisation yet.
        </p>
      )}

      {metrics.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {metrics.map((metric) => {
            const body = (
              <div className="rounded-2xl bg-white/55 px-4 py-3 transition hover:bg-white/75">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {metric.label}
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{metric.value}</p>
                <p className="mt-1 text-xs text-gray-600">{metric.timeframe}</p>
                {metric.comparison && (
                  <p className="mt-1 text-xs text-gray-700">{metric.comparison}</p>
                )}
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Source: {metric.source}
                </p>
              </div>
            );
            return (
              <li key={metric.id}>
                {metric.href ? <Link href={metric.href}>{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
