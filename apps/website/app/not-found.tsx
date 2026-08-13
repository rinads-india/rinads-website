import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-[var(--rinads-white)]">Page not found</h1>
      <p className="text-[var(--foreground)]/80">That route is not part of the Public Experience.</p>
      <Link
        href="/"
        className="rounded-xl bg-[var(--rinads-primary)] px-4 py-2 text-white font-medium"
      >
        Back home
      </Link>
    </main>
  );
}
