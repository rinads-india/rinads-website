"use client";
import { GameBackground } from "@/components/layout/GameBackground";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <>
      <GameBackground />
      <Header />
      <main className="min-h-screen pt-14 sm:pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <motion.h1
            className="text-3xl sm:text-4xl font-bold text-[var(--rinads-white)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Contact
          </motion.h1>
          <motion.p
            className="mt-4 text-[var(--foreground)]/80 text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Reach out for a free consultation or support.
          </motion.p>
          <motion.div
            className="mt-12 rounded-2xl border border-[var(--rinads-primary)]/30 bg-white/5 p-8 space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[var(--foreground)]/80 flex items-center gap-2">
              <span aria-hidden>📞</span> +91 89211 95996
            </p>
            <p className="text-[var(--foreground)]/80 flex items-center gap-2">
              <span aria-hidden>🌐</span> www.rinads.com
            </p>
            <p className="text-[var(--foreground)]/80 flex items-center gap-2">
              <span aria-hidden>💬</span> WhatsApp available
            </p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
