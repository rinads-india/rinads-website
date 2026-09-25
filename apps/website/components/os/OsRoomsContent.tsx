"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getOsCards } from "@/lib/os-modules";
import { isSupabaseMode } from "@/lib/supabase/env";
import { OsCardGrid } from "./OsCardGrid";

/**
 * Rooms module page.
 * Live Supabase: honest empty state (no fabricated room cards).
 * Demo auth: existing prototype cards remain available and tagged.
 */
export function OsRoomsContent() {
  const { user } = useAuth();
  const live = isSupabaseMode();
  const cards = live ? [] : getOsCards(user?.role ?? "client");

  return (
    <section className="flex flex-col gap-4">
      <div className="os-glass rounded-3xl p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">
          Collaboration
        </p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">Rooms</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Rooms are collaborative contexts attached to business work. The collaboration backend is
          not available in live organisations yet — this page does not invent active rooms.
        </p>
        {!live && (
          <p className="mt-3 text-xs text-amber-800">
            Demo mode — sample room cards below are tagged prototypes, not live tenant data.
          </p>
        )}
      </div>

      {live && cards.length === 0 && (
        <div className="os-glass rounded-3xl p-5 sm:p-6" role="status">
          <p className="text-sm font-semibold text-gray-900">No rooms yet</p>
          <p className="mt-2 text-sm text-gray-600">
            Create a Room for a project, team, or ongoing collaboration when Rooms IA ships. Until
            then, continue work from Home, Work, or Customers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/os/home"
              className="inline-flex min-h-11 items-center rounded-xl bg-black px-4 text-sm font-semibold text-white"
            >
              Back to Home
            </Link>
            <Link
              href="/os/work"
              className="inline-flex min-h-11 items-center rounded-xl border border-gray-300/80 bg-white/60 px-4 text-sm font-semibold text-gray-900"
            >
              Open Work
            </Link>
          </div>
        </div>
      )}

      {!live && <OsCardGrid cards={cards} view="rooms" />}
    </section>
  );
}
