import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageMetadata } from "@/lib/cms";
import { getAcademyProgram } from "@/lib/content/academy";
import { AcademyProgramPage } from "@/components/system/AcademyProgramPage";

const SLUG = "creator";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(`/academy/${SLUG}`);
}

export default function Page() {
  const program = getAcademyProgram(SLUG);
  if (!program) notFound();
  return <AcademyProgramPage program={program} />;
}
