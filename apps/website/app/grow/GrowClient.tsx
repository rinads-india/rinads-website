"use client";

import "@/app/grow/grow.css";
import { Navbar } from "@/components/rinads/Navbar";
import { ScrollVideo } from "@/components/grow/ScrollVideo";
import { GrowSectionOne } from "@/components/grow/GrowSectionOne";
import { GrowSectionTwo } from "@/components/grow/GrowSectionTwo";

const GROW_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4";

export function GrowClient() {
  return (
    <main id="main" className="grow-page font-inter">
      <ScrollVideo src={GROW_VIDEO} />
      <div className="relative z-10">
        <Navbar />
        <GrowSectionOne />
        <div aria-hidden className="h-[80vh]" />
        <GrowSectionTwo />
      </div>
    </main>
  );
}
