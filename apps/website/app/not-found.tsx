import Link from "next/link";
import { Logo } from "@/components/rinads/Logo";

export default function NotFound() {
  return (
    <main
      id="main"
      className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center rinads-aurora"
    >
      <Logo className="h-8" />
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
        404
      </p>
      <h1 className="text-4xl font-black text-white md:text-5xl">Page not found</h1>
      <p className="max-w-md text-slate-300">
        That link doesn&apos;t go anywhere on Rinads. Head home to keep exploring.
      </p>
      <Link
        href="/"
        className="inline-flex h-12 items-center justify-center rounded-full bg-rinads-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Back home
      </Link>
    </main>
  );
}
