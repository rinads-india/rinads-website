"use client";

import { useState, useEffect, useCallback } from "react";

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

type KindFilter = "all" | "service" | "industry" | "place";

const KIND_LABELS: Record<KindFilter, string> = {
  all: "All",
  service: "Services",
  industry: "Industries",
  place: "World Places",
};

const KIND_BADGE: Record<string, string> = {
  service: "bg-blue-100 text-blue-800",
  industry: "bg-green-100 text-green-800",
  place: "bg-purple-100 text-purple-800",
};

const POPULAR = ["Custom Software", "Growth Marketing", "AI Automation", "Real Estate", "Retail", "RINADS Plaza"];

export function RISearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<KindFilter>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string, k: KindFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, kind: k, limit: "20" });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query, kind), 300);
    return () => clearTimeout(t);
  }, [query, kind, doSearch]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">RI Search</h1>
      <p className="text-gray-500 mb-8">Discover services, industries, and RINADS WORLD places.</p>

      {/* Search input */}
      <div className="relative mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services, industries, world places…"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black pr-10"
          autoFocus
        />
        {loading && (
          <span className="absolute right-3 top-3.5 text-gray-400 text-sm">…</span>
        )}
      </div>

      {/* Popular suggestions */}
      {!query && (
        <div className="flex flex-wrap gap-2 mb-8">
          {POPULAR.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="px-3 py-1 text-sm rounded-full border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Kind filters */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(KIND_LABELS) as KindFilter[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              kind === k
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

      {/* Results */}
      {results.length === 0 && !loading && query && (
        <p className="text-gray-400 text-sm">No results for &ldquo;{query}&rdquo;. Try a different term.</p>
      )}

      <div className="space-y-3">
        {results.map((r) => (
          <a
            key={r.id}
            href={r.href}
            className="block p-4 rounded-xl border border-gray-200 hover:border-black transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KIND_BADGE[r.kind] ?? "bg-gray-100 text-gray-600"}`}>
                    {r.kind === "place" ? "World Place" : r.kind.charAt(0).toUpperCase() + r.kind.slice(1)}
                  </span>
                  {r.pillar && (
                    <span className="text-xs text-gray-400">{r.pillar}</span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 group-hover:text-black">{r.name}</p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
              </div>
              {r.basePrice != null && (
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">
                    {r.currency ?? "INR"} {r.basePrice.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">{r.pricingModel}</p>
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
