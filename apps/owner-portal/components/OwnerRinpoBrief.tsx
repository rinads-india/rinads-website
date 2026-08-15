import { Card } from "@rinads/ui";
import {
  commerce,
  demoContext,
  getDailyBriefing,
  listRinpoTools,
  operations,
} from "@/lib/commerce";

export function OwnerRinpoBrief() {
  const ctx = demoContext();
  const brief = getDailyBriefing(
    {
      catalog: commerce.catalog,
      cart: commerce.cart,
      order: commerce.order,
      support: commerce.support,
    },
    {
      lowStock: operations.lowStock,
      workQueue: operations.workQueue,
      purchaseOrders: operations.purchaseOrders,
      returns: operations.returns,
      fulfilment: operations.fulfilment,
      ledger: operations.ledger,
      audit: operations.audit,
    },
    ctx
  );
  const ownerTools = listRinpoTools({ ownerOnly: true });

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">RINPO owner brief</h3>
        <span className="text-xs text-muted-foreground">{ownerTools.length} READ tools registered</span>
      </div>
      <p className="text-sm text-muted-foreground">{brief.message}</p>
      {brief.ok && brief.data && typeof brief.data === "object" ? (
        <pre className="max-h-40 overflow-auto rounded bg-surface-muted p-2 text-xs">
          {JSON.stringify(brief.data, null, 2)}
        </pre>
      ) : null}
    </Card>
  );
}
