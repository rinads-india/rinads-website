"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { GROWTH_CATEGORIES, GROWTH_GUIDES } from "@/lib/content/growth-knowledge";

type Category = (typeof GROWTH_CATEGORIES)[number];

export function GrowthLibraryClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const guides = useMemo(() => {
    const phrase = query.trim().toLocaleLowerCase();
    return GROWTH_GUIDES.filter((guide) =>
      (category === "All" || guide.category === category) &&
      (!phrase || [guide.title, guide.description, guide.category, guide.audience].some((item) => item.toLocaleLowerCase().includes(phrase)))
    );
  }, [query, category]);

  return (
    <section className="px-6 pb-24 md:px-12 lg:px-20" aria-label="Growth learning library">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <label htmlFor="growth-knowledge-search" className="mb-2 block text-sm font-medium text-foreground">
            Search learning guides
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-rinads-primary" aria-hidden="true" />
            <input
              id="growth-knowledge-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: local SEO, search console, AI search..."
              className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter guides by topic">
            {GROWTH_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rinads-primary ${category === item ? "border-rinads-primary bg-rinads-primary text-white" : "border-[var(--border)] text-muted-foreground hover:border-rinads-primary/50 hover:text-foreground"}`}
              >{item}</button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
            {guides.length} {guides.length === 1 ? "guide" : "guides"} found · Original RI GROWTH educational material
          </p>
        </div>

        {guides.length ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <article key={guide.slug} className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-rinads-primary/50">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-rinads-primary/10 text-rinads-primary">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">{guide.category}</p>
                <h2 className="mt-3 text-xl font-bold leading-snug text-foreground">
                  <Link href={`/resources/growth-library/${guide.slug}`} className="hover:text-rinads-primary">
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{guide.description}</p>
                <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
                  <span className="text-xs text-muted-foreground">{guide.readMinutes} min read</span>
                  <Link href={`/resources/growth-library/${guide.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-rinads-primary hover:underline">
                    Read guide <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-[var(--border)] p-10 text-center">
            <h2 className="text-lg font-semibold text-foreground">No guides match that search.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try a broader search or select another topic.</p>
            <button type="button" onClick={() => { setQuery(""); setCategory("All"); }} className="mt-5 text-sm font-semibold text-rinads-primary hover:underline">Clear filters</button>
          </div>
        )}
        <div className="mt-12 rounded-2xl border border-rinads-primary/30 bg-rinads-primary/5 p-7 md:p-10">
          <h2 className="text-2xl font-bold text-foreground">Turn knowledge into an evidence-based growth plan.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            RI GROWTH Search Intelligence is a controlled pilot. A visibility audit starts from public evidence and requires owner authorization for connected Google data.
          </p>
          <Link href="/grow/search-intelligence" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline">
            Explore the Search Intelligence pilot <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
