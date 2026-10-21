"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

type ServiceRow = {
  id: string; slug: string; name: string; description: string;
  pillar: string; pricing_model: string; base_price: number | null;
  currency: string; estimated_delivery_days: number | null;
};

const PILLAR_COLORS: Record<string, string> = {
  intelligence: "bg-purple-50 text-purple-700 border-purple-200",
  automation:   "bg-blue-50 text-blue-700 border-blue-200",
  commerce:     "bg-green-50 text-green-700 border-green-200",
  growth:       "bg-orange-50 text-orange-700 border-orange-200",
  operations:   "bg-gray-50 text-gray-700 border-gray-200",
};

function pillarColor(pillar: string) {
  return PILLAR_COLORS[pillar?.toLowerCase()] ?? "bg-gray-50 text-gray-600 border-gray-200";
}

function formatPrice(price: number | null, currency: string, model: string) {
  if (!price) return model === "custom" ? "Custom pricing" : "Contact us";
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${price.toLocaleString()} / ${model === "one_time" ? "project" : model === "monthly" ? "mo" : "order"}`;
}

export default function MarketplaceClient({ services }: { services: ServiceRow[] }) {
  const [query, setQuery] = useState("");
  const [pillar, setPillar] = useState("all");

  const pillars = useMemo(() => {
    const set = new Set(services.map(s => s.pillar).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [services]);

  const filtered = useMemo(() => {
    return services.filter(s => {
      const matchPillar = pillar === "all" || s.pillar === pillar;
      const matchQ = !query || `${s.name} ${s.description} ${s.pillar}`.toLowerCase().includes(query.toLowerCase());
      return matchPillar && matchQ;
    });
  }, [services, query, pillar]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">RI Marketplace</h1>
        <p className="text-lg text-gray-600">Platform services across every pillar — order, track, and scale.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="search"
          placeholder="Search services…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
        <div className="flex gap-2 flex-wrap">
          {pillars.map(p => (
            <button
              key={p}
              onClick={() => setPillar(p)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                pillar === p ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {p === "all" ? "All Pillars" : p}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">{filtered.length} service{filtered.length !== 1 ? "s" : ""}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No services match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(service => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group rounded-xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-sm transition-all bg-white flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${pillarColor(service.pillar)}`}>
                  {service.pillar}
                </span>
                {service.estimated_delivery_days && (
                  <span className="text-xs text-gray-400">{service.estimated_delivery_days}d delivery</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-black mb-1">{service.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 flex-1">{service.description}</p>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {formatPrice(service.base_price, service.currency, service.pricing_model)}
                </span>
                <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-16 pt-8 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500 mb-3">Need something custom?</p>
        <Link href="/contact" className="text-sm font-medium text-black hover:underline">Talk to our team →</Link>
      </div>
    </main>
  );
}
