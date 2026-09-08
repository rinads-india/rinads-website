import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageMetadata } from "@/lib/cms";
import { getServiceLine } from "@/lib/content/services";
import { ServiceLinePage } from "@/components/system/ServiceLinePage";

const SLUG = "training";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(`/services/${SLUG}`);
}

export default function Page() {
  const service = getServiceLine(SLUG);
  if (!service) notFound();
  return <ServiceLinePage service={service} />;
}
