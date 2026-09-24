"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getOsCards } from "@/lib/os-modules";
import { OsCardGrid } from "./OsCardGrid";
import { OsDashboardHero } from "./OsDashboardHero";
import { OsPresenceRow } from "./OsPresenceRow";
import { OsSystemStatus } from "./OsSystemStatus";

export function OsHomeContent() {
  const { user } = useAuth();
  const cards = getOsCards(user?.role ?? "client");

  return (
    <>
      <OsDashboardHero />
      <div className="flex flex-1 flex-col gap-4 xl:flex-row">
        <OsCardGrid cards={cards} view="home" />
        <OsSystemStatus />
      </div>
      <OsPresenceRow />
    </>
  );
}
