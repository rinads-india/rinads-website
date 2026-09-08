import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageMetadata } from "@/lib/cms";
import { getOsPage } from "@/lib/content/platform-os";
import { OsMarketingPage } from "@/components/system/OsMarketingPage";

const SLUG = "build-os";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(`/platform/${SLUG}`);
}

export default function Page() {
  const content = getOsPage(SLUG);
  if (!content) notFound();
  return <OsMarketingPage content={content} />;
}
