"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input } from "@rinads/ui";
import type { RinpoToolName } from "@rinads/intelligence";
import { runRinpoTool } from "@/app/actions/rinpo";

const TOOLS: { tool: RinpoToolName; label: string; placeholder: string; argKey: string }[] = [
  { tool: "order_status", label: "Order status", placeholder: "Order ID", argKey: "orderId" },
  {
    tool: "create_ticket",
    label: "Create ticket",
    placeholder: "Describe your issue",
    argKey: "body",
  },
  {
    tool: "similar_products",
    label: "Similar products",
    placeholder: "Product ID",
    argKey: "productId",
  },
];

type Props = {
  route: string;
  orderId?: string;
};

export function RinpoPanel({ route, orderId }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [argValue, setArgValue] = useState(orderId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRun() {
    const cfg = TOOLS[selected];
    startTransition(async () => {
      const result = await runRinpoTool({
        tool: cfg.tool,
        args: {
          [cfg.argKey]: argValue,
          ...(cfg.tool === "create_ticket" ? { subject: "Portal support request" } : {}),
          ...(cfg.tool === "order_status" && orderId && !argValue ? { orderId } : {}),
        },
      });
      setMessage(result.message);
    });
  }

  return (
    <aside aria-label="RINPO assistant" className="border-t border-rinads-primary/15 lg:border-t-0 lg:border-l">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-surface-muted lg:hidden"
        aria-expanded={open}
      >
        <span>RINPO Assistant</span>
        <span className="text-rinads-primary">{open ? "−" : "+"}</span>
      </button>
      <div className={`${open ? "block" : "hidden"} p-4 lg:block`}>
        <Card className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rinads-primary">
              RINPO
            </p>
            <h2 className="text-base font-semibold text-foreground">Commerce assistant</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Context: {route}
              {orderId ? ` · order ${orderId}` : ""}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="rinpo-tool" className="text-xs font-medium text-muted-foreground">
              Tool
            </label>
            <select
              id="rinpo-tool"
              value={selected}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="w-full rounded-lg border border-rinads-primary/20 bg-surface px-3 py-2 text-sm"
            >
              {TOOLS.map((t, i) => (
                <option key={t.tool} value={i}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="rinpo-arg" className="text-xs font-medium text-muted-foreground">
              {TOOLS[selected].label}
            </label>
            <Input
              id="rinpo-arg"
              value={argValue}
              onChange={(e) => setArgValue(e.target.value)}
              placeholder={TOOLS[selected].placeholder}
            />
          </div>

          <Button type="button" onClick={handleRun} disabled={pending} className="w-full">
            {pending ? "Running…" : "Run tool"}
          </Button>

          {message ? (
            <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground" role="status">
              {message}
            </p>
          ) : null}

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            RINPO cannot submit payments or override shipping and tax. All actions use live
            commerce-server data.
          </p>
        </Card>
      </div>
    </aside>
  );
}
