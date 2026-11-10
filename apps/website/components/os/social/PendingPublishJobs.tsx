"use client";
import { useState } from "react";

interface PublishJob {
  id: string;
  status: string;
  connectionDisplayName: string;
  providerIcon: string;
  textPreview: string;
  submittedAt: string;
  submittedByEmail?: string;
}

interface Props {
  jobs: PublishJob[];
  canApprove: boolean;
  onApprove: (jobId: string) => Promise<void>;
  onReject: (jobId: string, reason?: string) => Promise<void>;
  onCancel: (jobId: string) => Promise<void>;
}

export function PendingPublishJobs({ jobs, canApprove, onApprove, onReject, onCancel }: Props) {
  const [acting, setActing] = useState<Record<string, boolean>>({});

  const withLoading = async (jobId: string, fn: () => Promise<void>) => {
    setActing((a) => ({ ...a, [jobId]: true }));
    try { await fn(); } finally {
      setActing((a) => ({ ...a, [jobId]: false }));
    }
  };

  if (jobs.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
        Approval Queue ({jobs.length})
      </h3>
      <div className="space-y-2">
        {jobs.map((job) => (
          <div key={job.id} className="os-glass rounded-xl p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            <span className="text-xl shrink-0">{job.providerIcon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/50 mb-1">
                {job.connectionDisplayName} · {new Date(job.submittedAt).toLocaleString()}
                {job.submittedByEmail && ` · ${job.submittedByEmail}`}
              </p>
              <p className="text-sm text-white/80 line-clamp-3">{job.textPreview}</p>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {canApprove && job.status === "pending_approval" && (
                <button
                  type="button"
                  disabled={acting[job.id]}
                  onClick={() => withLoading(job.id, () => onApprove(job.id))}
                  className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
                >
                  Approve
                </button>
              )}
              {canApprove && job.status === "pending_approval" && (
                <button
                  type="button"
                  disabled={acting[job.id]}
                  onClick={() => withLoading(job.id, () => onReject(job.id))}
                  className="rounded-lg border border-red-500/40 px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Reject
                </button>
              )}
              <button
                type="button"
                disabled={acting[job.id]}
                onClick={() => withLoading(job.id, () => onCancel(job.id))}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs font-medium text-white/50 hover:text-white/70 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
