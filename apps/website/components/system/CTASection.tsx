"use client";

import Link from "next/link";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { CTAS } from "@/lib/product-ia";

type CTASectionProps = {
  headline: string;
  summary?: string;
  className?: string;
};

export function CTASection({ headline, summary, className = "" }: CTASectionProps) {
  const { openPhoneScreen } = useRinpo();

  return (
    <section className={`border-t border-white/10 px-6 py-20 md:px-12 lg:px-20 ${className}`}>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">{headline}</h2>
        {summary ? <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">{summary}</p> : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openPhoneScreen("chat")}
            className="rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
          >
            {CTAS.primary.label}
          </button>
          <Link
            href={CTAS.secondary.href}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-rinads-primary/50"
          >
            {CTAS.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
