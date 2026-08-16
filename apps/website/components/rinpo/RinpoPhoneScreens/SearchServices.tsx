"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";

const SERVICES = [
  { id: "digital", name: "Digital Marketing", desc: "SEO, Social Media, Performance Ads", href: "/grow" },
  { id: "software", name: "Custom Software", desc: "Web Apps, Mobile Apps, ERP Systems" },
  { id: "ai", name: "AI Automation", desc: "Chatbots, Workflow Automation, AI Tools" },
];

export function SearchServices() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { addSearch, addInterest, addFavoriteService, memory } = useRinpoMemory();

  const filtered = SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (service: (typeof SERVICES)[number]) => {
    addInterest(service.name);
    addFavoriteService(service.name);
    if (service.href) {
      router.push(service.href);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-white/10">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length > 2) addSearch(e.target.value);
          }}
          placeholder="Search RINADS services..."
          className="w-full rounded-xl bg-white/5 border border-[var(--rinads-primary)]/50 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--rinads-primary)]"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scrollbar-hide">
        {filtered.map((s, i) => (
          <motion.button
            type="button"
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleSelect(s)}
            className="w-full rounded-xl bg-white/5 border border-[var(--rinads-primary)]/30 p-3 text-left transition-colors hover:border-[var(--rinads-primary)]/60"
          >
            <p className="text-sm font-medium text-white">
              {s.name}{" "}
              {memory.favoriteServices.includes(s.name) && (
                <span className="text-[10px] text-rinads-primary">★ saved</span>
              )}
            </p>
            <p className="text-xs text-white/60">{s.desc}</p>
            {s.href && (
              <Link
                href={s.href}
                onClick={(event) => event.stopPropagation()}
                className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-rinads-primary hover:underline"
              >
                Open RINADS Grow →
              </Link>
            )}
          </motion.button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-white/50 text-center py-4">No services match your search.</p>
        )}
      </div>
    </div>
  );
}
