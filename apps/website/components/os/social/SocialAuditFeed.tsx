"use client";

interface AuditEntry {
  id: string;
  action: string;
  actorId: string;
  actorEmail?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface Props {
  entries: AuditEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  "social.connection.created": "Connected account",
  "social.connection.disconnected": "Disconnected account",
  "social.publish.submitted": "Post submitted",
  "social.publish.approved": "Post approved",
  "social.publish.rejected": "Post rejected",
  "social.publish.cancelled": "Post cancelled",
};

export function SocialAuditFeed({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
        Recent Activity
      </h3>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/20 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-white/70">
                {ACTION_LABELS[entry.action] ?? entry.action}
              </span>
              {entry.metadata?.provider && (
                <span className="ml-1 text-xs text-white/40">
                  · {String(entry.metadata.provider)}
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-white/30">
              {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
