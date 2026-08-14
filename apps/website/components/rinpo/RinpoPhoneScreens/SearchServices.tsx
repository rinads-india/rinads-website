"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const SERVICES = [
  { id: "digital", name: "Digital Marketing", desc: "SEO, Social Media, Performance Ads" },
  { id: "software", name: "Custom Software", desc: "Web Apps, Mobile Apps, ERP Systems" },
  { id: "ai", name: "AI Automation", desc: "Chatbots, Workflow Automation, AI Tools" },
];

export function SearchServices() {
  const [query, setQuery] = useState("");

  const filtered = SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-white/10">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search RINADS services..."
          className="w-full rounded-xl bg-white/5 border border-[var(--rinads-primary)]/50 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--rinads-primary)]"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scrollbar-hide">
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-white/5 border border-[var(--rinads-primary)]/30 p-3"
          >
            <p className="text-sm font-medium text-white">{s.name}</p>
            <p className="text-xs text-white/60">{s.desc}</p>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-white/50 text-center py-4">No services match your search.</p>
        )}
      </div>
    </div>
  );
}
