"use client";

import { useEffect } from "react";
import { GridOverlay } from "@/components/rinads";
import { AppShell } from "@/components/system/AppShell";
import { OsReturnBanner } from "@/components/os/OsReturnBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeSections } from "@/components/home/HomeSections";
import { trackMarketing } from "@/lib/analytics";

export function HomeClient() {
  useEffect(() => {
    trackMarketing("homepage_view", { path: "/" });
    trackMarketing("rinpo_visible", { path: "/" });
  }, []);

  return (
    <>
      <GridOverlay />
      <AppShell>
        <HomeHero />
        <HomeSections />
      </AppShell>
      <OsReturnBanner />
    </>
  );
}
