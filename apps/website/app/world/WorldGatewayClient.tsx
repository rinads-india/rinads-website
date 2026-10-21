"use client";

import Link from "next/link";

type Destination = {
  id: string;
  label: string;
  description: string;
  anchor: string;
  status: "live" | "preview" | "soon";
};

const DESTINATIONS: Destination[] = [
  { id: "thrissur-origin", label: "Thrissur Origin", description: "The founding RINADS hub — explore the origin story.", anchor: "thrissur-origin", status: "preview" },
  { id: "marketplace-hub", label: "Marketplace Hub", description: "Browse services, products, and brands in 3D space.", anchor: "marketplace-hub", status: "preview" },
  { id: "studios", label: "Studios", description: "Creative studios for content, branding, and more.", anchor: "studios", status: "soon" },
  { id: "academy", label: "RI Academy", description: "Learning environments and skill-building hubs.", anchor: "academy", status: "soon" },
];

const STATUS_STYLES: Record<string, string> = {
  live: "bg-green-900/40 text-green-300 border border-green-700/50",
  preview: "bg-yellow-900/30 text-yellow-300 border border-yellow-700/40",
  soon: "bg-gray-800/60 text-gray-500 border border-gray-700/40",
};

export function WorldGatewayClient() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative px-4 pt-20 pb-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          WORLD PREVIEW
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
          RINADS WORLD
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
          An immersive universe connecting businesses, creators, and communities in a shared digital space built on the RINADS platform.
        </p>
        <a
          href="https://world.rinads.com"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Enter RINADS WORLD
          <span aria-hidden>→</span>
        </a>
        <p className="text-gray-600 text-xs mt-3">
          Requires WebGL • Desktop recommended
        </p>
      </div>

      {/* Destinations */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-6">
          Destinations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DESTINATIONS.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm">{d.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[d.status]}`}>
                  {d.status === "soon" ? "Coming soon" : d.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{d.description}</p>
            </div>
          ))}
        </div>

        {/* Identity CTA */}
        <div className="mt-12 rounded-xl border border-gray-800 bg-gray-900/40 p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="font-semibold text-white text-sm mb-1">Bring your RINADS identity</p>
            <p className="text-gray-400 text-sm">Sign in to carry your RI profile, workspace, and services into WORLD.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/signup" className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors">
              Create account
            </Link>
            <Link href="/space" className="px-4 py-2 rounded-lg border border-gray-700 text-white text-sm font-medium hover:border-gray-500 transition-colors">
              My space
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
