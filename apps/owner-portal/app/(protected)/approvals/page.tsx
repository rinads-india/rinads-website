import Link from "next/link";
import { operations, opsContext } from "@/lib/commerce";
import { ApprovalQueue } from "./ApprovalQueue";

export default function ApprovalsPage() {
  const ctx = opsContext();
  const approvals = operations.runtime.listApprovals(ctx.organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Runtime approvals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            HIGH/CRITICAL workflow actions awaiting owner decision.
          </p>
        </div>
        <Link href="/runtime" className="text-sm text-rinads-primary hover:underline">
          Runtime dashboard
        </Link>
      </div>

      <ApprovalQueue approvals={approvals} />
    </div>
  );
}
