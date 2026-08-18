"use client";

import {
  GridOverlay,
  Navbar,
  Portfolio,
  Footer,
} from "@/components/rinads";
import { OsReturnBanner } from "@/components/os/OsReturnBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { WhatIsRinads } from "@/components/home/WhatIsRinads";
import { BusinessOsOverview } from "@/components/home/BusinessOsOverview";
import { ConnectedWorkflow } from "@/components/home/ConnectedWorkflow";
import { RinpoSection } from "@/components/home/RinpoSection";
import { IndustrySolutions } from "@/components/home/IndustrySolutions";
import { ServicesOverview } from "@/components/home/ServicesOverview";
import { HomeCta } from "@/components/home/HomeCta";

export function HomeClient() {
  return (
    <>
      <GridOverlay />
      <Navbar />
      <main id="main">
        <HomeHero />
        <WhatIsRinads />
        <BusinessOsOverview />
        <ConnectedWorkflow />
        <RinpoSection />
        <IndustrySolutions />
        <ServicesOverview />
        <Portfolio />
        <HomeCta />
        <Footer />
      </main>
      <OsReturnBanner />
    </>
  );
}
