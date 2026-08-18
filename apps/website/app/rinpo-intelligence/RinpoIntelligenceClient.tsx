"use client";

import Link from "next/link";
import { ProductPageShell } from "@/components/product/ProductPageShell";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const CONTEXT_PROMPTS = [
  { module: "Leads", prompt: "Which leads should I follow up with today?" },
  { module: "Projects", prompt: "Which projects are at risk?" },
  { module: "Finance", prompt: "What invoices are overdue?" },
  { module: "Marketing", prompt: "Which campaign needs attention?" },
  { module: "Analytics", prompt: "What changed this month?" },
  { module: "Tasks", prompt: "Prioritize today's work." },
];

const ATTENTION_ITEMS = [
  "3 overdue invoices",
  "7 leads need follow-up",
  "2 projects are behind schedule",
  "1 campaign is underperforming",
];

export function RinpoIntelligenceClient() {
  const { openPhoneScreen } = useRinpo();

  return (
    <ProductPageShell>
      <section className="bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
            RINPO Intelligence
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Meet RINPO Intelligence
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            Your business has data. RINPO turns it into direction.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div className="rounded-3xl border border-rinads-primary/20 bg-rinads-primary/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rinads-primary">RINPO</p>
            <p className="mt-4 text-lg font-semibold">&quot;What needs my attention?&quot;</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {ATTENTION_ITEMS.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => openPhoneScreen("chat", "Show me what to do next.")}
              className="mt-8 w-full rounded-xl bg-rinads-primary py-3 text-sm font-semibold text-white"
            >
              Show me what to do
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-black text-foreground">Ask RINPO in context</h2>
            <p className="mt-4 text-muted-foreground">
              RINPO is not merely a chatbot — it&apos;s an interface to your Business OS.
            </p>
            <div className="mt-8 space-y-4">
              {CONTEXT_PROMPTS.map(({ module, prompt }) => (
                <button
                  key={module}
                  type="button"
                  onClick={() => openPhoneScreen("chat", prompt)}
                  className="block w-full rounded-xl border border-rinads-primary/15 p-4 text-left transition hover:border-rinads-primary/40"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-rinads-primary">
                    {module}
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground">Ask RINPO: &quot;{prompt}&quot;</p>
                </button>
              ))}
            </div>
            <Link href="/rinpo-story" className="mt-8 inline-block text-sm font-semibold text-rinads-primary hover:underline">
              Read the RINPO story →
            </Link>
          </div>
        </div>
      </section>
    </ProductPageShell>
  );
}
