import { createWebsiteServerClient } from "@/lib/supabase/server";
import MarketplaceClient from "./MarketplaceClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RI Marketplace — RINADS",
  description: "Discover and order RINADS platform services across every pillar.",
};

export const dynamic = "force-dynamic";

type ServiceRow = {
  id: string; slug: string; name: string; description: string;
  pillar: string; pricing_model: string; base_price: number | null;
  currency: string; estimated_delivery_days: number | null;
};

export default async function MarketplacePage() {
  const supabase = await createWebsiteServerClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, slug, name, description, pillar, pricing_model, base_price, currency, estimated_delivery_days")
    .is("organization_id", null)
    .eq("is_active", true)
    .order("pillar")
    .order("name");

  return <MarketplaceClient services={(services ?? []) as ServiceRow[]} />;
}
