import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { AcademyClient } from "./AcademyClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/academy");
}

export default function AcademyPage() {
  return <AcademyClient />;
}
