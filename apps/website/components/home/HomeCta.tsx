import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomeCta() {
  return (
    <section className="relative z-40 bg-surface px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-black leading-tight text-foreground md:text-5xl">
          Ready to simplify your business?
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">Start with RINADS.</p>
        <Link
          href="/signup"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-rinads-primary px-8 py-4 text-base font-semibold text-white transition hover:bg-rinads-primary-dark"
        >
          Get Started
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
