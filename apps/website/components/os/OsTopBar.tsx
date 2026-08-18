"use client";

import Link from "next/link";
import { Logo } from "@/components/rinads/Logo";
import { ThemeToggle } from "@/components/rinads/ThemeToggle";
import { Search, Settings } from "lucide-react";

type OsTopBarProps = {
  view: "dashboard" | "rooms";
  onViewChange: (view: "dashboard" | "rooms") => void;
};

export function OsTopBar({ view, onViewChange }: OsTopBarProps) {
  return (
    <header className="os-glass flex flex-wrap items-center gap-3 rounded-2xl px-3 py-2 shadow-sm sm:px-4">
      <Link href="/os" className="flex shrink-0 items-center" aria-label="RINADS Business OS">
        <Logo className="h-7 w-auto" />
      </Link>

      <div className="hidden items-center gap-2 sm:flex">
        <ThemeToggle className="h-9 w-9" />
        <button
          type="button"
          className="rounded-xl border border-white/30 bg-white/40 px-3 py-1.5 text-xs font-medium text-gray-800 transition hover:bg-white/60"
        >
          <Settings size={14} className="mr-1.5 inline" aria-hidden />
          Settings
        </button>
      </div>

      <div className="hidden items-center gap-2 rounded-2xl bg-white/50 px-3 py-1.5 text-xs text-gray-700 md:flex">
        <span className="font-medium">RINADS Business OS</span>
        <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 font-semibold text-white">
          Live
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-xl bg-white/45 p-0.5">
          <button
            type="button"
            onClick={() => onViewChange("dashboard")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              view === "dashboard" ? "bg-black text-white" : "text-gray-700 hover:opacity-70"
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onViewChange("rooms")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              view === "rooms" ? "bg-black text-white" : "text-gray-700 hover:opacity-70"
            }`}
          >
            Rooms
          </button>
        </div>

        <button
          type="button"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/50 text-gray-800 transition hover:bg-white/70"
        >
          <Search size={16} />
        </button>
      </div>
    </header>
  );
}
