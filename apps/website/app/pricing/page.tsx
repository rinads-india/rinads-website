import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { PRICING_FAQ } from "@/lib/content/commercialConfig";
import { buildFAQPageJsonLd } from "@/lib/json-ld";
import { PricingClient } from "./PricingClient";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/pricing") as Metadata) ?? { title: "Pricing | RINADS" };
}

export default function PricingPage() {
  return (
    <>
      <CommercialJsonLd
        path="/pricing"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]}
        extra={buildFAQPageJsonLd(PRICING_FAQ)}
      />
      <PricingClient />
    </>
  );
}
