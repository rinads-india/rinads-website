"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getOsCards } from "@/lib/os-modules";
import { OsCardGrid } from "./OsCardGrid";

export function OsRoomsContent() {
  const { user } = useAuth();
  const cards = getOsCards(user?.role ?? "client");

  return (
    <section className="flex flex-col gap-4">
      <div className="os-glass rounded-3xl p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">
          Collaboration
        </p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">Rooms</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Rooms are collaborative contexts attached to business work. Full Rooms IA lands in a later
          phase — existing room surfaces remain available below.
        </p>
      </div>
      <OsCardGrid cards={cards} view="rooms" />
    </section>
  );
}
