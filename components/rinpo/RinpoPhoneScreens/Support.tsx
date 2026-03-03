"use client";

import { motion } from "framer-motion";

export function Support() {
  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h3 className="text-sm font-semibold text-[var(--rinads-primary)]">Support</h3>
        <ul className="space-y-2 text-xs text-white/80">
          <li>
            <a href="/contact" className="underline text-[var(--rinads-primary)]">FAQ</a>
          </li>
          <li>Open a ticket (Phase 2)</li>
          <li>Contact: +91 89211 95996</li>
          <li>www.rinads.com</li>
        </ul>
        <div className="rounded-xl bg-white/5 border border-[var(--rinads-primary)]/30 p-3">
          <p className="text-xs text-white/60">RINPO can help you navigate support options. Just ask in Chat.</p>
        </div>
      </motion.div>
    </div>
  );
}
