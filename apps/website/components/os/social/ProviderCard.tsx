"use client";
import { useState } from "react";
import type { SocialProviderMeta } from "@/lib/social-connections/types";

interface Props {
  meta: SocialProviderMeta;
  onConnect: (providerId: string) => Promise<void>;
  disabled?: boolean;
}

export function ProviderCard({ meta, onConnect, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (loading || disabled || meta.phase !== 1) return;
    setLoading(true);
    try {
      await onConnect(meta.id);
    } finally {
      setLoading(false);
    }
  };

  const available = meta.phase === 1;

  return (
    <div className="os-glass rounded-xl p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xl">
          {meta.icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{meta.name}</p>
          {!available && (
            <p className="text-xs text-white/40">
              Coming {meta.phase === 2 ? "soon" : "later"}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-white/60 line-clamp-2">{meta.description}</p>

      <button
        type="button"
        onClick={handleConnect}
        disabled={!available || loading || disabled}
        className={
          available && !disabled
            ? "mt-auto rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
            : "mt-auto rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/40 cursor-not-allowed"
        }
      >
        {loading ? "Redirecting…" : available ? "Connect" : "Unavailable"}
      </button>
    </div>
  );
}
