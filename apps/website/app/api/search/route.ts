import { NextRequest, NextResponse } from "next/server";
import { createWebsiteServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pillar: string;
  pricing_model: string;
  base_price: number | null;
  currency: string;
};

type SearchResult = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: "service" | "industry" | "place";
  pillar?: string;
  pricingModel?: string;
  basePrice?: number | null;
  currency?: string;
  href: string;
};

const INDUSTRY_REGISTRY: SearchResult[] = [
  { id: "ind-retail", slug: "retail", name: "Retail & E-commerce", description: "Grow your retail or online store with RINADS services.", kind: "industry", href: "/services#retail" },
  { id: "ind-food", slug: "food", name: "Food & Beverage", description: "Restaurant, café, and cloud kitchen operations.", kind: "industry", href: "/services#food" },
  { id: "ind-health", slug: "health", name: "Health & Wellness", description: "Healthcare, fitness, and wellness business solutions.", kind: "industry", href: "/services#health" },
  { id: "ind-edu", slug: "education", name: "Education & Training", description: "EdTech platforms and coaching institutes.", kind: "industry", href: "/services#education" },
  { id: "ind-realestate", slug: "real-estate", name: "Real Estate", description: "Property management, listings, and CRM.", kind: "industry", href: "/services#real-estate" },
  { id: "ind-finance", slug: "finance", name: "Finance & Accounting", description: "Fintech, accounting firms, and financial services.", kind: "industry", href: "/services#finance" },
  { id: "ind-logistics", slug: "logistics", name: "Logistics & Supply Chain", description: "Fleet, warehouse, and delivery operations.", kind: "industry", href: "/services#logistics" },
  { id: "ind-beauty", slug: "beauty", name: "Beauty & Salon", description: "Salon, spa, and beauty service management.", kind: "industry", href: "/services#beauty" },
];

const WORLD_PLACES: SearchResult[] = [
  { id: "world-plaza", slug: "world-plaza", name: "RINADS Plaza", description: "The central hub of RINADS WORLD — discover products and meet brands.", kind: "place", href: "/world#plaza" },
  { id: "world-market", slug: "world-market", name: "RI Market", description: "Browse and transact with service providers in immersive 3D.", kind: "place", href: "/world#market" },
  { id: "world-campus", slug: "world-campus", name: "RI Campus", description: "Learn, train, and connect with the RINADS community.", kind: "place", href: "/world#campus" },
];

function scoreMatch(text: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") ?? "").trim();
  const kind = searchParams.get("kind") ?? "all";
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

  const results: SearchResult[] = [];

  // Services from DB
  if (kind === "all" || kind === "service") {
    try {
      const supabase = await createWebsiteServerClient();
      const query = supabase
        .from("services")
        .select("id, slug, name, description, pillar, pricing_model, base_price, currency")
        .is("organization_id", null)
        .eq("is_active", true)
        .order("name")
        .limit(30);

      if (q) {
        query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
      }

      const { data } = await query;
      if (data) {
        for (const row of data as ServiceRow[]) {
          results.push({
            id: row.id,
            slug: row.slug,
            name: row.name,
            description: row.description,
            kind: "service",
            pillar: row.pillar,
            pricingModel: row.pricing_model,
            basePrice: row.base_price,
            currency: row.currency,
            href: `/services/${row.slug}`,
          });
        }
      }
    } catch {
      // Non-fatal — continue with static results
    }
  }

  // Industry registry
  if (kind === "all" || kind === "industry") {
    for (const item of INDUSTRY_REGISTRY) {
      if (!q || scoreMatch(item.name + " " + item.description, q)) {
        results.push(item);
      }
    }
  }

  // World places
  if (kind === "all" || kind === "place") {
    for (const place of WORLD_PLACES) {
      if (!q || scoreMatch(place.name + " " + place.description, q)) {
        results.push(place);
      }
    }
  }

  return NextResponse.json({ results: results.slice(0, limit), total: results.length });
}
