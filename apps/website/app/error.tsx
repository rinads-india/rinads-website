"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-[var(--rinads-white)]">Something went wrong</h1>
      <p className="text-[var(--foreground)]/80 max-w-md">
        The Public Experience hit an unexpected error. You can try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-[var(--rinads-primary)] px-4 py-2 text-white font-medium"
      >
        Try again
      </button>
    </main>
  );
}
