"use client";

import Link from "next/link";
import { Logo } from "@/components/rinads/Logo";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center rinads-aurora"
    >
      <Logo className="h-8" />
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
        Something went wrong
      </p>
      <h1 className="text-4xl font-black text-white md:text-5xl">Please try again</h1>
      <p className="max-w-md text-slate-300">
        The page hit an unexpected error. You can retry, or go back to the homepage.
      </p>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center justify-center rounded-full bg-rinads-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:border-rinads-primary hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
