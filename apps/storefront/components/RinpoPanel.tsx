"use client";

import { useState } from "react";
import type { RinpoToolName } from "@rinads/intelligence";
import { runRinpoToolAction } from "@/lib/rinpo-actions";
import { Button, Card } from "@rinads/ui";

type RinpoPanelProps = {
  route: string;
  productId?: string;
  cartId?: string;
  orderId?: string;
  slug?: string;
  compact?: boolean;
};

const TOOLS: { tool: RinpoToolName; label: string; needsSlug?: boolean; needsOrder?: boolean }[] = [
  { tool: "similar_products", label: "Similar products" },
  { tool: "compare_variants", label: "Compare variants", needsSlug: true },
  { tool: "order_status", label: "Order status", needsOrder: true },
  { tool: "create_ticket", label: "Get help" },
];

export function RinpoPanel({ route, productId, cartId, orderId, slug, compact }: RinpoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  async function runTool(tool: RinpoToolName) {
    setLoading(true);
    setMessage(null);
    setData(null);

    const args: Record<string, string | number | undefined> = {
      productId,
      cartId,
      orderId,
      slug,
    };

    if (tool === "create_ticket") {
      args.subject = "Storefront assistance";
      args.body = `Help requested on ${route}`;
    }

    const result = await runRinpoToolAction({ tool, args });

    setMessage(result.message);
    setData(result.data ?? null);
    setLoading(false);
    setExpanded(true);
  }

  const maxHeight = compact ? "max-h-[28vh]" : "max-h-[40vh]";

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 w-[min(100vw-2rem,22rem)] ${maxHeight} flex flex-col overflow-hidden rounded-xl border border-rinads-primary/25 bg-surface shadow-lg`}
      aria-label="RINPO assistant panel"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rinads-primary/15 bg-surface-muted/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rinads-primary text-xs font-bold text-white">
            R
          </span>
          <span className="text-sm font-semibold text-foreground">RINPO</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {expanded ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-xs text-muted-foreground">Connected intelligence · {route}</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {TOOLS.filter((t) => {
              if (t.needsSlug && !slug) return false;
              if (t.needsOrder && !orderId) return false;
              if (t.tool === "similar_products" && !productId) return false;
              return true;
            }).map((t) => (
              <Button
                key={t.tool}
                type="button"
                variant="secondary"
                className="px-2 py-1 text-xs"
                disabled={loading}
                onClick={() => runTool(t.tool)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          {loading ? <p className="text-sm text-muted-foreground">Thinking…</p> : null}
          {message ? (
            <Card className="mb-2 bg-surface-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">{message}</p>
              {data ? (
                <pre className="mt-2 max-h-32 overflow-auto text-xs text-muted-foreground">
                  {JSON.stringify(data, null, 2)}
                </pre>
              ) : null}
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Ask RINPO for product or order help.</p>
          )}
        </div>
      ) : (
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">Tap expand for shopping assistance.</p>
        </div>
      )}
    </div>
  );
}
