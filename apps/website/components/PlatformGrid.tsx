"use client";
import Link from "next/link";
import { PLATFORM_AVAILABILITY } from "@/lib/availability";

const SURFACES = [
  { key: "rinads-one",   label: "Business OS",        href: "/business-os",       icon: "🏢", desc: "Run your company" },
  { key: "rinpo-chat",   label: "RINPO Intelligence", href: "/rinpo-intelligence", icon: "🧠", desc: "Understand & decide" },
  { key: "ri-search",    label: "RI Search",          href: "/search",            icon: "🔍", desc: "Discover services" },
  { key: "rinaspace",    label: "RINASPACE",          href: "/space",             icon: "🚀", desc: "Your workspace" },
  { key: "rinads-world", label: "RINADS WORLD",       href: "/world",             icon: "🌐", desc: "Immersive gateway" },
  { key: "marketplace",  label: "RI Marketplace",     href: "/marketplace",       icon: "🛒", desc: "Order services" },
];

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE:       "bg-green-50 text-green-700",
  PREVIEW:         "bg-blue-50 text-blue-700",
  PRIVATE_PREVIEW: "bg-purple-50 text-purple-700",
  COMING_SOON:     "bg-amber-50 text-amber-700",
  ROADMAP:         "bg-gray-100 text-gray-500",
};

export default function PlatformGrid() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">One Platform, Every Surface</h2>
      <p className="text-gray-500 text-center mb-10">Everything your business needs, connected.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {SURFACES.map(({ key, label, href, icon, desc }) => {
          const cap = PLATFORM_AVAILABILITY[key];
          const status = cap?.status ?? "COMING_SOON";
          return (
            <Link
              key={key}
              href={href}
              className="group rounded-xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-sm transition-all bg-white flex flex-col gap-2"
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-black">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <span className={`self-start text-xs font-medium px-2 py-0.5 rounded-full mt-auto ${STATUS_STYLES[status] ?? STATUS_STYLES.COMING_SOON}`}>
                {status === "AVAILABLE" ? "Live" : status === "PREVIEW" ? "Preview" : status === "COMING_SOON" ? "Soon" : status}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
