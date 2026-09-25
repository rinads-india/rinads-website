"use client";

import Link from "next/link";
import type { AttentionItem } from "@/lib/os-home/types";

function severityClass(severity: AttentionItem["severity"]): string {
  if (severity === "critical") return "text-red-700";
  if (severity === "attention") return "text-amber-800";
  return "text-gray-900";
}

export function AttentionSummary({
  items,
  error,
}: {
  items: AttentionItem[];
  error?: string;
}) {
  return (
    <section aria-labelledby="os-attention-heading" className="os-glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="os-attention-heading" className="text-base font-semibold text-gray-900">
          Needs your attention
        </h2>
        {items.some((i) => i.source === "demo") && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
            Sample
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          Could not load attention items.
        </p>
      )}

      {!error && items.length === 0 && (
        <p className="mt-3 text-sm text-gray-600">Nothing urgent from supported sources right now.</p>
      )}

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-200/70">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex min-h-11 items-center justify-between gap-4 py-3 transition hover:opacity-80"
              >
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className={`text-xl font-semibold tabular-nums ${severityClass(item.severity)}`}>
                  {item.count}
                  <span className="sr-only"> {item.label}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
