"use client";
import { useState } from "react";
import type { SocialConnectionView } from "@/lib/social-connections/types";

interface Props {
  connections: SocialConnectionView[];
  onSubmit: (data: {
    connectionId: string;
    text: string;
    idempotencyKey: string;
  }) => Promise<{ jobId: string; status: string } | { error: string }>;
}

export function SocialPublishForm({ connections, onSubmit }: Props) {
  const [connectionId, setConnectionId] = useState(connections[0]?.id ?? "");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ jobId?: string; error?: string } | null>(null);

  const healthyConnections = connections.filter((c) => c.healthState === "healthy");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionId || !text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const idempotencyKey = crypto.randomUUID();
    try {
      const res = await onSubmit({ connectionId, text: text.trim(), idempotencyKey });
      if ("error" in res) {
        setResult({ error: res.error });
      } else {
        setResult({ jobId: res.jobId });
        setText("");
      }
    } catch {
      setResult({ error: "Failed to submit post. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (healthyConnections.length === 0) {
    return (
      <div className="os-glass rounded-xl p-4 text-sm text-white/50">
        Connect a social account above to start publishing.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="os-glass rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-white">New Post</h3>

      <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-300">
        All posts require staff approval before publishing.
      </div>

      <select
        value={connectionId}
        onChange={(e) => setConnectionId(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {healthyConnections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.providerIcon} {c.displayName} ({c.providerName})
          </option>
        ))}
      </select>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What would you like to post?"
        rows={4}
        maxLength={2200}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30">{text.length}/2200</span>
        <button
          type="submit"
          disabled={loading || !text.trim() || !connectionId}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit for Approval"}
        </button>
      </div>

      {result?.error && (
        <p className="text-xs text-red-400">{result.error}</p>
      )}
      {result?.jobId && (
        <p className="text-xs text-green-400">
          Submitted! Job ID: <code className="font-mono">{result.jobId}</code>
        </p>
      )}
    </form>
  );
}
