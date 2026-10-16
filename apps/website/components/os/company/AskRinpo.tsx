"use client";

import { useOsShell } from "@/components/os/BusinessOsShell";

export function AskRinpo({ prompt = "How is RINADS today?", label = "Ask RINPO: How is RINADS today?" }: { prompt?: string; label?: string }) {
  const { askRinpo } = useOsShell();
  return (
    <button type="button" onClick={() => askRinpo(prompt)} className="inline-flex min-h-11 items-center rounded-xl bg-black px-4 text-sm font-semibold text-white">
      {label}
    </button>
  );
}
