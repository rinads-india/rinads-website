"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SocialConnectionsHeader } from "@/components/os/social/SocialConnectionsHeader";
import { ConnectionsGrid } from "@/components/os/social/ConnectionsGrid";
import { SocialPublishForm } from "@/components/os/social/SocialPublishForm";
import { PendingPublishJobs } from "@/components/os/social/PendingPublishJobs";
import { SocialAuditFeed } from "@/components/os/social/SocialAuditFeed";
import type { SocialConnectionView, SocialProviderMeta } from "@/lib/social-connections/types";
import type { OsCapabilityTier } from "@/lib/os-org-role";

interface PendingJob {
  id: string;
  status: string;
  connectionDisplayName: string;
  providerIcon: string;
  textPreview: string;
  submittedAt: string;
  submittedByEmail?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actorId: string;
  actorEmail?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface Props {
  initialConnections: SocialConnectionView[];
  allProviders: SocialProviderMeta[];
  organizationId: string;
  orgName?: string;
  tier: OsCapabilityTier;
  canDisconnect: boolean;
  canApprove: boolean;
  initialAuditEntries: AuditEntry[];
  initialPendingJobs: PendingJob[];
}

export function SocialConnectionsClientShell({
  initialConnections,
  allProviders,
  orgName,
  canDisconnect,
  canApprove,
  initialAuditEntries,
  initialPendingJobs,
}: Props) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [pendingJobs, setPendingJobs] = useState(initialPendingJobs);
  const [auditEntries] = useState(initialAuditEntries);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async (providerId: string) => {
    setError(null);
    try {
      const res = await fetch("/api/social/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start connection.");
        return;
      }
      // Redirect to provider OAuth
      window.location.href = data.authorizationUrl;
    } catch {
      setError("Failed to start connection. Please try again.");
    }
  }, []);

  const handleDisconnect = useCallback(async (connectionId: string, credentialId: string) => {
    setError(null);
    try {
      const res = await fetch("/api/social/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, credentialId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to disconnect.");
        return;
      }
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch {
      setError("Failed to disconnect. Please try again.");
    }
  }, []);

  const handleReconnect = useCallback(async (providerId: string) => {
    return handleConnect(providerId);
  }, [handleConnect]);

  const handleSubmitPost = useCallback(async (data: {
    connectionId: string;
    text: string;
    idempotencyKey: string;
  }) => {
    const res = await fetch("/api/social/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  }, []);

  const handleApprove = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/social/publish/${jobId}/approve`, { method: "POST" });
    if (res.ok) {
      setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
      router.refresh();
    }
  }, [router]);

  const handleReject = useCallback(async (jobId: string, reason?: string) => {
    const res = await fetch(`/api/social/publish/${jobId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
      router.refresh();
    }
  }, [router]);

  const handleCancel = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/social/publish/${jobId}/cancel`, { method: "POST" });
    if (res.ok) {
      setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SocialConnectionsHeader
        orgName={orgName}
        connectedCount={connections.length}
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 text-xs underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <ConnectionsGrid
        connections={connections}
        allProviders={allProviders}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onReconnect={handleReconnect}
        canDisconnect={canDisconnect}
      />

      <SocialPublishForm
        connections={connections}
        onSubmit={handleSubmitPost}
      />

      <PendingPublishJobs
        jobs={pendingJobs}
        canApprove={canApprove}
        onApprove={handleApprove}
        onReject={handleReject}
        onCancel={handleCancel}
      />

      <SocialAuditFeed entries={auditEntries} />
    </div>
  );
}
