import type { Metadata } from "next";
import { AcademyClient } from "./AcademyClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "RI LABS | RINADS",
    description:
      "Learn, practice, build, ship, and prove capability through RI LABS with RINPO Tutor and practical project work.",
  };
}

export default function AcademyPage() {
  return <AcademyClient />;
}
