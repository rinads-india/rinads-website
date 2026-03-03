"use client";
import { GameBackground } from "@/components/layout/GameBackground";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";

export default function RinadsCloudPage() {
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
            Rinads Cloud
          </motion.h1>
          <motion.p
            className="mt-4 text-[var(--foreground)]/80 text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            RINADS® | Business Cloud. Software • Websites • Marketing. AI-powered automation systems. India • Global.
          </motion.p>
          <motion.div
            className="mt-12 rounded-2xl border border-[var(--rinads-primary)]/30 bg-white/5 p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[var(--foreground)]/80">
              RINADS Intelligence and full ERP features will be available here. Ask RINPO to navigate or open the client portal from the phone.
            </p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
