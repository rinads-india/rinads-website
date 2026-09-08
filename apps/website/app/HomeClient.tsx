"use client";

import { GridOverlay, Navbar, Footer } from "@/components/rinads";
import { OsReturnBanner } from "@/components/os/OsReturnBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeSections } from "@/components/home/HomeSections";

export function HomeClient() {
  return (
    <>
      <GridOverlay />
      <Navbar />
      <main id="main">
        <HomeHero />
        <HomeSections />
        <Footer />
      </main>
      <OsReturnBanner />
    </>
  );
}
