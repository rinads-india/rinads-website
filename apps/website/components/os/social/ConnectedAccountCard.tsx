"use client";
import { useState } from "react";
import { ConnectionHealthChip } from "./ConnectionHealthChip";
import type { SocialConnectionView } from "@/lib/social-connections/types";

interface Props {
  connection: SocialConnectionView;
  onDisconnect: (connectionId: string, credentialId: string) => Promise<void>;
  onReconnect: (providerId: string) => Promise<void>;
  canDisconnect: boolean;
}

export function ConnectedAccountCard({
  connection,
  onDisconnect,
  onReconnect,
  canDisconnect,
}: Props) {
  const [loading, setLoading] = useState<"disconnect" | "reconnect" | null>(null);

  const needsReconnect =
    connection.healthState === "token_expired" || connection.healthState === "revoked";

  const handleDisconnect = async () => {
    if (!canDisconnect || loading) return;
    setLoading("disconnect");
    try {
      await onDisconnect(connection.id, connection.credentialId);
    } finally {
      setLoading(null);
    }
  };

  const handleReconnect = async () => {
    if (loading) return;
    setLoading("reconnect");
    try {
      await onReconnect(connection.providerId);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="os-glass rounded-xl p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{connection.providerIcon}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{connection.displayName}</p>
            <p className="truncate text-xs text-white/50">{connection.providerName}</p>
          </div>
        </div>
        <ConnectionHealthChip state={connection.healthState} />
      </div>

      {connection.profileImageUrl && (
        <img
          src={connection.profileImageUrl}
          alt={connection.displayName}
          className="h-8 w-8 rounded-full object-cover"
        />
      )}

      <p className="text-xs text-white/40">
        Connected {new Date(connection.connectedAt).toLocaleDateString()}
      </p>

      <div className="flex gap-2 flex-wrap">
        {needsReconnect && (
          <button
            type="button"
            onClick={handleReconnect}
            disabled={loading !== null}
            className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-orange-500 disabled:opacity-60"
          >
            {loading === "reconnect" ? "Redirecting…" : "Reconnect"}
          </button>
        )}
        {canDisconnect && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={loading !== null}
            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:opacity-60"
          >
            {loading === "disconnect" ? "Disconnecting…" : "Disconnect"}
          </button>
        )}
      </div>
    </div>
  );
}
