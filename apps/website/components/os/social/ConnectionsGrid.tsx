"use client";
import { ConnectedAccountCard } from "./ConnectedAccountCard";
import { ProviderCard } from "./ProviderCard";
import type { SocialConnectionView, SocialProviderMeta } from "@/lib/social-connections/types";

interface Props {
  connections: SocialConnectionView[];
  allProviders: SocialProviderMeta[];
  onConnect: (providerId: string) => Promise<void>;
  onDisconnect: (connectionId: string, credentialId: string) => Promise<void>;
  onReconnect: (providerId: string) => Promise<void>;
  canDisconnect: boolean;
}

export function ConnectionsGrid({
  connections,
  allProviders,
  onConnect,
  onDisconnect,
  onReconnect,
  canDisconnect,
}: Props) {
  const connectedProviderIds = new Set(connections.map((c) => c.providerId));
  const availableProviders = allProviders.filter((p) => !connectedProviderIds.has(p.id as never));

  return (
    <div className="space-y-6">
      {connections.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Connected Accounts
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((conn) => (
              <ConnectedAccountCard
                key={conn.id}
                connection={conn}
                onDisconnect={onDisconnect}
                onReconnect={onReconnect}
                canDisconnect={canDisconnect}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          Available Channels
        </h3>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {availableProviders.map((p) => (
            <ProviderCard key={p.id} meta={p} onConnect={onConnect} />
          ))}
        </div>
      </section>
    </div>
  );
}
