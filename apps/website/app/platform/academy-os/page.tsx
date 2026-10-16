import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { OsMarketingRoute } from "@/components/system/OsMarketingRoute";

const SLUG = "academy-os";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(`/platform/${SLUG}`);
}

export default function Page() {
  return <OsMarketingRoute slug={SLUG} />;
}
