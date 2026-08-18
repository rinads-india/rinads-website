"use client";

import Link from "next/link";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const ATTENTION_ITEMS = [
  "3 overdue invoices",
  "7 leads need follow-up",
  "2 projects are behind schedule",
  "1 campaign is underperforming",
];

export function RinpoSection() {
  const { openPhoneScreen } = useRinpo();

  return (
    <section className="relative z-40 bg-rinads-primary-darkest px-6 py-24 text-white md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
            RINPO Intelligence
          </p>
          <h2 className="text-4xl font-black leading-tight md:text-5xl">
            Your business has data. RINPO turns it into direction.
          </h2>
          <p className="mt-6 text-lg text-white/70">
            RINPO works across your RINADS workspace to help you understand what&apos;s happening,
            identify what needs attention and recommend what to do next.
          </p>
          <Link
            href="/rinpo-intelligence"
            className="mt-8 inline-block text-sm font-semibold text-rinads-primary hover:underline"
          >
            Learn about RINPO Intelligence →
          </Link>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rinads-primary">RINPO</p>
          <p className="mt-4 text-lg font-semibold">&quot;What needs my attention?&quot;</p>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            {ATTENTION_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rinads-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => openPhoneScreen("chat", "Show me what to do next in my business.")}
            className="mt-8 w-full rounded-xl bg-rinads-primary py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
          >
            Show me what to do
          </button>
        </div>
      </div>
    </section>
  );
}
