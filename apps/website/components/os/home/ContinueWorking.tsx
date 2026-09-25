"use client";

import Link from "next/link";
import type { RecentEntity } from "@/lib/os-home/types";

export function ContinueWorking({
  entities,
  error,
}: {
  entities: RecentEntity[];
  error?: string;
}) {
  return (
    <section aria-labelledby="os-continue-heading" className="os-glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="os-continue-heading" className="text-base font-semibold text-gray-900">
          Continue working
        </h2>
        {entities.some((e) => e.source === "demo") && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
            Sample
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          Could not load recent work.
        </p>
      )}

      {!error && entities.length === 0 && (
        <p className="mt-3 text-sm text-gray-600">
          No recent tasks or orders to continue. Start from Work when you are ready.
        </p>
      )}

      {entities.length > 0 && (
        <ul className="mt-4 space-y-2">
          {entities.map((entity) => (
            <li key={entity.id}>
              <Link
                href={entity.href}
                className="flex min-h-11 flex-col rounded-2xl bg-white/55 px-4 py-3 transition hover:bg-white/80"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {entity.entityTypeLabel}
                </span>
                <span className="mt-0.5 text-sm font-semibold text-gray-900">{entity.name}</span>
                <span className="mt-0.5 text-xs text-gray-600">{entity.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
