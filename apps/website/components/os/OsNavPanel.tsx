"use client";

import Link from "next/link";
import type { OsNavId, OsNavItem } from "@/lib/os-modules";

type OsNavPanelProps = {
  items: OsNavItem[];
  activeId: OsNavId;
  onSelect: (id: OsNavId) => void;
};

export function OsNavPanel({ items, activeId, onSelect }: OsNavPanelProps) {
  return (
    <nav
      aria-label="RINADS Business OS"
      data-os-guide="dashboard"
      className="os-glass flex flex-col gap-4 rounded-3xl p-4 shadow-sm lg:min-h-[420px] lg:w-56"
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">
          BUSINESS OS
        </p>
        <h2 className="mt-1 text-sm font-semibold leading-snug text-gray-900">RINADS Business OS</h2>
      </div>

      <ul className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          const className = `flex shrink-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
            active
              ? "bg-black text-white shadow-md"
              : "text-gray-800 hover:bg-white/50"
          }`;

          return (
            <li key={item.id}>
              {item.external ? (
                <a
                  href={item.href}
                  className={className}
                  onClick={() => onSelect(item.id)}
                >
                  <Icon size={16} aria-hidden />
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className={className} onClick={() => onSelect(item.id)}>
                  <Icon size={16} aria-hidden />
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
