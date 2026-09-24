"use client";

import Link from "next/link";
import type { ModuleDestination, OsModuleBridgeConfig } from "@/lib/os-module-destinations";

function DestinationRow({ item }: { item: ModuleDestination }) {
  const body = (
    <div
      className={`os-glass flex min-h-11 flex-col gap-1 rounded-2xl px-4 py-3 ${
        item.status === "unavailable" ? "opacity-70" : "hover:bg-white/70"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            item.status === "available"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {item.status === "available" ? "Available" : "Not available yet"}
        </span>
      </div>
      <p className="text-xs text-gray-600">{item.description}</p>
      {item.external && item.status === "available" && (
        <p className="text-[11px] text-gray-500">Opens a supported tool outside this shell.</p>
      )}
    </div>
  );

  if (item.status === "available" && item.href) {
    if (item.external) {
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
          {body}
        </a>
      );
    }
    return (
      <Link href={item.href} className="block">
        {body}
      </Link>
    );
  }

  return <div>{body}</div>;
}

export function OsModuleBridge({ config }: { config: OsModuleBridgeConfig }) {
  const available = config.destinations.filter((d) => d.status === "available");
  const unavailable = config.destinations.filter((d) => d.status === "unavailable");

  return (
    <section className="flex flex-col gap-4">
      <div className="os-glass rounded-3xl p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">
          Module
        </p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">{config.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">{config.summary}</p>
      </div>

      {available.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Available
          </h2>
          <ul className="space-y-2">
            {available.map((item) => (
              <li key={item.id}>
                <DestinationRow item={item} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {unavailable.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Not available yet
          </h2>
          <ul className="space-y-2">
            {unavailable.map((item) => (
              <li key={item.id}>
                <DestinationRow item={item} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
