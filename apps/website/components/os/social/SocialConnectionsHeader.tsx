"use client";

interface Props {
  orgName?: string;
  connectedCount: number;
}

export function SocialConnectionsHeader({ orgName, connectedCount }: Props) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">Social Connections</h2>
        {orgName && (
          <p className="text-sm text-white/50">
            {orgName} · {connectedCount} channel{connectedCount !== 1 ? "s" : ""} connected
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-600/20 px-2.5 py-0.5 text-xs font-medium text-blue-300 border border-blue-500/20">
          Phase 1 — Meta
        </span>
      </div>
    </div>
  );
}
