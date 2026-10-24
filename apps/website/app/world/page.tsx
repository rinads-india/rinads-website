import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RINADS WORLD — Immersive Business Universe",
  description: "Enter RINADS WORLD — the immersive 3D platform where brands, services, and businesses connect.",
};

const PLACES = [
  { name: "RINADS Plaza", description: "The central hub — discover products and meet brands.", anchor: "plaza" },
  { name: "RI Market", description: "Browse and purchase services in immersive 3D.", anchor: "market" },
  { name: "RI Campus", description: "Learn, train, and connect with the RINADS community.", anchor: "campus" },
];

export default function WorldPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 text-xs text-white/60 mb-8 uppercase tracking-widest">
          Preview
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
          RINADS WORLD
        </h1>
        <p className="text-xl text-white/60 max-w-xl mb-10">
          An immersive 3D universe where your business operates, connects, and grows.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://world.rinads.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
          >
            Enter WORLD →
          </a>
          <Link
            href="/space"
            className="px-8 py-3 border border-white/30 rounded-full font-semibold hover:border-white transition-colors"
          >
            Open RINASPACE
          </Link>
        </div>
      </section>

      {/* Places */}
      <section className="max-w-5xl mx-auto px-4 py-16" id="places">
        <h2 className="text-2xl font-bold mb-8 text-white/90">Explore WORLD</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLACES.map((place) => (
            <div
              key={place.anchor}
              id={place.anchor}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <p className="font-semibold text-lg mb-2">{place.name}</p>
              <p className="text-sm text-white/50">{place.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-16 text-center px-4">
        <p className="text-white/40 text-sm mb-4">Built on RINADS Platform · Powered by RINADS INTELLIGENCE</p>
        <Link href="/search" className="text-white/60 hover:text-white text-sm underline underline-offset-4">
          Discover services →
        </Link>
      </section>
    </main>
  );
}
