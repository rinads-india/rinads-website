"use client";

import { useActionState } from "react";
import { Badge, Button, Card } from "@rinads/ui";
import { approveRuntimeAction, rejectRuntimeAction, type ApprovalActionState } from "./actions";

type ApprovalItem = {
  id: string;
  actionKey: string;
  reason?: string;
  expiresAt: string;
  riskLevel: string;
};

const initialState: ApprovalActionState = { ok: false };

export function ApprovalQueue({ approvals }: { approvals: ApprovalItem[] }) {
  const [approveState, approveAction, approvePending] = useActionState(approveRuntimeAction, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectRuntimeAction, initialState);
  const feedback = approveState.message ?? rejectState.message;

  if (approvals.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">No pending approvals.</p>
      </Card>
    );
  }

  return (
    <>
      {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
      <ul className="space-y-3">
        {approvals.map((approval) => (
          <li key={approval.id}>
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{approval.actionKey}</p>
                <p className="text-sm text-muted-foreground">{approval.reason ?? "Workflow step approval"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Expires {new Date(approval.expiresAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={approval.riskLevel === "CRITICAL" ? "danger" : "warning"}>
                  {approval.riskLevel}
                </Badge>
                <form action={approveAction}>
                  <input type="hidden" name="approvalId" value={approval.id} />
                  <Button type="submit" disabled={approvePending}>
                    Approve
                  </Button>
                </form>
                <form action={rejectAction}>
                  <input type="hidden" name="approvalId" value={approval.id} />
                  <Button type="submit" variant="secondary" disabled={rejectPending}>
                    Reject
                  </Button>
                </form>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
