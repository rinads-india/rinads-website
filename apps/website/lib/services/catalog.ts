import { createWebsiteServerClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import type { ServiceCatalogItem } from "./types";

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pillar: string;
  pricing_model: string;
  base_price: number | null;
  currency: string;
  estimated_delivery_days: number | null;
};

function mapRow(row: ServiceRow): ServiceCatalogItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    pillar: row.pillar as ServiceCatalogItem["pillar"],
    pricingModel: row.pricing_model,
    basePrice: row.base_price,
    currency: row.currency,
    estimatedDeliveryDays: row.estimated_delivery_days,
  };
}

export async function listPlatformServices(): Promise<ServiceCatalogItem[]> {
  const { url, anonKey } = getSupabasePublicConfig();
  if (!url || !anonKey) return [];

  const supabase = await createWebsiteServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, slug, name, description, pillar, pricing_model, base_price, currency, estimated_delivery_days")
    .is("organization_id", null)
    .eq("is_active", true)
    .order("pillar")
    .order("name");

  if (error || !data?.length) return [];
  return (data as ServiceRow[]).map(mapRow);
}

export async function getPlatformServiceBySlug(slug: string): Promise<ServiceCatalogItem | null> {
  const services = await listPlatformServices();
  return services.find((s) => s.slug === slug) ?? null;
}
