"use client";
import type { ConnectionHealthState } from "@/lib/social-connections/types";

const CONFIG: Record<ConnectionHealthState, { label: string; className: string }> = {
  healthy: { label: "Connected", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  degraded: { label: "Degraded", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  token_expired: { label: "Expired", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  revoked: { label: "Revoked", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  error: { label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

interface Props {
  state: ConnectionHealthState;
}

export function ConnectionHealthChip({ state }: Props) {
  const { label, className } = CONFIG[state] ?? CONFIG.error;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
