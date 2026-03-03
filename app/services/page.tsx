"use client";
import { GameBackground } from "@/components/layout/GameBackground";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";

export default function ServicesPage() {
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
            Services
          </motion.h1>
          <motion.p
            className="mt-4 text-[var(--foreground)]/80 text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            RINADS delivers growth through digital marketing, custom software, and AI-powered automation.
          </motion.p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Digital Marketing", items: ["SEO", "Social Media", "Performance Ads"], icon: "📢" },
              { title: "Custom Software", items: ["Web Apps", "Mobile Apps", "ERP Systems"], icon: "💻" },
              { title: "AI Automation", items: ["Chatbots", "Workflow Automation", "AI Tools"], icon: "🤖" },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                className="rounded-2xl border border-[var(--rinads-primary)]/30 bg-white/5 p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <span className="text-2xl">{s.icon}</span>
                <h2 className="mt-3 text-xl font-semibold text-[var(--rinads-white)]">{s.title}</h2>
                <ul className="mt-2 text-sm text-[var(--foreground)]/70 space-y-1">
                  {s.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
