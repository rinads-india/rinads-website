"use client";
import Link from "next/link";
import { GameBackground } from "@/components/layout/GameBackground";
import { Header } from "@/components/layout/Header";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <>
      <GameBackground />
      <Header />
      <main className="min-h-screen min-h-[100dvh] pt-14 sm:pt-16 overflow-x-hidden safe-area-inset-top">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-12 sm:py-16 md:py-20 lg:py-24">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--rinads-white)] tracking-tight">
              RINADS
            </h1>
            <p className="mt-2 text-lg sm:text-xl text-[var(--rinads-primary)] font-medium">
              Business simplified
            </p>
            <p className="mt-6 text-[var(--foreground)]/80 text-base sm:text-lg">
              Digital Marketing & Custom Software Solutions That Drive Growth.
              AI-powered automation systems. Built to run businesses.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="rounded-xl bg-[var(--rinads-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] transition-opacity"
              >
                Get a Free Consultation
              </Link>
              <Link
                href="/services"
                className="rounded-xl border-2 border-[var(--rinads-primary)] px-6 py-3 text-sm font-semibold text-[var(--rinads-primary)] hover:bg-[var(--rinads-primary)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] transition-colors"
              >
                View Our Work
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-[var(--rinads-white)] text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            What we offer
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            {[
              {
                title: "Digital Marketing",
                desc: "SEO, Social Media, Performance Ads.",
                icon: "📢",
              },
              {
                title: "Custom Software Development",
                desc: "Web Apps, Mobile Apps, ERP Systems.",
                icon: "💻",
              },
              {
                title: "AI Automation",
                desc: "Chatbots, Workflow Automation, AI Tools.",
                icon: "🤖",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="rounded-2xl border border-[var(--rinads-primary)]/30 bg-white/5 p-6 hover:border-[var(--rinads-primary)]/50 hover:bg-white/[0.07] transition-colors"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-2xl">{card.icon}</span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--rinads-white)]">{card.title}</h3>
                <p className="mt-2 text-sm text-[var(--foreground)]/70">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-24">
          <motion.div
            className="rounded-2xl border border-[var(--rinads-primary)]/30 bg-white/5 p-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-[var(--foreground)]/80">
              Tap <strong className="text-[var(--rinads-primary)]">RINPO</strong> in the corner to open RINADS Intelligence—chat, explore services, and get help.
            </p>
          </motion.div>
        </section>
      </main>
    </>
  );
}
