import { Badge } from "@rinads/ui";
import Link from "next/link";
import type { WhatsAppReadiness } from "@rinads/salon-server";
import { WhatsAppSettingsForm } from "./WhatsAppSettingsForm";

export function WhatsAppReadinessCard({
  readiness,
  canManage,
}: {
  readiness: WhatsAppReadiness;
  canManage: boolean;
}) {
  return (
    <div id="communications" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-title">Communications</p>
          <p className="text-sm text-muted-foreground">{readiness.operatorSummary}</p>
        </div>
        <Badge className={readiness.readyForSandboxTick ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"}>
          {readiness.readyForSandboxTick ? "Configured · worker still off" : "Sending off"}
        </Badge>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {readiness.checklist.map((item) => (
          <li key={item.key} className="rounded-xl border border-rinads-primary/10 p-3">
            <p className="text-sm font-medium text-foreground">
              {item.ok ? "✓" : "○"} {item.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Delivery log with retries:{" "}
        <Link href="/communications" className="text-rinads-primary underline">
          Open Communications
        </Link>
        . Ops steps: <code>docs/deployment/RGLOW_WHATSAPP_GOLIVE.md</code>.
      </p>

      {canManage ? (
        <WhatsAppSettingsForm
          sendEnabled={readiness.sendEnabled}
          mode={readiness.mode}
          sandboxAllowlist={readiness.sandboxAllowlist}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Only an admin can change WhatsApp mode, the send flag, or the sandbox allowlist.</p>
      )}
    </div>
  );
}
